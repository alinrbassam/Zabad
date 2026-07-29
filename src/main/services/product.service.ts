import Database from 'better-sqlite3';
import { ProductRepository } from '../database/repositories/product.repository';
import { InventoryRepository } from '../database/repositories/inventory.repository';
import { BatchRepository } from '../database/repositories/batch.repository';
import { AuditRepository } from '../database/repositories/audit.repository';
import { ProductInput } from '@shared/validation';
import { ProductEntity } from '@shared/types';
import { logger } from './logger.service';

export class ProductService {
  private productRepo: ProductRepository;
  private inventoryRepo: InventoryRepository;
  private batchRepo: BatchRepository;
  private auditRepo: AuditRepository;

  constructor(db: Database.Database) {
    this.productRepo = new ProductRepository(db);
    this.inventoryRepo = new InventoryRepository(db);
    this.batchRepo = new BatchRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  public getProductById(id: string): ProductEntity | null {
    return this.productRepo.findById(id);
  }

  public getProductByBarcode(barcode: string): ProductEntity | null {
    return this.productRepo.findByBarcode(barcode);
  }

  public searchProducts(query: string, limit = 50, offset = 0): ProductEntity[] {
    return this.productRepo.searchProducts(query, limit, offset);
  }

  public createProduct(input: ProductInput, userId?: string): ProductEntity {
    // Check SKU duplicate
    const existingSku = this.productRepo.findBySku(input.sku);
    if (existingSku) {
      throw new Error(`SKU '${input.sku}' is already in use by product '${existingSku.name_en}'.`);
    }

    // Check Barcode duplicate
    if (input.primaryBarcode) {
      const existingBarcode = this.productRepo.findByBarcode(input.primaryBarcode);
      if (existingBarcode) {
        throw new Error(
          `Barcode '${input.primaryBarcode}' is already assigned to '${existingBarcode.name_en}'.`,
        );
      }
    }

    logger.info('ProductService', `Creating new product: ${input.nameEn} (${input.sku})`);

    const product = this.productRepo.createProduct({
      sku: input.sku,
      product_code: input.productCode,
      primary_barcode: input.primaryBarcode,
      name_en: input.nameEn,
      name_ar: input.nameAr,
      short_name: input.shortName,
      description: input.description,
      internal_notes: input.internalNotes,
      category_id: input.categoryId,
      subcategory_id: input.subcategoryId,
      brand_id: input.brandId,
      primary_supplier_id: input.primarySupplierId,
      product_type: input.productType,
      base_unit_id: input.baseUnitId,
      selling_unit_id: input.sellingUnitId,
      purchasing_unit_id: input.purchasingUnitId,
      allow_decimal_qty: input.allowDecimalQty ? 1 : 0,
      qty_precision: input.qtyPrecision,
      purchase_cost: input.purchaseCost,
      avg_cost: input.purchaseCost,
      last_purchase_cost: input.purchaseCost,
      selling_price: input.sellingPrice,
      wholesale_price: input.wholesalePrice,
      min_selling_price: input.minSellingPrice,
      tax_rate: input.taxRate,
      prices_include_tax: input.pricesIncludeTax ? 1 : 0,
      is_tax_exempt: input.isTaxExempt ? 1 : 0,
      allow_discount: input.allowDiscount ? 1 : 0,
      track_inventory: input.trackInventory ? 1 : 0,
      min_stock: input.minStock,
      max_stock: input.maxStock,
      reorder_level: input.reorderLevel,
      default_reorder_qty: input.defaultReorderQty,
      allow_negative_stock: input.allowNegativeStock ? 1 : 0,
      storage_location: input.storageLocation,
      shelf_code: input.shelfCode,
      track_batches: input.trackBatches ? 1 : 0,
      track_expiry: input.trackExpiry ? 1 : 0,
      track_serials: input.trackSerials ? 1 : 0,
      shelf_life_days: input.shelfLifeDays,
      image_url: input.imageUrl,
      thumbnail_url: input.thumbnailUrl,
      preferred_receipt_name: input.preferredReceiptName,
      is_active: input.isActive ? 1 : 0,
      is_featured: input.isFeatured ? 1 : 0,
      created_by: userId,
    });

    // Handle Opening Stock if provided
    if (input.openingStockQty && input.openingStockQty > 0 && input.trackInventory) {
      let batchId: string | undefined = undefined;
      if (input.trackBatches && input.openingBatchNumber) {
        const batch = this.batchRepo.createBatch({
          productId: product.id,
          batchNumber: input.openingBatchNumber,
          expiryDate: input.openingExpiryDate,
          receivedQty: input.openingStockQty,
          unitCost: input.purchaseCost,
        });
        batchId = batch.id;
      }

      this.inventoryRepo.recordStockMovement({
        productId: product.id,
        batchId,
        movementType: 'Opening stock',
        quantityChange: input.openingStockQty,
        unitId: input.baseUnitId,
        costAtTime: input.purchaseCost,
        reason: 'Initial Opening Stock Entry',
        userId,
      });
    }

    this.auditRepo.logAction({
      user_id: userId,
      action: 'PRODUCT_CREATED',
      module: 'Inventory',
      details: `Created product ${product.name_en} (SKU: ${product.sku})`,
    });

    return product;
  }

  public updateProduct(
    input: Partial<ProductInput> & { id: string },
    userId?: string,
  ): ProductEntity {
    const updated = this.productRepo.updateProduct({
      id: input.id,
      sku: input.sku,
      product_code: input.productCode,
      primary_barcode: input.primaryBarcode,
      name_en: input.nameEn,
      name_ar: input.nameAr,
      short_name: input.shortName,
      description: input.description,
      internal_notes: input.internalNotes,
      category_id: input.categoryId,
      subcategory_id: input.subcategoryId,
      brand_id: input.brandId,
      primary_supplier_id: input.primarySupplierId,
      product_type: input.productType,
      base_unit_id: input.baseUnitId,
      selling_unit_id: input.sellingUnitId,
      purchasing_unit_id: input.purchasingUnitId,
      allow_decimal_qty:
        input.allowDecimalQty !== undefined ? (input.allowDecimalQty ? 1 : 0) : undefined,
      qty_precision: input.qtyPrecision,
      purchase_cost: input.purchaseCost,
      selling_price: input.sellingPrice,
      wholesale_price: input.wholesalePrice,
      min_selling_price: input.minSellingPrice,
      tax_rate: input.taxRate,
      prices_include_tax:
        input.pricesIncludeTax !== undefined ? (input.pricesIncludeTax ? 1 : 0) : undefined,
      is_tax_exempt: input.isTaxExempt !== undefined ? (input.isTaxExempt ? 1 : 0) : undefined,
      allow_discount: input.allowDiscount !== undefined ? (input.allowDiscount ? 1 : 0) : undefined,
      track_inventory:
        input.trackInventory !== undefined ? (input.trackInventory ? 1 : 0) : undefined,
      min_stock: input.minStock,
      max_stock: input.maxStock,
      reorder_level: input.reorderLevel,
      default_reorder_qty: input.defaultReorderQty,
      allow_negative_stock:
        input.allowNegativeStock !== undefined ? (input.allowNegativeStock ? 1 : 0) : undefined,
      storage_location: input.storageLocation,
      shelf_code: input.shelfCode,
      track_batches: input.trackBatches !== undefined ? (input.trackBatches ? 1 : 0) : undefined,
      track_expiry: input.trackExpiry !== undefined ? (input.trackExpiry ? 1 : 0) : undefined,
      track_serials: input.trackSerials !== undefined ? (input.trackSerials ? 1 : 0) : undefined,
      shelf_life_days: input.shelfLifeDays,
      image_url: input.imageUrl,
      thumbnail_url: input.thumbnailUrl,
      preferred_receipt_name: input.preferredReceiptName,
      is_active: input.isActive !== undefined ? (input.isActive ? 1 : 0) : undefined,
      is_featured: input.isFeatured !== undefined ? (input.isFeatured ? 1 : 0) : undefined,
      updated_by: userId,
    });

    this.auditRepo.logAction({
      user_id: userId,
      action: 'PRODUCT_UPDATED',
      module: 'Inventory',
      details: `Updated product ${updated.name_en} (${updated.sku})`,
    });

    return updated;
  }

  public archiveProduct(id: string, userId?: string): void {
    const product = this.productRepo.findById(id);
    if (!product) throw new Error('Product not found');

    this.productRepo.softDelete(id);
    this.auditRepo.logAction({
      user_id: userId,
      action: 'PRODUCT_ARCHIVED',
      module: 'Inventory',
      details: `Archived product ${product.name_en} (${product.sku})`,
    });
  }
}
