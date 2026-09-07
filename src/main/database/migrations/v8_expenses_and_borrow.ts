import Database from 'better-sqlite3';

export const migrationV8 = {
  version: 8,
  name: 'expenses_and_borrow_v8',
  sql: `
    -- 1. Operational Expenses Table
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'Cash',
      expense_date TEXT NOT NULL,
      receipt_reference TEXT NULL,
      notes TEXT NULL,
      created_by TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
  `,
};

export function ensureBorrowColumns(db: Database.Database): void {
  try {
    const columns = db.prepare(`PRAGMA table_info(sales_orders)`).all() as Array<{ name: string }>;
    const colNames = new Set(columns.map((c) => c.name));

    if (!colNames.has('customer_name')) {
      db.exec(`ALTER TABLE sales_orders ADD COLUMN customer_name TEXT NULL`);
    }
    if (!colNames.has('customer_phone')) {
      db.exec(`ALTER TABLE sales_orders ADD COLUMN customer_phone TEXT NULL`);
    }
    if (!colNames.has('due_date')) {
      db.exec(`ALTER TABLE sales_orders ADD COLUMN due_date TEXT NULL`);
    }
    if (!colNames.has('notes')) {
      db.exec(`ALTER TABLE sales_orders ADD COLUMN notes TEXT NULL`);
    }
  } catch (err) {
    // If sales_orders table doesn't exist yet, migration v5 creates it
  }
}
