export const migrationV4 = {
  version: 4,
  name: 'purchasing_module_v4',
  sql: `
    -- 1. Numbering Sequences Table
    CREATE TABLE IF NOT EXISTS numbering_sequences (
      key TEXT PRIMARY KEY,
      prefix TEXT NOT NULL,
      current_number INTEGER NOT NULL DEFAULT 0,
      padding INTEGER NOT NULL DEFAULT 6,
      include_year INTEGER NOT NULL DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Seed Default Numbering Sequences
    INSERT OR IGNORE INTO numbering_sequences (key, prefix, current_number, padding, include_year) VALUES
      ('po', 'PO', 0, 6, 1),
      ('gr', 'GR', 0, 6, 1),
      ('pr', 'PR', 0, 6, 1),
      ('inv', 'INV', 0, 6, 1);

    -- 2. Purchase Orders Table
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      po_number TEXT NOT NULL UNIQUE,
      supplier_id TEXT NOT NULL,
      order_date DATETIME NOT NULL,
      expected_delivery_date DATETIME NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      tax_mode TEXT NOT NULL DEFAULT 'exclusive',
      discount_mode TEXT NOT NULL DEFAULT 'amount',
      subtotal REAL NOT NULL DEFAULT 0,
      item_discount REAL NOT NULL DEFAULT 0,
      order_discount REAL NOT NULL DEFAULT 0,
      tax_subtotal REAL NOT NULL DEFAULT 0,
      shipping_cost REAL NOT NULL DEFAULT 0,
      additional_charges REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Draft',
      approval_status TEXT NOT NULL DEFAULT 'Approved',
      notes TEXT NULL,
      internal_notes TEXT NULL,
      cancellation_reason TEXT NULL,
      created_by TEXT NULL,
      approved_by TEXT NULL,
      ordered_by TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      cancelled_at DATETIME NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );
    CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
    CREATE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(po_number);

    -- 3. Purchase Order Items Table
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id TEXT PRIMARY KEY,
      po_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      description TEXT NULL,
      purchasing_unit_id TEXT NOT NULL,
      conversion_ratio REAL NOT NULL DEFAULT 1,
      ordered_qty REAL NOT NULL,
      received_qty REAL NOT NULL DEFAULT 0,
      unit_cost REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      line_subtotal REAL NOT NULL DEFAULT 0,
      line_total REAL NOT NULL DEFAULT 0,
      notes TEXT NULL,
      FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (purchasing_unit_id) REFERENCES units(id)
    );
    CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(po_id);
    CREATE INDEX IF NOT EXISTS idx_po_items_product ON purchase_order_items(product_id);

    -- 4. Status History Table
    CREATE TABLE IF NOT EXISTS purchase_order_status_history (
      id TEXT PRIMARY KEY,
      po_id TEXT NOT NULL,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      user_id TEXT NULL,
      notes TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
    );

    -- 5. Goods Receipts Table
    CREATE TABLE IF NOT EXISTS goods_receipts (
      id TEXT PRIMARY KEY,
      receipt_number TEXT NOT NULL UNIQUE,
      po_id TEXT NULL,
      supplier_id TEXT NOT NULL,
      supplier_invoice_number TEXT NULL,
      supplier_invoice_date DATETIME NULL,
      receipt_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      delivery_note_number TEXT NULL,
      status TEXT NOT NULL DEFAULT 'Confirmed',
      received_by TEXT NULL,
      notes TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );
    CREATE INDEX IF NOT EXISTS idx_gr_number ON goods_receipts(receipt_number);
    CREATE INDEX IF NOT EXISTS idx_gr_po ON goods_receipts(po_id);

    -- 6. Goods Receipt Items Table
    CREATE TABLE IF NOT EXISTS goods_receipt_items (
      id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      po_item_id TEXT NULL,
      product_id TEXT NOT NULL,
      unit_id TEXT NOT NULL,
      received_qty REAL NOT NULL,
      accepted_qty REAL NOT NULL,
      rejected_qty REAL NOT NULL DEFAULT 0,
      unit_cost REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      batch_number TEXT NULL,
      mfg_date DATETIME NULL,
      expiry_date DATETIME NULL,
      notes TEXT NULL,
      FOREIGN KEY (receipt_id) REFERENCES goods_receipts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (unit_id) REFERENCES units(id)
    );

    -- 7. Supplier Invoices Table
    CREATE TABLE IF NOT EXISTS supplier_invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      po_id TEXT NULL,
      receipt_id TEXT NULL,
      invoice_date DATETIME NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      subtotal REAL NOT NULL DEFAULT 0,
      tax_total REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Recorded',
      created_by TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    -- 8. Purchase Returns & Return Items Tables
    CREATE TABLE IF NOT EXISTS purchase_returns (
      id TEXT PRIMARY KEY,
      return_number TEXT NOT NULL UNIQUE,
      supplier_id TEXT NOT NULL,
      receipt_id TEXT NULL,
      return_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Completed',
      notes TEXT NULL,
      created_by TEXT NULL,
      approved_by TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_return_items (
      id TEXT PRIMARY KEY,
      return_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      batch_id TEXT NULL,
      unit_id TEXT NOT NULL,
      returned_qty REAL NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0,
      reason TEXT NULL,
      stock_disposition TEXT NOT NULL DEFAULT 'Remove from sellable stock',
      FOREIGN KEY (return_id) REFERENCES purchase_returns(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- 9. Attachments Table
    CREATE TABLE IF NOT EXISTS purchase_attachments (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      uploaded_by TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 10. Purchasing Settings Table
    CREATE TABLE IF NOT EXISTS purchasing_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,
};
