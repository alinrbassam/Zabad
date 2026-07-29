import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { ImportExportService } from '../main/services/import-export.service';
import { CategoryEntity, UnitEntity } from '@shared/types';

interface MockProduct {
  id: string;
  sku: string;
  name_en: string;
}

describe('Import & Export Service', () => {
  let mockDb: Record<string, unknown>;
  let service: ImportExportService;
  let products: MockProduct[];
  let categories: Partial<CategoryEntity>[];
  let units: Partial<UnitEntity>[];

  beforeEach(() => {
    products = [];
    categories = [{ id: 'cat-1', name_en: 'Dairy', name_ar: 'ألبان' }];
    units = [
      {
        id: 'u-1',
        code: 'pcs',
        name_en: 'Piece',
        name_ar: 'قطعة',
        allow_decimals: 0,
        decimal_precision: 0,
      },
    ];

    mockDb = {
      prepare: (sql: string) => {
        if (sql.includes('FROM categories')) {
          return { all: () => categories, get: () => categories[0] };
        }
        if (sql.includes('FROM units')) {
          return { all: () => units, get: () => units[0] };
        }
        if (sql.includes('INSERT INTO products')) {
          return {
            run: (...args: unknown[]) => {
              const p: MockProduct = {
                id: String(args[0]),
                sku: String(args[1]),
                name_en: String(args[4]),
              };
              products.push(p);
            },
          };
        }
        if (sql.includes('INSERT INTO categories')) {
          return {
            run: (...args: unknown[]) => {
              const cat: Partial<CategoryEntity> = {
                id: String(args[0]),
                name_en: String(args[2]),
                name_ar: String(args[3]),
              };
              categories.push(cat);
            },
          };
        }
        return {
          get: () => (sql.includes('FROM products WHERE id') ? products[0] : undefined),
          all: () => products,
          run: vi.fn(),
        };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    service = new ImportExportService(mockDb as unknown as Database.Database);
  });

  it('should import valid CSV product rows and create categories/units', () => {
    const rows = [
      {
        sku: 'IMP-001',
        primaryBarcode: '6291100011',
        nameEn: 'Imported Tea 100s',
        nameAr: 'شاي مستورد',
        categoryNameEn: 'Hot Beverages',
        baseUnitCode: 'pcs',
        purchaseCost: 2.0,
        sellingPrice: 3.5,
        openingStockQty: 25,
      },
    ];

    const res = service.importProductsFromRows(rows);
    expect(res.total).toBe(1);
    expect(res.imported).toBe(1);
    expect(res.failed).toBe(0);
  });

  it('should report row failure if required fields are missing', () => {
    const invalidRows = [
      {
        sku: '',
        nameEn: 'Invalid Item',
        nameAr: 'عنصر غير صالحة',
        categoryNameEn: 'General',
        baseUnitCode: 'pcs',
        purchaseCost: 1,
        sellingPrice: 2,
      },
    ];

    const res = service.importProductsFromRows(invalidRows);
    expect(res.imported).toBe(0);
    expect(res.failed).toBe(1);
    expect(res.errors[0].row).toBe(1);
  });
});
