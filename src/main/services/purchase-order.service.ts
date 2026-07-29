import Database from 'better-sqlite3';
import { PurchaseOrderEntity, PurchaseOrderItemEntity, POStatus } from '../../shared/types';
import { PurchaseOrderInput } from '../../shared/validation';
import { PurchaseNumberingService } from './purchase-numbering.service';
import { AuditRepository } from '../database/repositories/audit.repository';
import { logger } from './logger.service';

export class PurchaseOrderService {
  private db: Database.Database;
  private numberingService: PurchaseNumberingService;
  private auditRepo: AuditRepository;

  constructor(db: Database.Database) {
    this.db = db;
    this.numberingService = new PurchaseNumberingService(db);
    this.auditRepo = new AuditRepository(db);
  }

  public calculateTotals(input: PurchaseOrderInput) {
    let subtotal = 0;
    let itemDiscountTotal = 0;
    let taxSubtotal = 0;

    const items = input.items.map((item) => {
      const lineSubtotal = Math.round(item.orderedQty * item.unitCost * 100) / 100;
      const lineDiscount = Math.round(item.discount * 100) / 100;
      const taxableAmount = Math.max(0, lineSubtotal - lineDiscount);
      const taxAmount = Math.round(taxableAmount * (item.taxRate / 100) * 100) / 100;
      const lineTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

      subtotal += lineSubtotal;
      itemDiscountTotal += lineDiscount;
      taxSubtotal += taxAmount;

      return {
        ...item,
        taxAmount,
        lineSubtotal,
        lineTotal,
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;
    itemDiscountTotal = Math.round(itemDiscountTotal * 100) / 100;
    const orderDiscount = Math.round(input.orderDiscount * 100) / 100;
    taxSubtotal = Math.round(taxSubtotal * 100) / 100;
    const shipping = Math.round(input.shippingCost * 100) / 100;
    const additional = Math.round(input.additionalCharges * 100) / 100;

    const grandTotal =
      Math.round(
        (subtotal - itemDiscountTotal - orderDiscount + taxSubtotal + shipping + additional) * 100,
      ) / 100;

    return {
      subtotal,
      itemDiscountTotal,
      orderDiscount,
      taxSubtotal,
      shipping,
      additional,
      grandTotal,
      items,
    };
  }

  public createPurchaseOrder(input: PurchaseOrderInput, userId?: string): PurchaseOrderEntity {
    const totals = this.calculateTotals(input);
    const poId = crypto.randomUUID();
    const poNumber = this.numberingService.generateNextNumber('po');
    const now = new Date().toISOString();

    const insertPo = this.db.prepare(`
      INSERT INTO purchase_orders (
        id, po_number, supplier_id, order_date, expected_delivery_date, currency,
        tax_mode, discount_mode, subtotal, item_discount, order_discount,
        tax_subtotal, shipping_cost, additional_charges, grand_total,
        status, approval_status, notes, internal_notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = this.db.prepare(`
      INSERT INTO purchase_order_items (
        id, po_id, product_id, description, purchasing_unit_id, conversion_ratio,
        ordered_qty, received_qty, unit_cost, discount, tax_rate, tax_amount,
        line_subtotal, line_total, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertHistory = this.db.prepare(`
      INSERT INTO purchase_order_status_history (id, po_id, from_status, to_status, user_id, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    this.db.transaction(() => {
      insertPo.run(
        poId,
        poNumber,
        input.supplierId,
        input.orderDate,
        input.expectedDeliveryDate || null,
        input.currency,
        input.taxMode,
        input.discountMode,
        totals.subtotal,
        totals.itemDiscountTotal,
        totals.orderDiscount,
        totals.taxSubtotal,
        totals.shipping,
        totals.additional,
        totals.grandTotal,
        'Draft',
        'Approved',
        input.notes || null,
        input.internalNotes || null,
        userId || 'system',
        now,
        now,
      );

      for (const item of totals.items) {
        insertItem.run(
          crypto.randomUUID(),
          poId,
          item.productId,
          item.description || null,
          item.purchasingUnitId,
          item.conversionRatio,
          item.orderedQty,
          item.unitCost,
          item.discount,
          item.taxRate,
          item.taxAmount,
          item.lineSubtotal,
          item.lineTotal,
          item.notes || null,
        );
      }

      insertHistory.run(
        crypto.randomUUID(),
        poId,
        'None',
        'Draft',
        userId || 'system',
        'Purchase order created',
      );
    })();

    this.auditRepo.logAction({
      user_id: userId,
      action: 'PURCHASE_ORDER_CREATED',
      module: 'Purchasing',
      details: `Created Purchase Order #${poNumber} for supplier ${input.supplierId} with total $${totals.grandTotal}`,
    });

    logger.info('PurchaseOrderService', `Created PO #${poNumber}`);

    return this.getPurchaseOrderById(poId)!;
  }

  public getPurchaseOrderById(
    id: string,
  ): (PurchaseOrderEntity & { items: PurchaseOrderItemEntity[] }) | undefined {
    const poStmt = this.db.prepare('SELECT * FROM purchase_orders WHERE id = ?');
    const po = poStmt.get(id) as PurchaseOrderEntity | undefined;
    if (!po) return undefined;

    const itemsStmt = this.db.prepare('SELECT * FROM purchase_order_items WHERE po_id = ?');
    const items = itemsStmt.all(id) as PurchaseOrderItemEntity[];

    return { ...po, items };
  }

  public searchPurchaseOrders(query = '', status?: string): PurchaseOrderEntity[] {
    let sql =
      'SELECT po.*, s.name as supplier_name FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE 1=1';
    const params: (string | number)[] = [];

    if (query) {
      sql += ' AND (po.po_number LIKE ? OR s.name LIKE ?)';
      params.push(`%${query}%`, `%${query}%`);
    }
    if (status) {
      sql += ' AND po.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY po.created_at DESC';
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as PurchaseOrderEntity[];
  }

  public updateStatus(id: string, toStatus: POStatus, userId?: string, notes?: string): void {
    const po = this.getPurchaseOrderById(id);
    if (!po) throw new Error('Purchase order not found');

    const fromStatus = po.status;
    const now = new Date().toISOString();

    const updateStmt = this.db.prepare(`
      UPDATE purchase_orders
      SET status = ?, updated_at = ?
      WHERE id = ?
    `);

    const historyStmt = this.db.prepare(`
      INSERT INTO purchase_order_status_history (id, po_id, from_status, to_status, user_id, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    this.db.transaction(() => {
      updateStmt.run(toStatus, now, id);
      historyStmt.run(
        crypto.randomUUID(),
        id,
        fromStatus,
        toStatus,
        userId || 'system',
        notes || null,
      );
    })();

    this.auditRepo.logAction({
      user_id: userId,
      action: 'PURCHASE_ORDER_STATUS_CHANGED',
      module: 'Purchasing',
      details: `PO #${po.po_number} status changed from ${fromStatus} to ${toStatus}`,
    });
  }
}
