export const migrationV6 = {
  version: 6,
  name: 'reports_analytics_module_v6',
  sql: `
    -- Saved Report Filters
    CREATE TABLE IF NOT EXISTS saved_report_filters (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      report_type TEXT NOT NULL,
      filter_config_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_saved_filters_user ON saved_report_filters(user_id, report_type);

    -- Reporting Query Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_sales_orders_status_date ON sales_orders(payment_status, created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_items_product_sale ON sales_order_items(product_id, sale_id);
    CREATE INDEX IF NOT EXISTS idx_movements_type_date ON inventory_movements(movement_type, created_at);
  `,
};
