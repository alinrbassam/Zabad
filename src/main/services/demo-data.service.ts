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

    // Units and categories are ensured above. Products are not forcibly seeded so the user starts with a clean slate.
  }

  public clearDemoData(): void {
    logger.info('DemoDataService', 'Clearing demo dataset');
    this.db.prepare("DELETE FROM products WHERE sku LIKE 'DEMO-%'").run();
    this.db.prepare("DELETE FROM categories WHERE id LIKE 'cat-demo-%'").run();
  }
}
