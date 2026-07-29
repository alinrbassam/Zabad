import Database from 'better-sqlite3';
import { SuspendedSaleEntity } from '../../shared/types';

export class POSSuspendedService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public holdSale(input: {
    referenceName: string;
    items: {
      productId: string;
      batchId?: string;
      unitId: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      taxRate: number;
    }[];
    cashierId?: string;
    notes?: string;
  }): SuspendedSaleEntity {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    let subtotal = 0;
    input.items.forEach((i) => {
      subtotal += i.quantity * i.unitPrice - i.discount;
    });

    const insertSale = this.db.prepare(`
      INSERT INTO suspended_sales (id, reference_name, cashier_id, subtotal, grand_total, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = this.db.prepare(`
      INSERT INTO suspended_sale_items (id, suspended_sale_id, product_id, batch_id, unit_id, quantity, unit_price, discount, tax_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.db.transaction(() => {
      insertSale.run(
        id,
        input.referenceName,
        input.cashierId || 'cashier',
        subtotal,
        subtotal,
        input.notes || null,
        now,
      );
      for (const item of input.items) {
        insertItem.run(
          crypto.randomUUID(),
          id,
          item.productId,
          item.batchId || null,
          item.unitId,
          item.quantity,
          item.unitPrice,
          item.discount,
          item.taxRate,
        );
      }
    })();

    return {
      id,
      reference_name: input.referenceName,
      cashier_id: input.cashierId,
      subtotal,
      grand_total: subtotal,
      notes: input.notes,
      created_at: now,
    };
  }

  public getSuspendedSales(): SuspendedSaleEntity[] {
    const stmt = this.db.prepare('SELECT * FROM suspended_sales ORDER BY created_at DESC');
    return stmt.all() as SuspendedSaleEntity[];
  }

  public resumeSale(id: string) {
    const sale = this.db.prepare('SELECT * FROM suspended_sales WHERE id = ?').get(id) as
      SuspendedSaleEntity | undefined;
    if (!sale) throw new Error('Suspended sale not found');

    const items = this.db
      .prepare('SELECT * FROM suspended_sale_items WHERE suspended_sale_id = ?')
      .all(id);

    this.db.prepare('DELETE FROM suspended_sales WHERE id = ?').run(id);

    return { sale, items };
  }
}
