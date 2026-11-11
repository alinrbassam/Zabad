import { describe, it, expect, vi } from 'vitest';
import Database from 'better-sqlite3';
import { ProductSchema } from '../shared/validation';
import { ProductRepository } from '../main/database/repositories/product.repository';

describe('Product Schema & Validation', () => {
  it('should validate complete product creation schema', () => {
    const validProduct = {
      sku: 'SKU-001',
      primaryBarcode: '6291001001',
      nameEn: 'Organic Fresh Milk 1L',
      nameAr: 'حليب طازج عضوي 1 لتر',
      productType: 'Standard stock item',
      categoryId: 'cat-dairy-id',
      baseUnitId: 'unit-pcs-id',
      purchaseCost: 1.5,
      sellingPrice: 2.5,
      minSellingPrice: 2.0,
      trackInventory: true,
      trackBatches: true,
      trackExpiry: true,
      isActive: true,
    };

    const parsed = ProductSchema.parse(validProduct);
    expect(parsed.sku).toBe('SKU-001');
    expect(parsed.sellingPrice).toBe(2.5);
  });

  it('should reject selling price lower than minimum allowed selling price', () => {
    const invalidProduct = {
      sku: 'SKU-002',
      nameEn: 'Juice',
      nameAr: 'عصير',
      productType: 'Standard stock item',
      categoryId: 'cat-beverage',
      baseUnitId: 'unit-pcs',
      purchaseCost: 1.0,
      sellingPrice: 1.2, // Below min selling price 1.5
      minSellingPrice: 1.5,
    };

    expect(() => ProductSchema.parse(invalidProduct)).toThrow();
  });

  it('should parse pieceWeight and piecesPerPack properly', () => {
    const weightedProduct = {
      sku: 'SKU-TILE-1',
      nameEn: 'Floor Tiles 60x60',
      nameAr: 'بلاط أرضيات',
      productType: 'Standard stock item',
      categoryId: 'cat-tiles',
      baseUnitId: 'unit-box',
      purchaseCost: 50,
      sellingPrice: 100,
      minSellingPrice: 80,
      pieceWeight: 0.25,
      piecesPerPack: 12,
    };

    const parsed = ProductSchema.parse(weightedProduct);
    expect(parsed.pieceWeight).toBe(0.25);
    expect(parsed.piecesPerPack).toBe(12);
  });

  it('should gracefully handle empty or NaN pieceWeight and piecesPerPack', () => {
    const rawWithNaN = {
      sku: 'SKU-TILE-2',
      nameEn: 'Loose Tiles',
      productType: 'Standard stock item',
      categoryId: 'cat-tiles',
      baseUnitId: 'unit-box',
      purchaseCost: 10,
      sellingPrice: 20,
      minSellingPrice: 15,
      pieceWeight: NaN,
      piecesPerPack: '',
    };

    const parsed = ProductSchema.parse(rawWithNaN);
    expect(parsed.pieceWeight).toBe(0);
    expect(parsed.piecesPerPack).toBe(1);
  });

  it('should self-heal missing piece_weight column on products table during createProduct', () => {
    const productCols = new Set(['id', 'sku', 'name_en', 'name_ar']);
    const savedProducts: Record<string, Record<string, unknown>> = {};

    const selfHealingDb = {
      exec: vi.fn((sql: string) => {
        if (sql.includes('ALTER TABLE products ADD COLUMN piece_weight')) {
          productCols.add('piece_weight');
        }
        if (sql.includes('ALTER TABLE products ADD COLUMN pieces_per_pack')) {
          productCols.add('pieces_per_pack');
        }
      }),
      prepare: (sql: string) => {
        if (sql.includes('PRAGMA table_info(products)')) {
          return { all: () => Array.from(productCols).map((name) => ({ name })) };
        }
        if (sql.includes('INSERT INTO products') && !productCols.has('piece_weight')) {
          throw new Error('table products has no column named piece_weight');
        }
        if (sql.includes('INSERT INTO products')) {
          return {
            run: (id: string, sku: string, _code: unknown, _bc: unknown, nameEn: string) => {
              savedProducts[id] = { id, sku, name_en: nameEn, piece_weight: 0, pieces_per_pack: 1 };
              return { changes: 1 };
            },
          };
        }
        if (sql.includes('SELECT * FROM products WHERE id = ?')) {
          return { get: (id: string) => savedProducts[id] };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
    };

    const repo = new ProductRepository(selfHealingDb as unknown as Database.Database);
    const created = repo.createProduct({
      id: 'prod-kousa-1',
      sku: 'SKU-KOUSA',
      name_en: 'kousa',
      name_ar: 'kousa',
      category_id: 'fresh',
      base_unit_id: 'ad17f3a3-1fc6-4f49-9e3d-6eaf0f48a035',
      selling_price: 1000,
    });

    expect(created.name_en).toBe('kousa');
    expect(productCols.has('piece_weight')).toBe(true);
    expect(productCols.has('pieces_per_pack')).toBe(true);
  });
});
