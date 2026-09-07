import Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import { ProductEntity, BarcodeEntity } from '@shared/types';
import { logger } from '../../services/logger.service';

export class ProductRepository extends BaseRepository<ProductEntity> {
  constructor(db: Database.Database) {
    super(db, 'products');
  }

  public findBySku(sku: string): ProductEntity | null {
    const stmt = this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE LOWER(sku) = LOWER(?) AND (deleted_at IS NULL OR deleted_at = '')`,
    );
    const row = stmt.get(sku);
    return (row as ProductEntity) || null;
  }

  public findByBarcode(barcode: string): (ProductEntity & { barcode_type?: string }) | null {
    const stmt = this.db.prepare(`
      SELECT p.*, pb.barcode_type FROM products p
      LEFT JOIN product_barcodes pb ON p.id = pb.product_id
      WHERE (LOWER(p.primary_barcode) = LOWER(?) OR LOWER(pb.barcode) = LOWER(?))
        AND (p.deleted_at IS NULL OR p.deleted_at = '')
      LIMIT 1
    `);
    const row = stmt.get(barcode, barcode);
    return (row as ProductEntity & { barcode_type?: string }) || null;
  }

  public searchProducts(query: string, limit = 50, offset = 0): ProductEntity[] {
    const term = `%${query.toLowerCase()}%`;
    const stmt = this.db.prepare(`
      SELECT DISTINCT p.*, COALESCE(b.quantity_on_hand, 0) as quantity_on_hand,
             COALESCE(u.symbol, u.code, '') as unit_symbol
      FROM products p
      LEFT JOIN product_barcodes pb ON p.id = pb.product_id
      LEFT JOIN inventory_balances b ON p.id = b.product_id
      LEFT JOIN units u ON p.base_unit_id = u.id
      WHERE (p.deleted_at IS NULL OR p.deleted_at = '')
        AND (LOWER(p.name_en) LIKE ?
          OR LOWER(p.name_ar) LIKE ?
          OR LOWER(p.sku) LIKE ?
          OR LOWER(p.primary_barcode) LIKE ?
          OR LOWER(pb.barcode) LIKE ?)
      ORDER BY p.name_en ASC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(term, term, term, term, term, limit, offset) as ProductEntity[];
  }

  public createProduct(product: Partial<ProductEntity>): ProductEntity {
    const id = product.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO products (
        id, sku, product_code, primary_barcode, name_en, name_ar, short_name, description, internal_notes,
        category_id, subcategory_id, brand_id, primary_supplier_id, product_type, base_unit_id, selling_unit_id,
        purchasing_unit_id, allow_decimal_qty, qty_precision, purchase_cost, avg_cost, last_purchase_cost,
        selling_price, wholesale_price, min_selling_price, tax_rate, prices_include_tax, is_tax_exempt,
        allow_discount, track_inventory, min_stock, max_stock, reorder_level, default_reorder_qty,
        allow_negative_stock, storage_location, shelf_code, track_batches, track_expiry, track_serials,
        shelf_life_days, image_url, thumbnail_url, preferred_receipt_name, is_active, is_featured, created_by,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?
      )
    `);

    stmt.run(
      id,
      product.sku,
      product.product_code || null,
      product.primary_barcode || null,
      product.name_en,
      product.name_ar,
      product.short_name || null,
      product.description || null,
      product.internal_notes || null,
      product.category_id,
      product.subcategory_id || null,
      product.brand_id || null,
      product.primary_supplier_id || null,
      product.product_type || 'Standard stock item',
      product.base_unit_id,
      product.selling_unit_id || null,
      product.purchasing_unit_id || null,
      product.allow_decimal_qty ? 1 : 0,
      product.qty_precision || 0,
      product.purchase_cost || 0,
      product.avg_cost || product.purchase_cost || 0,
      product.last_purchase_cost || product.purchase_cost || 0,
      product.selling_price || 0,
      product.wholesale_price || 0,
      product.min_selling_price || 0,
      product.tax_rate || 0,
      product.prices_include_tax ? 1 : 0,
      product.is_tax_exempt ? 1 : 0,
      product.allow_discount ? 1 : 0,
      product.track_inventory ? 1 : 0,
      product.min_stock || 0,
      product.max_stock || 0,
      product.reorder_level || 0,
      product.default_reorder_qty || 0,
      product.allow_negative_stock ? 1 : 0,
      product.storage_location || null,
      product.shelf_code || null,
      product.track_batches ? 1 : 0,
      product.track_expiry ? 1 : 0,
      product.track_serials ? 1 : 0,
      product.shelf_life_days || 0,
      product.image_url || null,
      product.thumbnail_url || null,
      product.preferred_receipt_name || null,
      product.is_active ? 1 : 0,
      product.is_featured ? 1 : 0,
      product.created_by || null,
      now,
      now,
    );

    // Also add primary barcode to product_barcodes table
    if (product.primary_barcode) {
      const bcStmt = this.db.prepare(`
        INSERT OR IGNORE INTO product_barcodes (id, product_id, barcode, barcode_type, is_primary, is_active)
        VALUES (?, ?, ?, 'Primary', 1, 1)
      `);
      bcStmt.run(crypto.randomUUID(), id, product.primary_barcode);
    }

    return this.findById(id)!;
  }

  public updateProduct(product: Partial<ProductEntity> & { id: string }): ProductEntity {
    const existing = this.findById(product.id);
    if (!existing) throw new Error('Product not found');

    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE products SET
        sku = ?, product_code = ?, primary_barcode = ?, name_en = ?, name_ar = ?, short_name = ?,
        description = ?, internal_notes = ?, category_id = ?, subcategory_id = ?, brand_id = ?,
        primary_supplier_id = ?, product_type = ?, base_unit_id = ?, selling_unit_id = ?,
        purchasing_unit_id = ?, allow_decimal_qty = ?, qty_precision = ?, purchase_cost = ?,
        avg_cost = ?, last_purchase_cost = ?, selling_price = ?, wholesale_price = ?,
        min_selling_price = ?, tax_rate = ?, prices_include_tax = ?, is_tax_exempt = ?,
        allow_discount = ?, track_inventory = ?, min_stock = ?, max_stock = ?, reorder_level = ?,
        default_reorder_qty = ?, allow_negative_stock = ?, storage_location = ?, shelf_code = ?,
        track_batches = ?, track_expiry = ?, track_serials = ?, shelf_life_days = ?, image_url = ?,
        thumbnail_url = ?, preferred_receipt_name = ?, is_active = ?, is_featured = ?,
        updated_by = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      product.sku || existing.sku,
      product.product_code || existing.product_code || null,
      product.primary_barcode || existing.primary_barcode || null,
      product.name_en || existing.name_en,
      product.name_ar || existing.name_ar,
      product.short_name || existing.short_name || null,
      product.description || existing.description || null,
      product.internal_notes || existing.internal_notes || null,
      product.category_id || existing.category_id,
      product.subcategory_id || existing.subcategory_id || null,
      product.brand_id || existing.brand_id || null,
      product.primary_supplier_id || existing.primary_supplier_id || null,
      product.product_type || existing.product_type,
      product.base_unit_id || existing.base_unit_id,
      product.selling_unit_id || existing.selling_unit_id || null,
      product.purchasing_unit_id || existing.purchasing_unit_id || null,
      product.allow_decimal_qty !== undefined
        ? product.allow_decimal_qty
          ? 1
          : 0
        : existing.allow_decimal_qty,
      product.qty_precision !== undefined ? product.qty_precision : existing.qty_precision,
      product.purchase_cost !== undefined ? product.purchase_cost : existing.purchase_cost,
      product.avg_cost !== undefined ? product.avg_cost : existing.avg_cost,
      product.last_purchase_cost !== undefined
        ? product.last_purchase_cost
        : existing.last_purchase_cost,
      product.selling_price !== undefined ? product.selling_price : existing.selling_price,
      product.wholesale_price !== undefined ? product.wholesale_price : existing.wholesale_price,
      product.min_selling_price !== undefined
        ? product.min_selling_price
        : existing.min_selling_price,
      product.tax_rate !== undefined ? product.tax_rate : existing.tax_rate,
      product.prices_include_tax !== undefined
        ? product.prices_include_tax
          ? 1
          : 0
        : existing.prices_include_tax,
      product.is_tax_exempt !== undefined
        ? product.is_tax_exempt
          ? 1
          : 0
        : existing.is_tax_exempt,
      product.allow_discount !== undefined
        ? product.allow_discount
          ? 1
          : 0
        : existing.allow_discount,
      product.track_inventory !== undefined
        ? product.track_inventory
          ? 1
          : 0
        : existing.track_inventory,
      product.min_stock !== undefined ? product.min_stock : existing.min_stock,
      product.max_stock !== undefined ? product.max_stock : existing.max_stock,
      product.reorder_level !== undefined ? product.reorder_level : existing.reorder_level,
      product.default_reorder_qty !== undefined
        ? product.default_reorder_qty
        : existing.default_reorder_qty,
      product.allow_negative_stock !== undefined
        ? product.allow_negative_stock
          ? 1
          : 0
        : existing.allow_negative_stock,
      product.storage_location || existing.storage_location || null,
      product.shelf_code || existing.shelf_code || null,
      product.track_batches !== undefined
        ? product.track_batches
          ? 1
          : 0
        : existing.track_batches,
      product.track_expiry !== undefined ? (product.track_expiry ? 1 : 0) : existing.track_expiry,
      product.track_serials !== undefined
        ? product.track_serials
          ? 1
          : 0
        : existing.track_serials,
      product.shelf_life_days !== undefined ? product.shelf_life_days : existing.shelf_life_days,
      product.image_url || existing.image_url || null,
      product.thumbnail_url || existing.thumbnail_url || null,
      product.preferred_receipt_name || existing.preferred_receipt_name || null,
      product.is_active !== undefined ? (product.is_active ? 1 : 0) : existing.is_active,
      product.is_featured !== undefined ? (product.is_featured ? 1 : 0) : existing.is_featured,
      product.updated_by || null,
      now,
      product.id,
    );

    return this.findById(product.id)!;
  }

  public getProductBarcodes(productId: string): BarcodeEntity[] {
    const stmt = this.db.prepare(
      'SELECT * FROM product_barcodes WHERE product_id = ? AND is_active = 1',
    );
    return stmt.all(productId) as BarcodeEntity[];
  }

  public addAlternateBarcode(
    productId: string,
    barcode: string,
    type = 'Alternate',
  ): BarcodeEntity {
    const existing = this.findByBarcode(barcode);
    if (existing && existing.id !== productId) {
      throw new Error(
        `Barcode '${barcode}' is already assigned to product '${existing.name_en}' (${existing.sku}).`,
      );
    }

    const id = crypto.randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO product_barcodes (id, product_id, barcode, barcode_type, is_primary, is_active)
      VALUES (?, ?, ?, ?, 0, 1)
    `);
    stmt.run(id, productId, barcode, type);
    logger.info('ProductRepository', `Added alternate barcode ${barcode} to product ${productId}`);

    return {
      id,
      product_id: productId,
      barcode,
      barcode_type: type,
      quantity_represented: 1,
      is_primary: 0,
      is_active: 1,
      created_at: new Date().toISOString(),
    };
  }
}
