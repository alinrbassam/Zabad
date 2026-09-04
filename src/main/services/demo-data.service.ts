import Database from 'better-sqlite3';
import { logger } from './logger.service';

export class DemoDataService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public seedDemoData(): { categoriesSeeded: number; productsSeeded: number } {
    logger.info('DemoDataService', 'Seeding evaluation demo dataset');

    const catStmt = this.db.prepare(
      'INSERT OR IGNORE INTO categories (id, name_en, name_ar, is_active) VALUES (?, ?, ?, 1)',
    );
    catStmt.run('cat-demo-1', 'Fresh Fish', 'أسماك طازجة');
    catStmt.run('cat-demo-2', 'Shrimps & Crustaceans', 'روبيان وقشريات');
    catStmt.run('cat-demo-3', 'Fillet & Prepared', 'فيليه ومتبل');

    const prodStmt = this.db.prepare(`
      INSERT OR IGNORE INTO products (id, sku, barcode, name_en, name_ar, category_id, avg_cost, selling_price, reorder_level, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    prodStmt.run(
      'prod-demo-1',
      'DEMO-SKU-001',
      '629100000001',
      'Salmon Fillet 1kg',
      'فيليه سلمون نرويجي 1 كغ',
      'cat-demo-3',
      14.0,
      22.5,
      10,
    );
    prodStmt.run(
      'prod-demo-2',
      'DEMO-SKU-002',
      '629100000002',
      'Fresh Sea Bass 1kg',
      'سمك قاروص طازج 1 كغ',
      'cat-demo-1',
      8.5,
      13.5,
      15,
    );
    prodStmt.run(
      'prod-demo-3',
      'DEMO-SKU-003',
      '629100000003',
      'Jumbo Shrimp 1kg',
      'روبيان جامبو طازج 1 كغ',
      'cat-demo-2',
      12.0,
      18.99,
      12,
    );
    prodStmt.run(
      'prod-demo-4',
      'DEMO-SKU-004',
      '629100000004',
      'Local Hamour 1kg',
      'هامور بلدي طازج 1 كغ',
      'cat-demo-1',
      11.0,
      17.5,
      8,
    );
    prodStmt.run(
      'prod-demo-5',
      'DEMO-SKU-005',
      '629100000005',
      'Fresh Calamari 1kg',
      'حبار طازج 1 كغ',
      'cat-demo-2',
      6.0,
      9.99,
      10,
    );

    const balStmt = this.db.prepare(
      'INSERT OR REPLACE INTO inventory_balances (id, product_id, quantity_on_hand) VALUES (?, ?, ?)',
    );
    balStmt.run('bal-demo-1', 'prod-demo-1', 45);
    balStmt.run('bal-demo-2', 'prod-demo-2', 30);
    balStmt.run('bal-demo-3', 'prod-demo-3', 25);
    balStmt.run('bal-demo-4', 'prod-demo-4', 20);
    balStmt.run('bal-demo-5', 'prod-demo-5', 35);

    return { categoriesSeeded: 3, productsSeeded: 5 };
  }

  public ensureZabadCatalog(): void {
    logger.info('DemoDataService', 'Ensuring Zabad Seafood catalog, units and categories');

    // 1. Get or create base units
    let kgUnit = this.db.prepare("SELECT id FROM units WHERE LOWER(code) = 'kg' OR LOWER(name_en) = 'kilogram' LIMIT 1").get() as { id: string } | undefined;
    if (!kgUnit) {
      const kgId = 'unit-kg-std';
      this.db.prepare(`
        INSERT OR IGNORE INTO units (id, code, name_en, name_ar, symbol, unit_type, allow_decimals, decimal_places, is_active)
        VALUES (?, 'kg', 'Kilogram', 'كيلوجرام', 'kg', 'Weight', 1, 3, 1)
      `).run(kgId);
      kgUnit = { id: kgId };
    }

    let pcsUnit = this.db.prepare("SELECT id FROM units WHERE LOWER(code) = 'pcs' OR LOWER(name_en) = 'piece' LIMIT 1").get() as { id: string } | undefined;
    if (!pcsUnit) {
      const pcsId = 'unit-pcs-std';
      this.db.prepare(`
        INSERT OR IGNORE INTO units (id, code, name_en, name_ar, symbol, unit_type, allow_decimals, decimal_places, is_active)
        VALUES (?, 'pcs', 'Piece', 'قطعة', 'pcs', 'Count', 0, 0, 1)
      `).run(pcsId);
      pcsUnit = { id: pcsId };
    }

    // 2. Categories
    const catStmt = this.db.prepare(
      'INSERT OR IGNORE INTO categories (id, name_en, name_ar, is_active) VALUES (?, ?, ?, 1)',
    );
    catStmt.run('fresh', 'Fresh Fish', 'أسماك طازجة');
    catStmt.run('fillet', 'Fillets & Cuts', 'فيليه وقطع');
    catStmt.run('shrimp', 'Shrimp & Shellfish', 'روبيان وقشريات');
    catStmt.run('extras', 'Spices & Extras', 'توابل وملحقات');

    // 3. Products
    const fishProducts = [
      {
        id: 'fish-salmon',
        sku: 'FISH-001',
        barcode: '629100000001',
        name_en: 'Fresh Salmon (سالمون طازج)',
        name_ar: 'سالمون طازج',
        selling_price: 22.5,
        avg_cost: 14.0,
        allow_decimal_qty: 1,
        base_unit_id: kgUnit.id,
        category_id: 'fresh',
      },
      {
        id: 'fish-seabream',
        sku: 'FISH-002',
        barcode: '629100000002',
        name_en: 'Sea Bream (دنيس طازج)',
        name_ar: 'سمك دنيس طازج',
        selling_price: 14.0,
        avg_cost: 8.5,
        allow_decimal_qty: 1,
        base_unit_id: kgUnit.id,
        category_id: 'fresh',
      },
      {
        id: 'fish-seabass',
        sku: 'FISH-003',
        barcode: '629100000003',
        name_en: 'Sea Bass (قاروص طازج)',
        name_ar: 'سمك قاروص طازج',
        selling_price: 16.5,
        avg_cost: 10.0,
        allow_decimal_qty: 1,
        base_unit_id: kgUnit.id,
        category_id: 'fresh',
      },
      {
        id: 'fish-shrimp-jumbo',
        sku: 'FISH-004',
        barcode: '629100000004',
        name_en: 'Jumbo Shrimp (روبيان جامبو)',
        name_ar: 'روبيان جامبو طازج',
        selling_price: 28.0,
        avg_cost: 18.0,
        allow_decimal_qty: 1,
        base_unit_id: kgUnit.id,
        category_id: 'shrimp',
      },
      {
        id: 'fish-calamari',
        sku: 'FISH-005',
        barcode: '629100000005',
        name_en: 'Fresh Calamari (حبار طازج)',
        name_ar: 'حبار طازج',
        selling_price: 18.0,
        avg_cost: 11.0,
        allow_decimal_qty: 1,
        base_unit_id: kgUnit.id,
        category_id: 'shrimp',
      },
      {
        id: 'fish-hamour',
        sku: 'FISH-006',
        barcode: '629100000006',
        name_en: 'Fresh Hamour (هامور بلدي)',
        name_ar: 'هامور بلدي',
        selling_price: 32.0,
        avg_cost: 20.0,
        allow_decimal_qty: 1,
        base_unit_id: kgUnit.id,
        category_id: 'fresh',
      },
      {
        id: 'fish-fillet',
        sku: 'FISH-007',
        barcode: '629100000007',
        name_en: 'White Fish Fillet (فيليه أبيض)',
        name_ar: 'فيليه سمك أبيض',
        selling_price: 19.5,
        avg_cost: 12.0,
        allow_decimal_qty: 1,
        base_unit_id: kgUnit.id,
        category_id: 'fillet',
      },
      {
        id: 'fish-tuna-steak',
        sku: 'FISH-008',
        barcode: '629100000008',
        name_en: 'Tuna Steak (قطع تونة طازجة)',
        name_ar: 'قطع تونة طازجة',
        selling_price: 25.0,
        avg_cost: 16.0,
        allow_decimal_qty: 1,
        base_unit_id: kgUnit.id,
        category_id: 'fillet',
      },
      {
        id: 'fish-spices',
        sku: 'EXTRA-001',
        barcode: '629100000009',
        name_en: 'Fish Seasoning & Spices (بهارات سمك خاصة)',
        name_ar: 'بهارات وتتبيلة سمك',
        selling_price: 3.5,
        avg_cost: 1.5,
        allow_decimal_qty: 0,
        base_unit_id: pcsUnit.id,
        category_id: 'extras',
      },
    ];

    const prodStmt = this.db.prepare(`
      INSERT OR REPLACE INTO products (
        id, sku, primary_barcode, name_en, name_ar, category_id, base_unit_id,
        avg_cost, purchase_cost, selling_price, allow_decimal_qty, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const balStmt = this.db.prepare(`
      INSERT OR REPLACE INTO inventory_balances (product_id, quantity_on_hand, available_quantity)
      VALUES (?, 100, 100)
    `);

    for (const p of fishProducts) {
      prodStmt.run(
        p.id,
        p.sku,
        p.barcode,
        p.name_en,
        p.name_ar,
        p.category_id,
        p.base_unit_id,
        p.avg_cost,
        p.avg_cost,
        p.selling_price,
        p.allow_decimal_qty,
      );
      balStmt.run(p.id);
    }
  }

  public clearDemoData(): void {
    logger.info('DemoDataService', 'Clearing demo dataset');
    this.db.prepare("DELETE FROM products WHERE sku LIKE 'DEMO-%'").run();
    this.db.prepare("DELETE FROM categories WHERE id LIKE 'cat-demo-%'").run();
  }
}
