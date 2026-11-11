import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { POSSalesService } from '../main/services/pos-sales.service';

describe('POS Sales Service & FEFO Stock Integration', () => {
  let mockDb: Record<string, unknown>;
  let salesService: POSSalesService;
  let products: Record<string, Record<string, unknown>>;

  beforeEach(() => {
    products = {
      'p-1': {
        id: 'p-1',
        name_en: 'Standard Retail Product',
        sku: 'SKU-001',
        track_batches: 0,
        purchase_cost: 5,
        avg_cost: 5,
        selling_price: 10,
        tax_rate: 10,
        is_tax_exempt: 0,
      },
    };

    mockDb = {
      prepare: (sql: string) => {
        if (sql.includes('SELECT * FROM products WHERE id')) {
          return {
            get: (id: string) => products[id],
          };
        }
        if (sql.includes('SELECT * FROM numbering_sequences')) {
          return {
            get: () => ({ prefix: 'INV', current_number: 0, padding: 6, include_year: 1 }),
          };
        }
        if (sql.includes('SELECT * FROM inventory_balances')) {
          return {
            get: () => ({ quantity_on_hand: 100 }),
          };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    salesService = new POSSalesService(mockDb as unknown as Database.Database);
  });

  it('should calculate grand total and change amount correctly', () => {
    const input = {
      orderDiscount: 0,
      amountTendered: 50,
      items: [
        {
          productId: 'p-1',
          unitId: 'u-1',
          quantity: 2,
          unitPrice: 10,
          discount: 0,
          taxRate: 10,
        },
      ],
      payments: [{ paymentMethod: 'Cash' as const, amount: 22 }],
    };

    const totals = salesService.calculateSaleTotals(input);
    expect(totals.subtotal).toBe(20);
    expect(totals.taxTotal).toBe(2);
    expect(totals.grandTotal).toBe(22);
    expect(totals.changeAmount).toBe(28);
  });

  it('should complete checkout and return completed sales order entity', () => {
    const input = {
      orderDiscount: 0,
      amountTendered: 50,
      items: [
        {
          productId: 'p-1',
          unitId: 'u-1',
          quantity: 2,
          unitPrice: 10,
          discount: 0,
          taxRate: 10,
        },
      ],
      payments: [{ paymentMethod: 'Cash' as const, amount: 22 }],
    };

    const res = salesService.processCheckout(input, 'cashier-1');
    expect(res.payment_status).toBe('Paid');
    expect(res.invoice_number).toContain('INV-');
  });

  it('should soft-delete an individual sale receipt and exclude it from history, lookups, and debts', () => {
    const salesRows: Record<
      string,
      {
        id: string;
        invoice_number: string;
        customer_name: string;
        grand_total: number;
        paid_amount: number;
        payment_status: string;
        payment_method: string;
        created_at: string;
        updated_at: string | null;
        deleted_at: string | null;
      }
    > = {
      'sale-1': {
        id: 'sale-1',
        invoice_number: 'INV-2026-000044',
        customer_name: 'Walk-in',
        grand_total: 5000,
        paid_amount: 5000,
        payment_status: 'Paid',
        payment_method: 'Cash',
        created_at: '2026-11-05T10:00:00.000Z',
        updated_at: null,
        deleted_at: null,
      },
      'sale-2': {
        id: 'sale-2',
        invoice_number: 'INV-2026-000045',
        customer_name: 'Ali Bassam',
        grand_total: 12000,
        paid_amount: 0,
        payment_status: 'Unpaid',
        payment_method: 'Borrow',
        created_at: '2026-11-05T21:23:00.000Z',
        updated_at: null,
        deleted_at: null,
      },
    };
    const auditLogs: Array<{ action: string }> = [];

    const saleDb: Record<string, unknown> = {
      prepare: (sql: string) => {
        if (sql.includes('SELECT * FROM sales_orders WHERE id = ?')) {
          return {
            get: (id: string) => {
              const row = salesRows[id];
              return row && !row.deleted_at ? row : undefined;
            },
          };
        }
        if (sql.includes('FROM sales_order_items soi')) {
          return { all: () => [] };
        }
        if (
          sql.includes('SELECT * FROM sales_orders') &&
          sql.includes("payment_status IN ('Unpaid', 'Partially paid')")
        ) {
          return {
            all: () =>
              Object.values(salesRows).filter(
                (r) => !r.deleted_at && (r.payment_status === 'Unpaid' || r.payment_method === 'Borrow'),
              ),
          };
        }
        if (sql.includes('SELECT * FROM sales_orders') && sql.includes('ORDER BY created_at DESC LIMIT 100')) {
          return {
            all: () => Object.values(salesRows).filter((r) => !r.deleted_at),
          };
        }
        if (sql.includes('UPDATE sales_orders SET deleted_at = ?, updated_at = ? WHERE id = ?')) {
          return {
            run: (deletedAt: string, updatedAt: string, id: string) => {
              if (salesRows[id]) {
                salesRows[id].deleted_at = deletedAt;
                salesRows[id].updated_at = updatedAt;
              }
            },
          };
        }
        if (sql.includes('INSERT INTO audit_logs')) {
          return {
            run: (_id: string, _uid: string | null, _username: string | null, action: string) => {
              auditLogs.push({ action });
            },
          };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    const svc = new POSSalesService(saleDb as unknown as Database.Database);
    expect(svc.getSalesHistory()).toHaveLength(2);
    expect(svc.getDebts()).toHaveLength(1);

    svc.deleteSale('sale-2', 'admin-1');

    expect(salesRows['sale-2'].deleted_at).toBeTruthy();
    expect(svc.getSaleById('sale-2')).toBeUndefined();
    expect(svc.getSalesHistory().map((s) => s.id)).toEqual(['sale-1']);
    expect(svc.getDebts()).toHaveLength(0);
    expect(auditLogs.map((l) => l.action)).toContain('SALE_DELETED');
    expect(() => svc.deleteSale('sale-2')).toThrow('Sale not found');
  });

  it('should soft-delete all sales on resetSalesHistory and return cleared count', () => {
    const salesRows: Record<
      string,
      {
        id: string;
        invoice_number: string;
        grand_total: number;
        payment_status: string;
        payment_method: string;
        created_at: string;
        updated_at: string | null;
        deleted_at: string | null;
      }
    > = {
      'sale-a': {
        id: 'sale-a',
        invoice_number: 'INV-2026-000027',
        grand_total: 400000,
        payment_status: 'Paid',
        payment_method: 'Cash',
        created_at: '2026-10-15T12:16:00.000Z',
        updated_at: null,
        deleted_at: null,
      },
      'sale-b': {
        id: 'sale-b',
        invoice_number: 'INV-2026-000045',
        grand_total: 4636359,
        payment_status: 'Paid',
        payment_method: 'Cash',
        created_at: '2026-11-05T21:23:00.000Z',
        updated_at: null,
        deleted_at: null,
      },
    };
    const auditLogs: Array<{ action: string }> = [];

    const resetDb: Record<string, unknown> = {
      prepare: (sql: string) => {
        if (sql.includes('SELECT COUNT(id) as cnt FROM sales_orders')) {
          return {
            get: () => ({
              cnt: Object.values(salesRows).filter((r) => !r.deleted_at).length,
            }),
          };
        }
        if (
          sql.includes('UPDATE sales_orders SET deleted_at = ?, updated_at = ?') &&
          sql.includes("(deleted_at IS NULL OR deleted_at = '')")
        ) {
          return {
            run: (deletedAt: string, updatedAt: string) => {
              for (const row of Object.values(salesRows)) {
                if (!row.deleted_at) {
                  row.deleted_at = deletedAt;
                  row.updated_at = updatedAt;
                }
              }
            },
          };
        }
        if (sql.includes('SELECT * FROM sales_orders') && sql.includes('ORDER BY created_at DESC LIMIT 100')) {
          return {
            all: () => Object.values(salesRows).filter((r) => !r.deleted_at),
          };
        }
        if (sql.includes('INSERT INTO audit_logs')) {
          return {
            run: (_id: string, _uid: string | null, _username: string | null, action: string) => {
              auditLogs.push({ action });
            },
          };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    const svc = new POSSalesService(resetDb as unknown as Database.Database);
    const res = svc.resetSalesHistory('admin-1');

    expect(res.clearedCount).toBe(2);
    expect(salesRows['sale-a'].deleted_at).toBeTruthy();
    expect(salesRows['sale-b'].deleted_at).toBeTruthy();
    expect(svc.getSalesHistory()).toHaveLength(0);
    expect(auditLogs.map((l) => l.action)).toContain('SALES_HISTORY_RESET');

    // Second reset should safely report 0 cleared
    const res2 = svc.resetSalesHistory('admin-1');
    expect(res2.clearedCount).toBe(0);
  });

  it('should self-heal missing selling_mode column on sales_order_items during processCheckout', () => {
    const productCols = new Set(['id', 'sku', 'piece_weight', 'pieces_per_pack']);
    const salesOrderCols = new Set([
      'id',
      'invoice_number',
      'customer_name',
      'customer_phone',
      'due_date',
      'notes',
      'deleted_at',
      'updated_at',
    ]);
    const salesItemCols = new Set(['id', 'sale_id', 'product_id']);
    const insertedSales: Record<string, Record<string, unknown>> = {};

    const repairDb = {
      exec: vi.fn((sql: string) => {
        if (sql.includes('ALTER TABLE sales_order_items ADD COLUMN selling_mode')) {
          salesItemCols.add('selling_mode');
        }
        if (sql.includes('ALTER TABLE sales_order_items ADD COLUMN piece_weight')) {
          salesItemCols.add('piece_weight');
        }
        if (sql.includes('ALTER TABLE sales_order_items ADD COLUMN pieces_per_pack')) {
          salesItemCols.add('pieces_per_pack');
        }
        if (sql.includes('ALTER TABLE sales_order_items ADD COLUMN unit_weight')) {
          salesItemCols.add('unit_weight');
        }
        if (sql.includes('ALTER TABLE sales_order_items ADD COLUMN total_weight')) {
          salesItemCols.add('total_weight');
        }
      }),
      prepare: (sql: string) => {
        if (sql.includes('PRAGMA table_info(products)')) {
          return { all: () => Array.from(productCols).map((name) => ({ name })) };
        }
        if (sql.includes('PRAGMA table_info(sales_orders)')) {
          return { all: () => Array.from(salesOrderCols).map((name) => ({ name })) };
        }
        if (sql.includes('PRAGMA table_info(sales_order_items)')) {
          return { all: () => Array.from(salesItemCols).map((name) => ({ name })) };
        }
        if (sql.includes('INSERT INTO sales_order_items') && !salesItemCols.has('selling_mode')) {
          throw new Error('table sales_order_items has no column named selling_mode');
        }
        if (sql.includes('INSERT INTO sales_orders')) {
          return {
            run: (id: string, invoiceNumber: string) => {
              insertedSales[id] = { id, invoice_number: invoiceNumber, payment_status: 'Paid' };
            },
          };
        }
        if (sql.includes('SELECT * FROM sales_orders WHERE id = ?')) {
          return { get: (id: string) => insertedSales[id] };
        }
        if (sql.includes('SELECT * FROM numbering_sequences')) {
          return { get: () => ({ prefix: 'INV', current_number: 10, padding: 6, include_year: 1 }) };
        }
        if (sql.includes('SELECT * FROM inventory_balances')) {
          return { get: () => ({ quantity_on_hand: 50 }) };
        }
        if (sql.includes('SELECT * FROM products WHERE id')) {
          return { get: (id: string) => products[id] };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    const svc = new POSSalesService(repairDb as unknown as Database.Database);
    const completed = svc.processCheckout(
      {
        orderDiscount: 0,
        amountTendered: 3000,
        items: [
          {
            productId: 'p-1',
            unitId: 'u-1',
            quantity: 1,
            unitPrice: 3000,
            discount: 0,
            taxRate: 0,
          },
        ],
        payments: [{ paymentMethod: 'Cash', amount: 3000 }],
      },
      'cashier-1',
    );

    expect(completed.payment_status).toBe('Paid');
    expect(salesItemCols.has('selling_mode')).toBe(true);
    expect(salesItemCols.has('piece_weight')).toBe(true);
    expect(salesItemCols.has('unit_weight')).toBe(true);
    expect(salesItemCols.has('total_weight')).toBe(true);
  });
});
