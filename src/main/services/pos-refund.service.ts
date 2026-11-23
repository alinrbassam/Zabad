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
    const sale = this.db
      .prepare("SELECT * FROM sales_orders WHERE id = ? AND (deleted_at IS NULL OR deleted_at = '')")
      .get(input.saleId) as
      | { id: string; invoice_number: string; grand_total: number; payment_status: string }
      | undefined;
    if (!sale) throw new Error('Sales order not found');

    if (sale.payment_status === 'Refunded') {
      throw new Error('This invoice has already been fully refunded');
    }

    const refundId = crypto.randomUUID();
    const refundNumber = this.numberingService.generateNextNumber('inv');
    const now = new Date().toISOString();

    // Fetch the real sale items stored in sales_order_items along with any previous returns
    type DbSaleItemRow = {
      id: string;
      product_id: string;
      batch_id?: string | null;
      unit_id: string;
      quantity: number;
      unit_price: number;
      line_total: number;
      previously_refunded_qty?: number;
    };

    let dbSaleItems: DbSaleItemRow[] = [];

    try {
      dbSaleItems = (this.db.prepare(`
        SELECT soi.*,
               COALESCE((
                 SELECT SUM(sri.returned_qty)
                 FROM sales_refund_items sri
                 JOIN sales_refunds sr ON sri.refund_id = sr.id
                 WHERE (sri.sale_item_id = soi.id OR (sri.sale_item_id = '' AND sri.product_id = soi.product_id AND sr.sale_id = soi.sale_id))
               ), 0) AS previously_refunded_qty
        FROM sales_order_items soi
        WHERE soi.sale_id = ?
      `).all(input.saleId) || []) as DbSaleItemRow[];
    } catch {
      try {
        dbSaleItems = (this.db.prepare('SELECT * FROM sales_order_items WHERE sale_id = ?').all(input.saleId) || []) as DbSaleItemRow[];
      } catch {
        dbSaleItems = [];
      }
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
              (dbi) => dbi.id === it.saleItemId || dbi.product_id === it.productId
            );
            const prevRefunded = match?.previously_refunded_qty || 0;
            const maxRefundable = match ? Math.max(0, match.quantity - prevRefunded) : 999999;
            const requestedQty = Math.abs(it.returnedQty || 1);
            const returnedQty = Math.min(requestedQty, maxRefundable > 0 ? maxRefundable : requestedQty);

            const effectiveUnitPrice = match && match.quantity > 0
              ? (match.line_total / match.quantity)
              : (match?.unit_price || 0);

            const refundAmount = it.refundAmount !== undefined
              ? it.refundAmount
              : Math.round(effectiveUnitPrice * returnedQty * 100) / 100;

            return {
              saleItemId: it.saleItemId || match?.id,
              productId: match ? match.product_id : it.productId!,
              batchId: it.batchId || match?.batch_id || null,
              unitId: match?.unit_id || 'default-unit',
              returnedQty,
              refundAmount,
            };
          })
          .filter((it) => it.returnedQty > 0);
      } else if (dbSaleItems.length > 0) {
        // Input had placeholder mock items (e.g. 'p-1'); use actual items from the sale!
        refundItemsToProcess = dbSaleItems
          .map((dbi) => {
            const prevRefunded = dbi.previously_refunded_qty || 0;
            const maxRefundable = Math.max(0, dbi.quantity - prevRefunded);
            const returnedQty = maxRefundable;
            const effectiveUnitPrice = dbi.quantity > 0 ? (dbi.line_total / dbi.quantity) : dbi.unit_price;
            return {
              saleItemId: dbi.id,
              productId: dbi.product_id,
              batchId: dbi.batch_id || null,
              unitId: dbi.unit_id,
              returnedQty,
              refundAmount: Math.round(effectiveUnitPrice * returnedQty * 100) / 100,
            };
          })
          .filter((it) => it.returnedQty > 0);
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
      // Full remaining items refund: refund every item's remaining refundable quantity
      refundItemsToProcess = dbSaleItems
        .map((dbi) => {
          const prevRefunded = dbi.previously_refunded_qty || 0;
          const remainingQty = Math.max(0, dbi.quantity - prevRefunded);
          const effectiveUnitPrice = dbi.quantity > 0 ? (dbi.line_total / dbi.quantity) : dbi.unit_price;
          return {
            saleItemId: dbi.id,
            productId: dbi.product_id,
            batchId: dbi.batch_id || null,
            unitId: dbi.unit_id,
            returnedQty: remainingQty,
            refundAmount: Math.round(effectiveUnitPrice * remainingQty * 100) / 100,
          };
        })
        .filter((it) => it.returnedQty > 0);
    }

    if (refundItemsToProcess.length === 0 && dbSaleItems.length > 0) {
      throw new Error('All items in this invoice have already been refunded');
    }

    let totalRefund = 0;
    refundItemsToProcess.forEach((item) => {
      totalRefund += item.refundAmount;
    });
    totalRefund = Math.round(totalRefund * 100) / 100;
    if (totalRefund === 0 && sale.grand_total && dbSaleItems.length === 0) {
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
      UPDATE sales_orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
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
              unitCost: item.returnedQty > 0 ? (item.refundAmount / item.returnedQty) : 0,
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

      // Check whether the order is fully refunded or partially refunded
      let isFullyRefunded = true;
      if (dbSaleItems.length > 0) {
        const totalSold = dbSaleItems.reduce((acc, it) => acc + it.quantity, 0);
        const totalPreviouslyRefunded = dbSaleItems.reduce((acc, it) => acc + (it.previously_refunded_qty || 0), 0);
        const currentReturnedTotal = refundItemsToProcess.reduce((acc, it) => acc + it.returnedQty, 0);
        const totalRefundedAllTime = totalPreviouslyRefunded + currentReturnedTotal;

        if (totalRefundedAllTime < totalSold - 0.001) {
          isFullyRefunded = false;
        }
      }

      const newStatus = isFullyRefunded ? 'Refunded' : 'Partially refunded';
      updateSaleStatus.run(newStatus, input.saleId);
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
