import Database from 'better-sqlite3';
import { BatchEntity } from '@shared/types';

export class BatchRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public createBatch(batch: {
    productId: string;
    batchNumber: string;
    supplierId?: string;
    mfgDate?: string;
    expiryDate?: string;
    receivedQty: number;
    unitCost?: number;
    notes?: string;
  }): BatchEntity {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    let status: BatchEntity['status'] = 'Active';
    if (batch.expiryDate) {
      const exp = new Date(batch.expiryDate).getTime();
      const today = new Date().getTime();
      if (exp <= today) status = 'Expired';
      else if (exp - today <= 30 * 24 * 60 * 60 * 1000) status = 'Expiring soon';
    }

    const stmt = this.db.prepare(`
      INSERT INTO batches (id, product_id, batch_number, supplier_id, mfg_date, expiry_date, received_qty, remaining_qty, unit_cost, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      batch.productId,
      batch.batchNumber,
      batch.supplierId || null,
      batch.mfgDate || null,
      batch.expiryDate || null,
      batch.receivedQty,
      batch.receivedQty,
      batch.unitCost || 0,
      status,
      batch.notes || null,
      now,
      now,
    );

    return this.findById(id)!;
  }

  public findById(id: string): BatchEntity | null {
    const stmt = this.db.prepare('SELECT * FROM batches WHERE id = ?');
    const row = stmt.get(id);
    return (row as BatchEntity) || null;
  }

  public getBatchesByProduct(productId: string): BatchEntity[] {
    const stmt = this.db.prepare(
      'SELECT * FROM batches WHERE product_id = ? ORDER BY expiry_date ASC, created_at ASC',
    );
    return stmt.all(productId) as BatchEntity[];
  }

  public getExpiringBatches(daysWindow = 30): BatchEntity[] {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysWindow);

    const stmt = this.db.prepare(`
      SELECT * FROM batches
      WHERE expiry_date IS NOT NULL
        AND expiry_date <= ?
        AND remaining_qty > 0
      ORDER BY expiry_date ASC
    `);

    return stmt.all(targetDate.toISOString()) as BatchEntity[];
  }
}
