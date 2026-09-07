import Database from 'better-sqlite3';
import { InventoryBalanceEntity, InventoryMovementEntity } from '@shared/types';
import { logger } from '../../services/logger.service';

export class InventoryRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public getBalance(productId: string): InventoryBalanceEntity {
    const stmt = this.db.prepare('SELECT * FROM inventory_balances WHERE product_id = ?');
    const row = stmt.get(productId) as InventoryBalanceEntity | undefined;

    if (row) return row;

    // Initialize balance row
    const initStmt = this.db.prepare(`
      INSERT OR IGNORE INTO inventory_balances (product_id, quantity_on_hand, reserved_quantity, available_quantity, damaged_quantity, expired_quantity)
      VALUES (?, 0, 0, 0, 0, 0)
    `);
    initStmt.run(productId);

    return {
      product_id: productId,
      quantity_on_hand: 0,
      reserved_quantity: 0,
      available_quantity: 0,
      damaged_quantity: 0,
      expired_quantity: 0,
      updated_at: new Date().toISOString(),
    };
  }

  public recordStockMovement(movement: {
    productId: string;
    batchId?: string;
    movementType: string;
    quantityChange: number;
    unitId: string;
    costAtTime?: number;
    referenceType?: string;
    referenceId?: string;
    referenceNumber?: string;
    reason?: string;
    notes?: string;
    userId?: string;
  }): InventoryMovementEntity {
    let resultMovement: InventoryMovementEntity | null = null;

    const tx = this.db.transaction(() => {
      const currentBal = this.getBalance(movement.productId);
      const qtyBefore = currentBal.quantity_on_hand;
      const qtyAfter = qtyBefore + movement.quantityChange;

      const movementId = crypto.randomUUID();
      const now = new Date().toISOString();

      const insertMovementStmt = this.db.prepare(`
        INSERT INTO inventory_movements (
          id, product_id, batch_id, movement_type, quantity_change, quantity_before,
          quantity_after, unit_id, cost_at_time, reference_type, reference_id,
          reference_number, reason, notes, user_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertMovementStmt.run(
        movementId,
        movement.productId,
        movement.batchId || null,
        movement.movementType,
        movement.quantityChange,
        qtyBefore,
        qtyAfter,
        movement.unitId,
        movement.costAtTime || 0,
        movement.referenceType || null,
        movement.referenceId || null,
        movement.referenceNumber || null,
        movement.reason || null,
        movement.notes || null,
        movement.userId || null,
        now,
      );

      // Update balances table
      let damagedDelta = 0;
      let expiredDelta = 0;
      if (movement.movementType === 'Damaged stock') {
        damagedDelta = Math.abs(movement.quantityChange);
      } else if (movement.movementType === 'Expired stock') {
        expiredDelta = Math.abs(movement.quantityChange);
      }

      const updateBalStmt = this.db.prepare(`
        UPDATE inventory_balances SET
          quantity_on_hand = ?,
          available_quantity = ? - reserved_quantity,
          damaged_quantity = damaged_quantity + ?,
          expired_quantity = expired_quantity + ?,
          updated_at = ?
        WHERE product_id = ?
      `);

      updateBalStmt.run(qtyAfter, qtyAfter, damagedDelta, expiredDelta, now, movement.productId);

      resultMovement = {
        id: movementId,
        product_id: movement.productId,
        batch_id: movement.batchId,
        movement_type: movement.movementType,
        quantity_change: movement.quantityChange,
        quantity_before: qtyBefore,
        quantity_after: qtyAfter,
        unit_id: movement.unitId,
        cost_at_time: movement.costAtTime || 0,
        reference_type: movement.referenceType,
        reference_id: movement.referenceId,
        reference_number: movement.referenceNumber,
        reason: movement.reason,
        notes: movement.notes,
        user_id: movement.userId,
        created_at: now,
      };
    });

    tx();
    logger.info(
      'InventoryRepository',
      `Recorded ${movement.movementType} (${movement.quantityChange}) for product ${movement.productId}`,
    );
    return resultMovement!;
  }

  public getMovements(productId?: string, limit = 100): InventoryMovementEntity[] {
    if (productId) {
      const stmt = this.db.prepare(`
        SELECT m.*, p.name_en as product_name, p.sku, COALESCE(u.symbol, u.code, '') as unit_symbol
        FROM inventory_movements m
        LEFT JOIN products p ON m.product_id = p.id
        LEFT JOIN units u ON m.unit_id = u.id
        WHERE m.product_id = ?
        ORDER BY m.created_at DESC
        LIMIT ?
      `);
      return stmt.all(productId, limit) as InventoryMovementEntity[];
    }
    const stmt = this.db.prepare(`
      SELECT m.*, p.name_en as product_name, p.sku, COALESCE(u.symbol, u.code, '') as unit_symbol
      FROM inventory_movements m
      LEFT JOIN products p ON m.product_id = p.id
      LEFT JOIN units u ON m.unit_id = u.id
      ORDER BY m.created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit) as InventoryMovementEntity[];
  }

  public reconcileBalancesFromLedger(): void {
    logger.info('InventoryRepository', 'Running database ledger balance reconciliation routine');
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM inventory_balances').run();

      const stmt = this.db.prepare(`
        INSERT INTO inventory_balances (product_id, quantity_on_hand, available_quantity, updated_at)
        SELECT product_id, SUM(quantity_change) as total_on_hand, SUM(quantity_change) as total_avail, CURRENT_TIMESTAMP
        FROM inventory_movements
        GROUP BY product_id
      `);
      stmt.run();
    });
    tx();
  }
}
