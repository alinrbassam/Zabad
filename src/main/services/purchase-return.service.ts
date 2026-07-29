import Database from 'better-sqlite3';
import { PurchaseReturnInput } from '../../shared/validation';
import { PurchaseReturnEntity } from '../../shared/types';
import { InventoryService } from './inventory.service';
import { PurchaseNumberingService } from './purchase-numbering.service';
import { AuditRepository } from '../database/repositories/audit.repository';
import { logger } from './logger.service';

export class PurchaseReturnService {
  private db: Database.Database;
  private inventoryService: InventoryService;
  private numberingService: PurchaseNumberingService;
  private auditRepo: AuditRepository;

  constructor(db: Database.Database) {
    this.db = db;
    this.inventoryService = new InventoryService(db);
    this.numberingService = new PurchaseNumberingService(db);
    this.auditRepo = new AuditRepository(db);
  }

  public createReturn(input: PurchaseReturnInput, userId?: string): PurchaseReturnEntity {
    const returnId = crypto.randomUUID();
    const returnNumber = this.numberingService.generateNextNumber('pr');
    const now = new Date().toISOString();

    const insertReturn = this.db.prepare(`
      INSERT INTO purchase_returns (
        id, return_number, supplier_id, receipt_id, return_date, reason, status, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'Completed', ?, ?, ?)
    `);

    const insertItem = this.db.prepare(`
      INSERT INTO purchase_return_items (
        id, return_id, product_id, batch_id, unit_id, returned_qty, unit_cost, reason, stock_disposition
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.db.transaction(() => {
      insertReturn.run(
        returnId,
        returnNumber,
        input.supplierId,
        input.receiptId || null,
        input.returnDate,
        input.reason,
        input.notes || null,
        userId || 'system',
        now,
      );

      for (const item of input.items) {
        insertItem.run(
          crypto.randomUUID(),
          returnId,
          item.productId,
          item.batchId || null,
          item.unitId,
          item.returnedQty,
          item.unitCost,
          item.reason || null,
          item.stockDisposition || 'Remove from sellable stock',
        );

        this.inventoryService.createAdjustment(
          {
            productId: item.productId,
            batchId: item.batchId,
            movementType: 'Future purchase return',
            quantityChange: -Math.abs(item.returnedQty),
            unitCost: item.unitCost,
            reason: `Supplier return #${returnNumber}: ${input.reason}`,
          },
          userId,
        );
      }
    })();

    this.auditRepo.logAction({
      user_id: userId,
      action: 'PURCHASE_RETURN_CREATED',
      module: 'Purchasing',
      details: `Completed Supplier Return #${returnNumber} for supplier ${input.supplierId}`,
    });

    logger.info('PurchaseReturnService', `Completed Supplier Return #${returnNumber}`);

    return {
      id: returnId,
      return_number: returnNumber,
      supplier_id: input.supplierId,
      receipt_id: input.receiptId,
      return_date: input.returnDate,
      reason: input.reason,
      status: 'Completed',
      notes: input.notes,
      created_by: userId,
      created_at: now,
    };
  }

  public getReturns(): PurchaseReturnEntity[] {
    const stmt = this.db.prepare(
      'SELECT pr.*, s.name as supplier_name FROM purchase_returns pr LEFT JOIN suppliers s ON pr.supplier_id = s.id ORDER BY pr.created_at DESC',
    );
    return stmt.all() as PurchaseReturnEntity[];
  }
}
