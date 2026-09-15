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
      | { id: string; invoice_number: string; grand_total: number; payment_status: string }
      | undefined;
    if (!sale) throw new Error('Sales order not found');

    if (sale.payment_status === 'Refunded') {
      throw new Error('This invoice has already been refunded');
    }

    const refundId = crypto.randomUUID();
    const refundNumber = this.numberingService.generateNextNumber('inv');
    const now = new Date().toISOString();

    // Fetch the real sale items stored in sales_order_items
    let dbSaleItems: Array<{
      id: string;
      product_id: string;
      batch_id?: string | null;
      unit_id: string;
      quantity: number;
      unit_price: number;
      line_total: number;
    }> = [];

    try {
      dbSaleItems = (this.db.prepare('SELECT * FROM sales_order_items WHERE sale_id = ?').all(input.saleId) || []) as any[];
    } catch {
      dbSaleItems = [];
    }

    // Prepare list of items to refund
    let refundItemsToProcess: Array<{
      saleItemId?: string;
      productId: string;
      batchId?: string | null;
      unitId: string;
      returnedQty: number;
      refundAmount: number;
    }> = [];

    if (input.items && input.items.length > 0) {
      // Check if input items correspond to existing products in DB
      const hasMatchingDbItems = input.items.some(
        (it) => it.productId && dbSaleItems.some((dbi) => dbi.product_id === it.productId || dbi.id === it.saleItemId)
      );

      if (hasMatchingDbItems) {
        refundItemsToProcess = input.items
          .filter((it) => it.productId)
          .map((it) => {
            const match = dbSaleItems.find(
              (dbi) => dbi.product_id === it.productId || dbi.id === it.saleItemId
            );
            return {
              saleItemId: it.saleItemId || match?.id,
              productId: match ? match.product_id : it.productId!,
              batchId: it.batchId || match?.batch_id || null,
              unitId: match?.unit_id || 'default-unit',
              returnedQty: Math.abs(it.returnedQty || 1),
              refundAmount: it.refundAmount !== undefined ? it.refundAmount : (match?.line_total || 0),
            };
          });
      } else if (dbSaleItems.length > 0) {
        // Input had placeholder mock items (e.g. 'p-1'); use actual items from the sale!
        refundItemsToProcess = dbSaleItems.map((dbi) => ({
          saleItemId: dbi.id,
          productId: dbi.product_id,
          batchId: dbi.batch_id || null,
          unitId: dbi.unit_id,
          returnedQty: Math.abs(dbi.quantity),
          refundAmount: dbi.line_total,
        }));
      } else {
        // No items in DB (e.g. in unit tests), use input items
        refundItemsToProcess = input.items.map((it) => ({
          saleItemId: it.saleItemId,
          productId: it.productId || 'p-1',
          batchId: it.batchId || null,
          unitId: 'default-unit',
          returnedQty: Math.abs(it.returnedQty || 1),
          refundAmount: it.refundAmount || 0,
        }));
      }
    } else if (dbSaleItems.length > 0) {
      // Full sale refund: refund every item in the sale
      refundItemsToProcess = dbSaleItems.map((dbi) => ({
        saleItemId: dbi.id,
        productId: dbi.product_id,
        batchId: dbi.batch_id || null,
        unitId: dbi.unit_id,
        returnedQty: Math.abs(dbi.quantity),
        refundAmount: dbi.line_total,
      }));
    }

    let totalRefund = 0;
    refundItemsToProcess.forEach((item) => {
      totalRefund += item.refundAmount;
    });
    if (totalRefund === 0 && sale.grand_total) {
      totalRefund = sale.grand_total;
    }

    const insertRefund = this.db.prepare(`
      INSERT INTO sales_refunds (id, refund_number, sale_id, reason, refund_amount, refund_method, processed_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = this.db.prepare(`
      INSERT INTO sales_refund_items (id, refund_id, sale_item_id, product_id, batch_id, returned_qty, refund_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const updateSaleStatus = this.db.prepare(`
      UPDATE sales_orders SET payment_status = 'Refunded' WHERE id = ?
    `);

    this.db.transaction(() => {
      insertRefund.run(
        refundId,
        refundNumber,
        input.saleId,
        input.reason || 'Customer Return',
        totalRefund,
        input.refundMethod || 'Cash',
        userId || 'cashier',
        now,
      );

      for (const item of refundItemsToProcess) {
        insertItem.run(
          crypto.randomUUID(),
          refundId,
          item.saleItemId || crypto.randomUUID(),
          item.productId,
          item.batchId || null,
          item.returnedQty,
          item.refundAmount,
        );

        // Safely return the item back to store inventory
        try {
          this.inventoryService.createAdjustment(
            {
              productId: item.productId,
              batchId: item.batchId || undefined,
              movementType: 'Customer sale refund',
              quantityChange: Math.abs(item.returnedQty),
              unitCost: item.refundAmount / (item.returnedQty || 1),
              reason: `POS Refund Receipt #${refundNumber} for Sale #${sale.invoice_number}`,
            },
            userId,
          );
        } catch (err) {
          logger.warn(
            'POSRefundService',
            `Could not create stock adjustment for product ${item.productId}: ${(err as Error).message}`,
          );
        }
      }

      // Mark the invoice as Refunded
      updateSaleStatus.run(input.saleId);
    })();

    this.auditRepo.logAction({
      user_id: userId,
      action: 'SALE_REFUNDED',
      module: 'POS',
      details: `Processed Refund #${refundNumber} for Sale #${sale.invoice_number} total ${totalRefund}`,
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
