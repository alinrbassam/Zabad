import Database from 'better-sqlite3';
import { ProductService } from './product.service';
import { CategoryRepository } from '../database/repositories/category.repository';
import { UnitRepository } from '../database/repositories/unit.repository';
import { ProductEntity } from '@shared/types';
import { logger } from './logger.service';

export interface ImportProductRow {
  sku: string;
  nameEn: string;
  nameAr: string;
  primaryBarcode?: string;
  categoryNameEn: string;
  baseUnitCode: string;
  purchaseCost: number;
  sellingPrice: number;
  openingStockQty?: number;
}

export class ImportExportService {
  private db: Database.Database;
  private productService: ProductService;
  private categoryRepo: CategoryRepository;
  private unitRepo: UnitRepository;

  constructor(db: Database.Database) {
    this.db = db;
    this.productService = new ProductService(db);
    this.categoryRepo = new CategoryRepository(db);
    this.unitRepo = new UnitRepository(db);
  }

  public importProductsFromRows(
    rows: ImportProductRow[],
    userId?: string,
  ): {
    total: number;
    imported: number;
    failed: number;
    errors: { row: number; error: string }[];
  } {
    logger.info('ImportExportService', `Starting product import batch of ${rows.length} rows`);

    const categories = this.categoryRepo.findAll();
    const units = this.unitRepo.findAll();

    let imported = 0;
    let failed = 0;
    const errors: { row: number; error: string }[] = [];

    const defaultUnit = units.find((u) => u.code === 'pcs') || units[0];

    const tx = this.db.transaction(() => {
      rows.forEach((row, index) => {
        const rowNum = index + 1;
        try {
          if (!row.sku || !row.nameEn || !row.nameAr) {
            throw new Error('Required fields missing (SKU, English Name, Arabic Name)');
          }

          // Resolve Category ID
          let category = categories.find(
            (c) => c.name_en.toLowerCase() === row.categoryNameEn.toLowerCase(),
          );
          if (!category) {
            category = this.categoryRepo.createCategory({
              name_en: row.categoryNameEn || 'General Category',
              name_ar: row.categoryNameEn || 'عام',
            });
            categories.push(category);
          }

          // Resolve Unit ID
          const unit = units.find((u) => u.code === row.baseUnitCode) || defaultUnit;

          this.productService.createProduct(
            {
              sku: row.sku,
              primaryBarcode: row.primaryBarcode || undefined,
              nameEn: row.nameEn,
              nameAr: row.nameAr,
              categoryId: category.id,
              baseUnitId: unit.id,
              productType: 'Standard stock item',
              purchaseCost: row.purchaseCost || 0,
              sellingPrice: row.sellingPrice || 0,
              openingStockQty: row.openingStockQty || 0,
              allowDecimalQty: unit.allow_decimals === 1,
              qtyPrecision: unit.decimal_precision,
              minSellingPrice: 0,
              wholesalePrice: 0,
              avgCost: row.purchaseCost || 0,
              lastPurchaseCost: row.purchaseCost || 0,
              taxRate: 0,
              pricesIncludeTax: false,
              isTaxExempt: false,
              allowDiscount: true,
              trackInventory: true,
              minStock: 0,
              maxStock: 0,
              reorderLevel: 0,
              defaultReorderQty: 0,
              allowNegativeStock: false,
              trackBatches: false,
              trackExpiry: false,
              trackSerials: false,
              shelfLifeDays: 0,
              isActive: true,
              isFeatured: false,
            },
            userId,
          );

          imported++;
        } catch (err) {
          failed++;
          errors.push({ row: rowNum, error: (err as Error).message });
        }
      });
    });

    tx();

    logger.info(
      'ImportExportService',
      `Import completed. Total: ${rows.length}, Imported: ${imported}, Failed: ${failed}`,
    );
    return {
      total: rows.length,
      imported,
      failed,
      errors,
    };
  }

  public exportProductsToCsv(products: ProductEntity[], includeCost = true): string {
    const headers = includeCost
      ? [
          'SKU',
          'Primary Barcode',
          'English Name',
          'Arabic Name',
          'Category ID',
          'Base Unit ID',
          'Purchase Cost',
          'Selling Price',
          'Active',
        ]
      : [
          'SKU',
          'Primary Barcode',
          'English Name',
          'Arabic Name',
          'Category ID',
          'Base Unit ID',
          'Selling Price',
          'Active',
        ];

    const lines = [headers.join(',')];

    for (const p of products) {
      const row = includeCost
        ? [
            `"${p.sku}"`,
            `"${p.primary_barcode || ''}"`,
            `"${p.name_en.replace(/"/g, '""')}"`,
            `"${p.name_ar.replace(/"/g, '""')}"`,
            `"${p.category_id}"`,
            `"${p.base_unit_id}"`,
            p.purchase_cost,
            p.selling_price,
            p.is_active ? 'Yes' : 'No',
          ]
        : [
            `"${p.sku}"`,
            `"${p.primary_barcode || ''}"`,
            `"${p.name_en.replace(/"/g, '""')}"`,
            `"${p.name_ar.replace(/"/g, '""')}"`,
            `"${p.category_id}"`,
            `"${p.base_unit_id}"`,
            p.selling_price,
            p.is_active ? 'Yes' : 'No',
          ];
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }
}
