import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { PurchaseOrderService } from '../main/services/purchase-order.service';
import { reconcilePurchaseOrderStatuses } from '../main/database/migrations/v12_purchase_order_soft_delete';

describe('Purchase Order Service & Calculations', () => {
  let mockDb: Record<string, unknown>;
  let service: PurchaseOrderService;

  beforeEach(() => {
    mockDb = {
      prepare: (sql: string) => {
        if (sql.includes('SELECT * FROM numbering_sequences')) {
          return {
            get: () => ({ prefix: 'PO', current_number: 0, padding: 6, include_year: 1 }),
          };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    service = new PurchaseOrderService(mockDb as unknown as Database.Database);
  });

  it('should calculate item subtotals, tax amounts, and grand total accurately', () => {
    const input = {
      supplierId: 'sup-1',
      orderDate: '2026-07-21',
      currency: 'USD',
      taxMode: 'exclusive' as const,
      discountMode: 'amount' as const,
      orderDiscount: 5.0,
      shippingCost: 10.0,
      additionalCharges: 2.0,
      items: [
        {
          productId: 'prod-1',
          purchasingUnitId: 'u-1',
          conversionRatio: 1,
          orderedQty: 10,
          unitCost: 15.0, // 150
          discount: 0,
          taxRate: 10, // 15 tax
        },
        {
          productId: 'prod-2',
          purchasingUnitId: 'u-1',
          conversionRatio: 1,
          orderedQty: 5,
          unitCost: 20.0, // 100
          discount: 10.0, // 90 taxable -> 9 tax
          taxRate: 10,
        },
      ],
    };

    const totals = service.calculateTotals(input);
    expect(totals.subtotal).toBe(250);
    expect(totals.itemDiscountTotal).toBe(10);
    expect(totals.taxSubtotal).toBe(24); // 15 + 9
    // grandTotal = 250 - 10 (item disc) - 5 (order disc) + 24 (tax) + 10 (shipping) + 2 (charges) = 271
    expect(totals.grandTotal).toBe(271);
  });

  it('should soft-delete a purchase order and exclude it from lookups', () => {
    const orders: Record<
      string,
      {
        id: string;
        po_number: string;
        supplier_id: string;
        supplier_name: string;
        status: string;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
      }
    > = {
      'po-1': {
        id: 'po-1',
        po_number: 'PO-2026-000001',
        supplier_id: 'sup-1',
        supplier_name: 'Supplier One',
        status: 'Draft',
        created_at: '2026-11-05T10:00:00.000Z',
        updated_at: '2026-11-05T10:00:00.000Z',
        deleted_at: null,
      },
      'po-2': {
        id: 'po-2',
        po_number: 'PO-2026-000002',
        supplier_id: 'sup-2',
        supplier_name: 'Supplier Two',
        status: 'Draft',
        created_at: '2026-11-09T10:00:00.000Z',
        updated_at: '2026-11-09T10:00:00.000Z',
        deleted_at: null,
      },
    };
    const auditLogs: Array<{ action: string }> = [];

    const poMockDb: Record<string, unknown> = {
      prepare: (sql: string) => {
        if (sql.includes('FROM purchase_orders po') && sql.includes('WHERE po.id = ?')) {
          return {
            get: (id: string) => {
              const row = orders[id];
              return row && !row.deleted_at ? row : undefined;
            },
          };
        }
        if (sql.includes('FROM purchase_order_items poi')) {
          return { all: () => [] };
        }
        if (sql.includes('FROM purchase_orders po') && sql.includes('ORDER BY po.created_at DESC')) {
          return {
            all: () => Object.values(orders).filter((o) => !o.deleted_at),
          };
        }
        if (sql.includes('UPDATE purchase_orders SET deleted_at = ?, updated_at = ? WHERE id = ?')) {
          return {
            run: (deletedAt: string, updatedAt: string, id: string) => {
              if (orders[id]) {
                orders[id].deleted_at = deletedAt;
                orders[id].updated_at = updatedAt;
              }
            },
          };
        }
        if (sql.includes('INSERT INTO audit_logs')) {
          return {
            run: (_id: string, _uid: string | null, action: string) => {
              auditLogs.push({ action });
            },
          };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    const poService = new PurchaseOrderService(poMockDb as unknown as Database.Database);
    expect(poService.searchPurchaseOrders()).toHaveLength(2);

    poService.deletePurchaseOrder('po-2', 'admin-1');

    expect(orders['po-2'].deleted_at).toBeTruthy();
    expect(poService.getPurchaseOrderById('po-2')).toBeUndefined();
    expect(poService.searchPurchaseOrders().map((o) => o.id)).toEqual(['po-1']);
    expect(() => poService.deletePurchaseOrder('po-2')).toThrow('Purchase order not found');
  });

  it('should reconcile legacy Draft purchase orders that already have received quantities', () => {
    const orders: Record<string, { id: string; status: string; deleted_at: string | null }> = {
      'po-full': { id: 'po-full', status: 'Draft', deleted_at: null },
      'po-partial': { id: 'po-partial', status: 'Draft', deleted_at: null },
      'po-untouched': { id: 'po-untouched', status: 'Draft', deleted_at: null },
    };
    const itemsByPo: Record<string, Array<{ ordered_qty: number; received_qty: number }>> = {
      'po-full': [{ ordered_qty: 5, received_qty: 5 }],
      'po-partial': [{ ordered_qty: 10, received_qty: 3 }],
      'po-untouched': [{ ordered_qty: 10, received_qty: 0 }],
    };

    const reconcileDb: Record<string, unknown> = {
      prepare: (sql: string) => {
        if (sql.includes("SELECT id, status FROM purchase_orders")) {
          return {
            all: () => Object.values(orders),
          };
        }
        if (sql.includes('SELECT ordered_qty, received_qty FROM purchase_order_items WHERE po_id')) {
          return {
            all: (poId: string) => itemsByPo[poId] || [],
          };
        }
        if (sql.includes('UPDATE purchase_orders SET status = ?, updated_at = ? WHERE id = ?')) {
          return {
            run: (status: string, _now: string, id: string) => {
              if (orders[id]) orders[id].status = status;
            },
          };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    reconcilePurchaseOrderStatuses(reconcileDb as unknown as Database.Database);

    expect(orders['po-full'].status).toBe('Fully received');
    expect(orders['po-partial'].status).toBe('Partially received');
    expect(orders['po-untouched'].status).toBe('Draft');
  });
});
