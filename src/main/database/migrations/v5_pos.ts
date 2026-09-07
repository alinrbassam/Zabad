export const migrationV5 = {
  version: 5,
  name: 'pos_sales_module_v5',
  sql: `
    -- 1. Sales Orders Table
    CREATE TABLE IF NOT EXISTS sales_orders (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      customer_id TEXT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      item_discount REAL NOT NULL DEFAULT 0,
      order_discount REAL NOT NULL DEFAULT 0,
      tax_total REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      change_amount REAL NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'Paid',
      payment_method TEXT NOT NULL DEFAULT 'Cash',
      shift_id TEXT NULL,
      cashier_id TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales_orders(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales_orders(cashier_id);
    CREATE INDEX IF NOT EXISTS idx_sales_created ON sales_orders(created_at);

    -- 2. Sales Order Items Table
    CREATE TABLE IF NOT EXISTS sales_order_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      batch_id TEXT NULL,
      unit_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      cost_price REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      line_total REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sales_order_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sales_order_items(product_id);

    -- 3. Sales Payments Table
    CREATE TABLE IF NOT EXISTS sales_payments (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      amount REAL NOT NULL,
      reference_number TEXT NULL,
      notes TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales_orders(id) ON DELETE CASCADE
    );

    -- 4. Suspended Sales (Hold / Resume) Tables
    CREATE TABLE IF NOT EXISTS suspended_sales (
      id TEXT PRIMARY KEY,
      reference_name TEXT NOT NULL,
      customer_id TEXT NULL,
      cashier_id TEXT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      notes TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suspended_sale_items (
      id TEXT PRIMARY KEY,
      suspended_sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      batch_id TEXT NULL,
      unit_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (suspended_sale_id) REFERENCES suspended_sales(id) ON DELETE CASCADE
    );

    -- 5. Sales Refunds Tables
    CREATE TABLE IF NOT EXISTS sales_refunds (
      id TEXT PRIMARY KEY,
      refund_number TEXT NOT NULL UNIQUE,
      sale_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      refund_amount REAL NOT NULL,
      refund_method TEXT NOT NULL DEFAULT 'Cash',
      processed_by TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales_orders(id)
    );

    CREATE TABLE IF NOT EXISTS sales_refund_items (
      id TEXT PRIMARY KEY,
      refund_id TEXT NOT NULL,
      sale_item_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      batch_id TEXT NULL,
      returned_qty REAL NOT NULL,
      refund_amount REAL NOT NULL,
      FOREIGN KEY (refund_id) REFERENCES sales_refunds(id) ON DELETE CASCADE
    );

    -- 6. POS Shifts Table
    CREATE TABLE IF NOT EXISTS pos_shifts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME NULL,
      opening_cash REAL NOT NULL DEFAULT 0,
      closing_cash_actual REAL NULL,
      closing_cash_expected REAL NULL,
      status TEXT NOT NULL DEFAULT 'Open',
      notes TEXT NULL
    );
  `,
};
