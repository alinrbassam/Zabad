import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseMigrator } from '../main/database/migrator';
import {
  ensureAllSchemaColumns,
  initializeDatabaseSchema,
} from '../main/database/migrations/ensure-schema';
import { ensureWeightColumns } from '../main/database/migrations/v9_weight_and_packaging';
import { migrationV10 } from '../main/database/migrations/v10_simplify_units';
import Database from 'better-sqlite3';

describe('DatabaseMigrator', () => {
  let mockDb: Record<string, unknown>;
  let migrator: DatabaseMigrator;
  let executedSql: string[];
  let appliedVersions: Array<{ version: number; name: string }>;

  beforeEach(() => {
    executedSql = [];
    appliedVersions = [];

    mockDb = {
      exec: vi.fn((sql: string) => {
        executedSql.push(sql);
        return mockDb;
      }),
      prepare: (sql: string) => {
        if (sql.includes('SELECT version FROM schema_migrations')) {
          return {
            all: () => appliedVersions.map((v) => ({ version: v.version })),
          };
        }
        if (sql.includes('INSERT INTO schema_migrations')) {
          return {
            run: (v: number, name: string) => {
              appliedVersions.push({ version: v, name });
              return { changes: 1, lastInsertRowid: 1 };
            },
          };
        }
        return {
          all: () => [],
          run: () => ({ changes: 1, lastInsertRowid: 1 }),
        };
      },
      transaction: (fn: () => void) => {
        return () => fn();
      },
    };

    migrator = new DatabaseMigrator(mockDb as unknown as Database.Database);
  });

  it('should initialize schema_migrations table', () => {
    migrator.initMigrationTable();
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS schema_migrations'),
    );
  });

  it('should apply versioned migrations sequentially', () => {
    const migrations = [
      {
        version: 1,
        name: 'create_test_table',
        sql: 'CREATE TABLE test (id TEXT PRIMARY KEY, title TEXT);',
      },
      {
        version: 2,
        name: 'add_column_test',
        sql: 'ALTER TABLE test ADD COLUMN created_at TEXT;',
      },
    ];

    migrator.runMigrations(migrations);
    const versions = migrator.getAppliedVersions();
    expect(versions).toEqual([1, 2]);
    expect(executedSql).toContain(migrations[0].sql);
    expect(executedSql).toContain(migrations[1].sql);
  });

  it('should not re-apply already executed migrations', () => {
    const migrations = [
      {
        version: 1,
        name: 'create_test_table',
        sql: 'CREATE TABLE test (id TEXT PRIMARY KEY);',
      },
    ];

    migrator.runMigrations(migrations);
    migrator.runMigrations(migrations);

    const versions = migrator.getAppliedVersions();
    expect(versions).toEqual([1]);
  });

  it('should add piece_weight, pieces_per_pack, selling_mode and weight columns via ensureWeightColumns', () => {
    const productCols = new Set(['id', 'sku', 'name_en']);
    const salesItemCols = new Set(['id', 'sale_id', 'product_id']);
    const ddlExecuted: string[] = [];

    const legacyDb = {
      exec: vi.fn((sql: string) => {
        ddlExecuted.push(sql);
        if (sql.includes('ALTER TABLE products ADD COLUMN piece_weight')) {
          productCols.add('piece_weight');
        }
        if (sql.includes('ALTER TABLE products ADD COLUMN pieces_per_pack')) {
          productCols.add('pieces_per_pack');
        }
        if (sql.includes('ALTER TABLE sales_order_items ADD COLUMN selling_mode')) {
          salesItemCols.add('selling_mode');
        }
        if (sql.includes('ALTER TABLE sales_order_items ADD COLUMN piece_weight')) {
          salesItemCols.add('piece_weight');
        }
        if (sql.includes('ALTER TABLE sales_order_items ADD COLUMN pieces_per_pack')) {
          salesItemCols.add('pieces_per_pack');
        }
        if (sql.includes('ALTER TABLE sales_order_items ADD COLUMN unit_weight')) {
          salesItemCols.add('unit_weight');
        }
        if (sql.includes('ALTER TABLE sales_order_items ADD COLUMN total_weight')) {
          salesItemCols.add('total_weight');
        }
      }),
      prepare: (sql: string) => {
        if (sql.includes('PRAGMA table_info(products)')) {
          return { all: () => Array.from(productCols).map((name) => ({ name })) };
        }
        if (sql.includes('PRAGMA table_info(sales_order_items)')) {
          return { all: () => Array.from(salesItemCols).map((name) => ({ name })) };
        }
        return { all: () => [], run: vi.fn() };
      },
    };

    ensureWeightColumns(legacyDb as unknown as Database.Database);

    expect(productCols.has('piece_weight')).toBe(true);
    expect(productCols.has('pieces_per_pack')).toBe(true);
    expect(salesItemCols.has('selling_mode')).toBe(true);
    expect(salesItemCols.has('piece_weight')).toBe(true);
    expect(salesItemCols.has('pieces_per_pack')).toBe(true);
    expect(salesItemCols.has('unit_weight')).toBe(true);
    expect(salesItemCols.has('total_weight')).toBe(true);
    expect(ddlExecuted).toHaveLength(7);
  });

  it('should still run ensureWeightColumns even if a preceding migration throws during initializeDatabaseSchema', () => {
    const productCols = new Set(['id', 'sku']);
    const salesOrderItemCols = new Set(['id', 'sale_id']);

    const failingMigrationDb = {
      exec: vi.fn((sql: string) => {
        if (sql.includes('simplify_units') || sql.includes('UPDATE products')) {
          throw new Error('FOREIGN KEY constraint failed');
        }
        if (sql.includes('ALTER TABLE products ADD COLUMN piece_weight')) {
          productCols.add('piece_weight');
        }
        if (sql.includes('ALTER TABLE sales_order_items ADD COLUMN selling_mode')) {
          salesOrderItemCols.add('selling_mode');
        }
      }),
      prepare: (sql: string) => {
        if (sql.includes('SELECT version FROM schema_migrations')) {
          return { all: () => [2, 3, 4, 5, 6, 7, 8, 9].map((version) => ({ version })) };
        }
        if (sql.includes('PRAGMA table_info(products)')) {
          return { all: () => Array.from(productCols).map((name) => ({ name })) };
        }
        if (sql.includes('PRAGMA table_info(sales_order_items)')) {
          return { all: () => Array.from(salesOrderItemCols).map((name) => ({ name })) };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    expect(() =>
      initializeDatabaseSchema(failingMigrationDb as unknown as Database.Database),
    ).not.toThrow();
    expect(productCols.has('piece_weight')).toBe(true);
    expect(salesOrderItemCols.has('selling_mode')).toBe(true);
  });

  it('should isolate failures across ensureAllSchemaColumns steps and keep migrationV10 FK-safe', () => {
    expect(migrationV10.sql).toContain("INSERT OR IGNORE INTO units");
    expect(migrationV10.sql).toContain("EXISTS (SELECT 1 FROM units WHERE LOWER(code) = 'carton')");

    const productCols = new Set(['id']);
    const partialFailDb = {
      exec: vi.fn((sql: string) => {
        if (sql.includes('ALTER TABLE sales_orders ADD COLUMN customer_name')) {
          throw new Error('simulated borrow alter error');
        }
        if (sql.includes('ALTER TABLE products ADD COLUMN piece_weight')) {
          productCols.add('piece_weight');
        }
      }),
      prepare: (sql: string) => {
        if (sql.includes('PRAGMA table_info(sales_orders)')) {
          return { all: () => [{ name: 'id' }] };
        }
        if (sql.includes('PRAGMA table_info(products)')) {
          return { all: () => Array.from(productCols).map((name) => ({ name })) };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    expect(() =>
      ensureAllSchemaColumns(partialFailDb as unknown as Database.Database),
    ).not.toThrow();
    expect(productCols.has('piece_weight')).toBe(true);
  });
});
