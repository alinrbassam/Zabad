import Database from 'better-sqlite3';
import { POSRefundInput } from '../../shared/validation';
import { SalesRefundEntity } from '../../shared/types';
import { InventoryService } from './inventory.service';
import { PurchaseNumberingService } from './purchase-numbering.service';
import { AuditRepository } from '../database/repositories/audit.repository';
import { logger } from './logger.service';

export class POSRefundService {
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

  public processRefund(input: POSRefundInput, userId?: string): SalesRefundEntity {
    const sale = this.db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(input.saleId) as
      | { invoice_number: string }
      | undefined;
    if (!sale) throw new Error('Sales order not found');

    const refundId = crypto.randomUUID();
    const refundNumber = this.numberingService.generateNextNumber('inv');
    const now = new Date().toISOString();

    let totalRefund = 0;
    input.items.forEach((item) => {
      totalRefund += item.refundAmount;
    });

    const insertRefund = this.db.prepare(`
      INSERT INTO sales_refunds (id, refund_number, sale_id, refund_amount, reason, cashier_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = this.db.prepare(`
      INSERT INTO sales_refund_items (id, refund_id, product_id, batch_id, unit_id, quantity, unit_price, line_total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.db.transaction(() => {
      insertRefund.run(
        refundId,
        refundNumber,
        input.saleId,
        totalRefund,
        input.reason,
        userId || 'cashier',
        now,
      );

      for (const item of input.items) {
        insertItem.run(
          crypto.randomUUID(),
          refundId,
          item.productId,
          item.batchId || null,
          'default-unit',
          item.returnedQty,
          item.refundAmount,
          item.refundAmount,
        );

        this.inventoryService.createAdjustment(
          {
            productId: item.productId,
            batchId: item.batchId,
            movementType: 'Customer sale refund',
            quantityChange: Math.abs(item.returnedQty),
            unitCost: item.refundAmount,
            reason: `POS Refund Receipt #${refundNumber} for Sale #${sale.invoice_number}`,
          },
          userId,
        );
      }
    })();

    this.auditRepo.logAction({
      user_id: userId,
      action: 'SALE_REFUNDED',
      module: 'POS',
      details: `Processed Refund #${refundNumber} for Sale #${sale.invoice_number} total $${totalRefund}`,
    });

    logger.info('POSRefundService', `Processed Refund #${refundNumber}`);

    return {
      id: refundId,
      refund_number: refundNumber,
      sale_id: input.saleId,
      refund_amount: totalRefund,
      refund_method: input.refundMethod,
      reason: input.reason,
      processed_by: userId || 'cashier',
      created_at: now,
    };
  }
}
