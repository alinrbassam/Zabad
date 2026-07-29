import Database from 'better-sqlite3';
import { GoodsReceivingInput } from '../../shared/validation';
import { GoodsReceiptEntity } from '../../shared/types';
import { InventoryService } from './inventory.service';
import { BatchService } from './batch.service';
import { PurchaseNumberingService } from './purchase-numbering.service';
import { AuditRepository } from '../database/repositories/audit.repository';
import { logger } from './logger.service';

export class GoodsReceiptService {
  private db: Database.Database;
  private inventoryService: InventoryService;
  private batchService: BatchService;
  private numberingService: PurchaseNumberingService;
  private auditRepo: AuditRepository;

  constructor(db: Database.Database) {
    this.db = db;
    this.inventoryService = new InventoryService(db);
    this.batchService = new BatchService(db);
    this.numberingService = new PurchaseNumberingService(db);
    this.auditRepo = new AuditRepository(db);
  }

  public confirmReceipt(input: GoodsReceivingInput, userId?: string): GoodsReceiptEntity {
    const grId = crypto.randomUUID();
    const grNumber = this.numberingService.generateNextNumber('gr');
    const now = new Date().toISOString();

    const insertGr = this.db.prepare(`
      INSERT INTO goods_receipts (
        id, receipt_number, po_id, supplier_id, receipt_date, delivery_note_number, status, notes, received_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', ?, ?, ?)
    `);

    const insertItem = this.db.prepare(`
      INSERT INTO goods_receipt_items (
        id, receipt_id, po_item_id, product_id, unit_id, received_qty, accepted_qty, rejected_qty, unit_cost, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.db.transaction(() => {
      insertGr.run(
        grId,
        grNumber,
        input.poId || null,
        input.supplierId,
        input.receiptDate,
        input.deliveryNoteNumber || null,
        input.notes || null,
        userId || 'system',
        now,
      );

      for (const item of input.items) {
        let createdBatchId: string | undefined = undefined;

        if (item.batchNumber && item.expiryDate) {
          const batch = this.batchService.getOrCreateBatch({
            productId: item.productId,
            batchNumber: item.batchNumber,
            mfgDate: item.mfgDate,
            expiryDate: item.expiryDate,
            receivedQty: item.acceptedQty,
            unitCost: item.unitCost,
            supplierId: input.supplierId,
          });
          createdBatchId = batch.id;
        }

        insertItem.run(
          crypto.randomUUID(),
          grId,
          item.poItemId || null,
          item.productId,
          item.unitId,
          item.receivedQty,
          item.acceptedQty,
          item.rejectedQty,
          item.unitCost,
          item.notes || null,
        );

        if (item.acceptedQty > 0) {
          this.inventoryService.createAdjustment(
            {
              productId: item.productId,
              batchId: createdBatchId,
              movementType: 'Future purchase receipt',
              quantityChange: item.acceptedQty,
              unitCost: item.unitCost,
              reason: `Goods receipt #${grNumber} receiving`,
            },
            userId,
          );
        }

        if (item.poItemId) {
          this.db
            .prepare(
              'UPDATE purchase_order_items SET received_qty = received_qty + ? WHERE id = ?',
            )
            .run(item.acceptedQty, item.poItemId);
        }
      }
    })();

    this.auditRepo.logAction({
      user_id: userId,
      action: 'GOODS_RECEIPT_CREATED',
      module: 'Purchasing',
      details: `Received Goods Receipt #${grNumber} for supplier ${input.supplierId}`,
    });

    logger.info('GoodsReceiptService', `Confirmed Goods Receipt #${grNumber}`);

    return {
      id: grId,
      receipt_number: grNumber,
      po_id: input.poId,
      supplier_id: input.supplierId,
      receipt_date: input.receiptDate,
      delivery_note_number: input.deliveryNoteNumber,
      status: 'Confirmed',
      notes: input.notes,
      received_by: userId,
      created_at: now,
    };
  }
}
