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
    catStmt.run('cat-demo-1', 'Groceries', 'مواد غذائية');
    catStmt.run('cat-demo-2', 'Electronics', 'إلكترونيات');
    catStmt.run('cat-demo-3', 'Cosmetics', 'مستحضرات التجميل');

    const prodStmt = this.db.prepare(`
      INSERT OR IGNORE INTO products (id, sku, barcode, name_en, name_ar, category_id, avg_cost, selling_price, reorder_level, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    prodStmt.run(
      'prod-demo-1',
      'DEMO-SKU-001',
      '100000000001',
      'Fresh Milk 1L',
      'حليب طازج 1 لتر',
      'cat-demo-1',
      1.2,
      2.5,
      10,
    );
    prodStmt.run(
      'prod-demo-2',
      'DEMO-SKU-002',
      '100000000002',
      'Organic Olive Oil 750ml',
      'زيت زيتون عضوي',
      'cat-demo-1',
      4.5,
      8.99,
      5,
    );
    prodStmt.run(
      'prod-demo-3',
      'DEMO-SKU-003',
      '100000000003',
      'Wireless Mouse',
      'فأرة لاسلكية',
      'cat-demo-2',
      5.0,
      12.0,
      3,
    );

    const balStmt = this.db.prepare(
      'INSERT OR REPLACE INTO inventory_balances (id, product_id, quantity_on_hand) VALUES (?, ?, ?)',
    );
    balStmt.run('bal-demo-1', 'prod-demo-1', 50);
    balStmt.run('bal-demo-2', 'prod-demo-2', 20);
    balStmt.run('bal-demo-3', 'prod-demo-3', 15);

    return { categoriesSeeded: 3, productsSeeded: 3 };
  }

  public clearDemoData(): void {
    logger.info('DemoDataService', 'Clearing demo dataset');
    this.db.prepare("DELETE FROM products WHERE sku LIKE 'DEMO-%'").run();
    this.db.prepare("DELETE FROM categories WHERE id LIKE 'cat-demo-%'").run();
  }
}
