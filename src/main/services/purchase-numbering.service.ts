import Database from 'better-sqlite3';

export class PurchaseNumberingService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public generateNextNumber(sequenceKey: 'po' | 'gr' | 'pr' | 'inv'): string {
    const year = new Date().getFullYear();

    const getSeq = this.db.prepare('SELECT * FROM numbering_sequences WHERE key = ?');
    const seq = getSeq.get(sequenceKey) as
      | {
          prefix: string;
          current_number: number;
          padding: number;
          include_year: number;
        }
      | undefined;

    const prefix = seq ? seq.prefix : sequenceKey.toUpperCase();
    let currentNum = seq ? seq.current_number + 1 : 1;
    const padding = seq ? seq.padding : 6;
    const includeYear = seq ? seq.include_year === 1 : true;

    const tableLookups: Array<{ table: string; column: string }> =
      sequenceKey === 'inv'
        ? [
            { table: 'sales_orders', column: 'invoice_number' },
            { table: 'sales_refunds', column: 'refund_number' },
          ]
        : sequenceKey === 'po'
        ? [{ table: 'purchase_orders', column: 'po_number' }]
        : sequenceKey === 'gr'
        ? [{ table: 'goods_receipts', column: 'receipt_number' }]
        : [{ table: 'purchase_returns', column: 'return_number' }];

    const prefixPattern = includeYear ? `${prefix}-${year}-%` : `${prefix}-%`;

    for (const lookup of tableLookups) {
      try {
        const maxRow = this.db
          .prepare(
            `SELECT ${lookup.column} as val FROM ${lookup.table} WHERE ${lookup.column} LIKE ? ORDER BY ${lookup.column} DESC LIMIT 1`,
          )
          .get(prefixPattern) as { val?: string } | undefined;

        if (maxRow?.val) {
          const match = maxRow.val.match(/(\d+)$/);
          if (match) {
            const parsed = parseInt(match[1], 10);
            if (!isNaN(parsed) && parsed >= currentNum) {
              currentNum = parsed + 1;
            }
          }
        }
      } catch {
        // Table might not exist in mock tests
      }
    }

    const formatCandidate = (num: number): string => {
      const numStr = String(num).padStart(padding, '0');
      return includeYear ? `${prefix}-${year}-${numStr}` : `${prefix}-${numStr}`;
    };

    let nextNumber = formatCandidate(currentNum);

    // Ensure no collision with any existing row
    for (let attempt = 0; attempt < 1000; attempt++) {
      let exists = false;
      for (const lookup of tableLookups) {
        try {
          const found = this.db
            .prepare(`SELECT 1 as found FROM ${lookup.table} WHERE ${lookup.column} = ? LIMIT 1`)
            .get(nextNumber) as { found?: number } | undefined;
          if (found) {
            exists = true;
            break;
          }
        } catch {
          // Ignore in mock tests
        }
      }
      if (!exists) break;
      currentNum++;
      nextNumber = formatCandidate(currentNum);
    }

    try {
      const updateSeq = this.db.prepare(`
        UPDATE numbering_sequences
        SET current_number = ?, updated_at = CURRENT_TIMESTAMP
        WHERE key = ?
      `);
      updateSeq.run(currentNum, sequenceKey);
    } catch {
      // Ignore if numbering_sequences not present
    }

    return nextNumber;
  }
}
