import Database from 'better-sqlite3';
import { ExpenseEntity } from '../../../shared/types';
import { ExpenseInput } from '../../../shared/validation';

export class ExpenseRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public create(input: ExpenseInput, userId?: string): ExpenseEntity {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO expenses (
        id, category, title, amount, payment_method, expense_date,
        receipt_reference, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.category,
      input.title,
      input.amount,
      input.paymentMethod || 'Cash',
      input.expenseDate,
      input.receiptReference || null,
      input.notes || null,
      userId || null,
      now,
    );

    return this.findById(id)!;
  }

  public findById(id: string): ExpenseEntity | null {
    const stmt = this.db.prepare(`SELECT * FROM expenses WHERE id = ?`);
    const row = stmt.get(id) as ExpenseEntity | undefined;
    return row || null;
  }

  public list(options?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    limit?: number;
  }): ExpenseEntity[] {
    let sql = `SELECT * FROM expenses WHERE 1=1`;
    const params: (string | number)[] = [];

    if (options?.startDate) {
      sql += ` AND date(expense_date) >= ?`;
      params.push(options.startDate);
    }
    if (options?.endDate) {
      sql += ` AND date(expense_date) <= ?`;
      params.push(options.endDate);
    }
    if (options?.category && options.category !== 'all') {
      sql += ` AND category = ?`;
      params.push(options.category);
    }

    sql += ` ORDER BY expense_date DESC, created_at DESC LIMIT ?`;
    params.push(options?.limit || 200);

    return this.db.prepare(sql).all(...params) as ExpenseEntity[];
  }

  public delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM expenses WHERE id = ?`);
    const res = stmt.run(id);
    return res.changes > 0;
  }

  public getCategorySummary(startDate?: string, endDate?: string): { category: string; total: number; count: number }[] {
    let sql = `
      SELECT category, SUM(amount) as total, COUNT(id) as count
      FROM expenses
      WHERE 1=1
    `;
    const params: string[] = [];

    if (startDate) {
      sql += ` AND date(expense_date) >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND date(expense_date) <= ?`;
      params.push(endDate);
    }

    sql += ` GROUP BY category ORDER BY total DESC`;
    return this.db.prepare(sql).all(...params) as { category: string; total: number; count: number }[];
  }

  public getTotalExpenses(startDate?: string, endDate?: string): number {
    let sql = `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE 1=1`;
    const params: string[] = [];

    if (startDate) {
      sql += ` AND date(expense_date) >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND date(expense_date) <= ?`;
      params.push(endDate);
    }

    const row = this.db.prepare(sql).get(...params) as { total: number };
    return row?.total || 0;
  }
}
