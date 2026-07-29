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
    const currentNum = seq ? seq.current_number + 1 : 1;
    const padding = seq ? seq.padding : 6;
    const includeYear = seq ? seq.include_year === 1 : true;

    const numStr = String(currentNum).padStart(padding, '0');
    const nextNumber = includeYear ? `${prefix}-${year}-${numStr}` : `${prefix}-${numStr}`;

    const updateSeq = this.db.prepare(`
      UPDATE numbering_sequences
      SET current_number = ?, updated_at = CURRENT_TIMESTAMP
      WHERE key = ?
    `);
    updateSeq.run(currentNum, sequenceKey);

    return nextNumber;
  }
}
