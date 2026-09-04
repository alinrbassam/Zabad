import Database from 'better-sqlite3';
import { InventoryRepository } from '../database/repositories/inventory.repository';
import { ProductRepository } from '../database/repositories/product.repository';
import { AuditRepository } from '../database/repositories/audit.repository';
import { StockAdjustmentInput } from '@shared/validation';
import { InventoryBalanceEntity, InventoryMovementEntity } from '@shared/types';
import { logger } from './logger.service';

export class InventoryService {
  private db: Database.Database;
  private inventoryRepo: InventoryRepository;
  private productRepo: ProductRepository;
  private auditRepo: AuditRepository;

  constructor(db: Database.Database) {
    this.db = db;
    this.inventoryRepo = new InventoryRepository(db);
    this.productRepo = new ProductRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  public getProductStock(productId: string): InventoryBalanceEntity {
    return this.inventoryRepo.getBalance(productId);
  }

  public getBalance(productId: string): InventoryBalanceEntity {
    return this.inventoryRepo.getBalance(productId);
  }

  public getMovements(productId?: string, limit = 100): InventoryMovementEntity[] {
    return this.inventoryRepo.getMovements(productId, limit);
  }

  public createAdjustment(input: StockAdjustmentInput, userId?: string): InventoryMovementEntity {
    const product = this.productRepo.findById(input.productId);
    if (!product) throw new Error('Product not found');

    const deductionTypes = [
      'Manual deduction',
      'Damaged stock',
      'Expired stock',
      'Lost stock',
      'Future purchase return',
    ];

    const additionTypes = ['Manual addition', 'Future purchase receipt'];

    let delta = input.quantityChange;
    if (deductionTypes.includes(input.movementType)) {
      delta = -Math.abs(input.quantityChange);
    } else if (additionTypes.includes(input.movementType)) {
      delta = Math.abs(input.quantityChange);
    }

    logger.info(
      'InventoryService',
      `Executing stock adjustment: ${input.movementType} (${delta}) for ${product.name_en}`,
    );

    const movement = this.inventoryRepo.recordStockMovement({
      productId: input.productId,
      batchId: input.batchId,
      movementType: input.movementType,
      quantityChange: delta,
      unitId: product.base_unit_id,
      costAtTime: input.unitCost || product.purchase_cost,
      reason: input.reason,
      notes: input.notes,
      userId,
    });

    this.auditRepo.logAction({
      user_id: userId,
      action: 'STOCK_ADJUSTMENT',
      module: 'Inventory',
      details: `${input.movementType} of ${delta} for product ${product.name_en} (${product.sku}). Reason: ${input.reason}`,
    });

    return movement;
  }

  public getInventorySummary() {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(p.id) as totalProducts,
        COALESCE(SUM(b.quantity_on_hand), 0) as totalStockQty,
        COALESCE(SUM(b.quantity_on_hand * p.purchase_cost), 0) as totalCostValue,
        COALESCE(SUM(b.quantity_on_hand * p.selling_price), 0) as totalSellingValue,
        SUM(CASE 
          WHEN COALESCE(b.quantity_on_hand, 0) > 0 
           AND COALESCE(b.quantity_on_hand, 0) < (CASE WHEN p.reorder_level IS NOT NULL AND p.reorder_level > 0 THEN p.reorder_level ELSE 100 END) 
          THEN 1 ELSE 0 END) as lowStockCount,
        SUM(CASE WHEN COALESCE(b.quantity_on_hand, 0) <= 0 THEN 1 ELSE 0 END) as outOfStockCount
      FROM products p
      LEFT JOIN inventory_balances b ON p.id = b.product_id
      WHERE (p.deleted_at IS NULL OR p.deleted_at = '') AND p.is_active = 1
    `);
    const res = stmt.get() as {
      totalProducts: number;
      totalStockQty: number;
      totalCostValue: number;
      totalSellingValue: number;
      lowStockCount: number;
      outOfStockCount: number;
    };

    const expStmt = this.db.prepare(`
      SELECT
        SUM(CASE WHEN expiry_date <= CURRENT_TIMESTAMP THEN 1 ELSE 0 END) as expiredCount,
        SUM(CASE WHEN expiry_date > CURRENT_TIMESTAMP AND expiry_date <= datetime('now', '+30 days') THEN 1 ELSE 0 END) as expiringSoonCount
      FROM batches
      WHERE remaining_qty > 0
    `);
    const expRes = expStmt.get() as { expiredCount: number; expiringSoonCount: number };

    return {
      ...res,
      expiredCount: expRes.expiredCount || 0,
      expiringSoonCount: expRes.expiringSoonCount || 0,
    };
  }

  public reconcileLedger(): void {
    this.inventoryRepo.reconcileBalancesFromLedger();
  }
}
