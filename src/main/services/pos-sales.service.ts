import Database from 'better-sqlite3';
import { POSCheckoutInput } from '../../shared/validation';
import { SalesOrderEntity, SalesOrderItemEntity } from '../../shared/types';
import { InventoryService } from './inventory.service';
import { PurchaseNumberingService } from './purchase-numbering.service';
import { ProductRepository } from '../database/repositories/product.repository';
import { AuditRepository } from '../database/repositories/audit.repository';
import { logger } from './logger.service';

export class POSSalesService {
  private db: Database.Database;
  private inventoryService: InventoryService;
  private numberingService: PurchaseNumberingService;
  private productRepo: ProductRepository;
  private auditRepo: AuditRepository;

  constructor(db: Database.Database) {
    this.db = db;
    this.inventoryService = new InventoryService(db);
    this.numberingService = new PurchaseNumberingService(db);
    this.productRepo = new ProductRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  public calculateSaleTotals(input: POSCheckoutInput) {
    let subtotal = 0;
    let itemDiscountTotal = 0;
    let taxTotal = 0;

    const items = input.items.map((item) => {
      const lineSub = Math.round(item.quantity * item.unitPrice * 100) / 100;
      const lineDisc = Math.round(item.discount * 100) / 100;
      const taxable = Math.max(0, lineSub - lineDisc);
      const tax = Math.round(taxable * (item.taxRate / 100) * 100) / 100;
      const lineTotal = Math.round((taxable + tax) * 100) / 100;

      subtotal += lineSub;
      itemDiscountTotal += lineDisc;
      taxTotal += tax;

      return {
        ...item,
        taxAmount: tax,
        lineTotal,
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;
    itemDiscountTotal = Math.round(itemDiscountTotal * 100) / 100;
    const orderDiscount = Math.round(input.orderDiscount * 100) / 100;
    taxTotal = Math.round(taxTotal * 100) / 100;
    const grandTotal =
      Math.round((subtotal - itemDiscountTotal - orderDiscount + taxTotal) * 100) / 100;

    const paidAmount = input.payments.reduce((sum, p) => sum + p.amount, 0);
    const changeAmount = Math.max(0, Math.round((input.amountTendered - grandTotal) * 100) / 100);

    return {
      subtotal,
      itemDiscountTotal,
      orderDiscount,
      taxTotal,
      grandTotal,
      paidAmount,
      changeAmount,
      items,
    };
  }

  public processCheckout(input: POSCheckoutInput, cashierId?: string): SalesOrderEntity {
    const saleId = crypto.randomUUID();
    const invoiceNumber = this.numberingService.generateNextNumber('inv');
    const totals = this.calculateSaleTotals(input);
    const now = new Date().toISOString();

    const insertSale = this.db.prepare(`
      INSERT INTO sales_orders (
        id, invoice_number, customer_id, subtotal, item_discount, order_discount,
        tax_total, grand_total, paid_amount, change_amount, payment_status,
        payment_method, shift_id, cashier_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', ?, ?, ?, ?)
    `);

    const insertItem = this.db.prepare(`
      INSERT INTO sales_order_items (
        id, sale_id, product_id, batch_id, unit_id, quantity, unit_price,
        cost_price, discount, tax_rate, tax_amount, line_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPayment = this.db.prepare(`
      INSERT INTO sales_payments (id, sale_id, payment_method, amount, reference_number, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const paymentMethodName =
      input.payments.length === 1 ? input.payments[0].paymentMethod : 'Split';

    this.db.transaction(() => {
      insertSale.run(
        saleId,
        invoiceNumber,
        input.customerId || null,
        totals.subtotal,
        totals.itemDiscountTotal,
        totals.orderDiscount,
        totals.taxTotal,
        totals.grandTotal,
        totals.paidAmount,
        totals.changeAmount,
        paymentMethodName,
        input.shiftId || null,
        cashierId || 'cashier',
        now,
      );

      for (const p of input.payments) {
        insertPayment.run(
          crypto.randomUUID(),
          saleId,
          p.paymentMethod,
          p.amount,
          p.referenceNumber || null,
          p.notes || null,
          now,
        );
      }

      for (const item of totals.items) {
        const product = this.productRepo.findById(item.productId);
        const costPrice = product ? product.avg_cost || product.purchase_cost || 0 : 0;

        let selectedBatchId = item.batchId;
        if (product && product.track_batches === 1 && !selectedBatchId) {
          const batchStmt = this.db.prepare(
            'SELECT id FROM batches WHERE product_id = ? AND remaining_qty > 0 ORDER BY expiry_date ASC LIMIT 1',
          );
          const b = batchStmt.get(item.productId) as { id: string } | undefined;
          if (b) selectedBatchId = b.id;
        }

        insertItem.run(
          crypto.randomUUID(),
          saleId,
          item.productId,
          selectedBatchId || null,
          item.unitId,
          item.quantity,
          item.unitPrice,
          costPrice,
          item.discount,
          item.taxRate,
          item.taxAmount,
          item.lineTotal,
        );

        this.inventoryService.createAdjustment(
          {
            productId: item.productId,
            batchId: selectedBatchId,
            movementType: 'Customer sale',
            quantityChange: -Math.abs(item.quantity),
            unitCost: costPrice,
            reason: `POS Sale Receipt #${invoiceNumber}`,
          },
          cashierId,
        );
      }
    })();

    this.auditRepo.logAction({
      user_id: cashierId,
      action: 'SALE_COMPLETED',
      module: 'POS',
      details: `Completed Sale #${invoiceNumber} total $${totals.grandTotal} via ${paymentMethodName}`,
    });

    logger.info('POSSalesService', `Completed Sale #${invoiceNumber}`);

    return {
      id: saleId,
      invoice_number: invoiceNumber,
      customer_id: input.customerId,
      subtotal: totals.subtotal,
      item_discount: totals.itemDiscountTotal,
      order_discount: totals.orderDiscount,
      tax_total: totals.taxTotal,
      grand_total: totals.grandTotal,
      paid_amount: totals.paidAmount,
      change_amount: totals.changeAmount,
      payment_status: 'Paid',
      payment_method: paymentMethodName as 'Cash' | 'Card' | 'Split' | 'Other',
      shift_id: input.shiftId,
      cashier_id: cashierId,
      created_at: now,
    };
  }

  public getSalesHistory(query = ''): SalesOrderEntity[] {
    let sql = 'SELECT * FROM sales_orders WHERE 1=1';
    const params: string[] = [];

    if (query) {
      sql += ' AND invoice_number LIKE ?';
      params.push(`%${query}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT 100';
    return this.db.prepare(sql).all(...params) as SalesOrderEntity[];
  }

  public getSaleById(
    id: string,
  ): (SalesOrderEntity & { items: SalesOrderItemEntity[] }) | undefined {
    const sale = this.db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(id) as
      SalesOrderEntity | undefined;
    if (!sale) return undefined;

    const items = this.db
      .prepare('SELECT * FROM sales_order_items WHERE sale_id = ?')
      .all(id) as SalesOrderItemEntity[];
    return { ...sale, items };
  }
}
