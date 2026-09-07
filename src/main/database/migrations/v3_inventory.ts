export const migrationV3 = {
  version: 3,
  name: 'inventory_and_products_v3',
  sql: `
    -- 1. Categories Table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      code TEXT NULL,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      description TEXT NULL,
      parent_id TEXT NULL,
      display_order INTEGER DEFAULT 0,
      icon TEXT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    );
    CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

    -- 2. Brands Table
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      description TEXT NULL,
      logo TEXT NULL,
      country_of_origin TEXT NULL,
      is_active INTEGER DEFAULT 1,
      notes TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL
    );

    -- 3. Units of Measurement Table
    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      symbol TEXT NOT NULL,
      unit_category TEXT NOT NULL DEFAULT 'Count',
      allow_decimals INTEGER DEFAULT 0,
      decimal_precision INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Unit Conversions Table
    CREATE TABLE IF NOT EXISTS unit_conversions (
      id TEXT PRIMARY KEY,
      product_id TEXT NULL,
      from_unit_id TEXT NOT NULL,
      to_unit_id TEXT NOT NULL,
      conversion_ratio REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_unit_id) REFERENCES units(id),
      FOREIGN KEY (to_unit_id) REFERENCES units(id)
    );

    -- 5. Suppliers Table
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      contact_person TEXT NULL,
      phone TEXT NULL,
      secondary_phone TEXT NULL,
      email TEXT NULL,
      address TEXT NULL,
      city TEXT NULL,
      country TEXT NULL,
      tax_number TEXT NULL,
      website TEXT NULL,
      notes TEXT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL
    );

    -- 6. Products Table
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      product_code TEXT NULL,
      primary_barcode TEXT NULL UNIQUE,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      short_name TEXT NULL,
      description TEXT NULL,
      internal_notes TEXT NULL,
      category_id TEXT NOT NULL,
      subcategory_id TEXT NULL,
      brand_id TEXT NULL,
      primary_supplier_id TEXT NULL,
      product_type TEXT NOT NULL DEFAULT 'Standard stock item',
      base_unit_id TEXT NOT NULL,
      selling_unit_id TEXT NULL,
      purchasing_unit_id TEXT NULL,
      allow_decimal_qty INTEGER DEFAULT 0,
      qty_precision INTEGER DEFAULT 0,
      purchase_cost REAL NOT NULL DEFAULT 0,
      avg_cost REAL NOT NULL DEFAULT 0,
      last_purchase_cost REAL NOT NULL DEFAULT 0,
      selling_price REAL NOT NULL DEFAULT 0,
      wholesale_price REAL DEFAULT 0,
      min_selling_price REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      prices_include_tax INTEGER DEFAULT 0,
      is_tax_exempt INTEGER DEFAULT 0,
      allow_discount INTEGER DEFAULT 1,
      track_inventory INTEGER DEFAULT 1,
      min_stock REAL DEFAULT 0,
      max_stock REAL DEFAULT 0,
      reorder_level REAL DEFAULT 0,
      default_reorder_qty REAL DEFAULT 0,
      allow_negative_stock INTEGER DEFAULT 0,
      storage_location TEXT NULL,
      shelf_code TEXT NULL,
      track_batches INTEGER DEFAULT 0,
      track_expiry INTEGER DEFAULT 0,
      track_serials INTEGER DEFAULT 0,
      shelf_life_days INTEGER DEFAULT 0,
      image_url TEXT NULL,
      thumbnail_url TEXT NULL,
      preferred_receipt_name TEXT NULL,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      created_by TEXT NULL,
      updated_by TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      archived_at DATETIME NULL,
      deleted_at DATETIME NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (subcategory_id) REFERENCES categories(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (primary_supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (base_unit_id) REFERENCES units(id)
    );
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_primary_barcode ON products(primary_barcode);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
    CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(primary_supplier_id);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

    -- 7. Product Barcodes Table (Multiple alternate barcodes per product)
    CREATE TABLE IF NOT EXISTS product_barcodes (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      barcode TEXT NOT NULL UNIQUE,
      barcode_type TEXT DEFAULT 'EAN-13',
      unit_id TEXT NULL,
      quantity_represented REAL DEFAULT 1,
      is_primary INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (unit_id) REFERENCES units(id)
    );
    CREATE INDEX IF NOT EXISTS idx_barcodes_value ON product_barcodes(barcode);
    CREATE INDEX IF NOT EXISTS idx_barcodes_product ON product_barcodes(product_id);

    -- 8. Inventory Balances Table
    CREATE TABLE IF NOT EXISTS inventory_balances (
      product_id TEXT PRIMARY KEY,
      quantity_on_hand REAL DEFAULT 0,
      reserved_quantity REAL DEFAULT 0,
      available_quantity REAL DEFAULT 0,
      damaged_quantity REAL DEFAULT 0,
      expired_quantity REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- 9. Inventory Movement Ledger Table
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      batch_id TEXT NULL,
      movement_type TEXT NOT NULL,
      quantity_change REAL NOT NULL,
      quantity_before REAL NOT NULL,
      quantity_after REAL NOT NULL,
      unit_id TEXT NOT NULL,
      cost_at_time REAL DEFAULT 0,
      reference_type TEXT NULL,
      reference_id TEXT NULL,
      reference_number TEXT NULL,
      reason TEXT NULL,
      notes TEXT NULL,
      user_id TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (unit_id) REFERENCES units(id)
    );
    CREATE INDEX IF NOT EXISTS idx_movements_product ON inventory_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_movements_created ON inventory_movements(created_at DESC);

    -- 10. Batches Table
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      batch_number TEXT NOT NULL,
      supplier_id TEXT NULL,
      mfg_date DATETIME NULL,
      expiry_date DATETIME NULL,
      received_qty REAL NOT NULL,
      remaining_qty REAL NOT NULL,
      unit_cost REAL DEFAULT 0,
      status TEXT DEFAULT 'Active',
      notes TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );
    CREATE INDEX IF NOT EXISTS idx_batches_product ON batches(product_id);
    CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date);

    -- 11. Batch Inventory Balances Table
    CREATE TABLE IF NOT EXISTS batch_inventory_balances (
      batch_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (batch_id, product_id),
      FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- 12. Stock Count Sessions & Items Tables
    CREATE TABLE IF NOT EXISTS stock_count_sessions (
      id TEXT PRIMARY KEY,
      session_number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'Draft',
      created_by TEXT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME NULL,
      notes TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_count_items (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      expected_qty REAL NOT NULL,
      counted_qty REAL NOT NULL,
      difference REAL NOT NULL,
      unit_cost REAL DEFAULT 0,
      status TEXT DEFAULT 'Pending',
      notes TEXT NULL,
      FOREIGN KEY (session_id) REFERENCES stock_count_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- 13. Tags Table
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS product_tags (
      product_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (product_id, tag_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `,
};
