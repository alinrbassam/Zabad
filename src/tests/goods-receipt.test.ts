import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { GoodsReceiptService } from '../main/services/goods-receipt.service';

describe('Goods Receipt & Stock Movement Integration Engine', () => {
  let mockDb: Record<string, unknown>;
  let grService: GoodsReceiptService;
  let products: Record<string, Record<string, unknown>>;

  beforeEach(() => {
    products = {
      'p-track-batch': {
        id: 'p-track-batch',
        name_en: 'Batch Product',
        track_batches: 1,
        track_expiry: 0,
        purchase_cost: 10,
        avg_cost: 10,
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
            get: () => ({ prefix: 'GR', current_number: 0, padding: 6, include_year: 1 }),
          };
        }
        if (sql.includes('SELECT * FROM inventory_balances')) {
          return {
            get: () => ({ quantity_on_hand: 50 }),
          };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    grService = new GoodsReceiptService(mockDb as unknown as Database.Database);
  });

  it('should enforce mandatory batch number entry when product tracks batches', () => {
    const input = {
      supplierId: 'sup-1',
      receiptDate: '2026-07-21',
      items: [
        {
          productId: 'p-track-batch',
          unitId: 'u-1',
          receivedQty: 10,
          acceptedQty: 10,
          rejectedQty: 0,
          unitCost: 12,
          discount: 0,
          taxRate: 0,
          batchNumber: '', // Missing mandatory batch
        },
      ],
    };

    expect(() => grService.confirmReceipt(input)).toThrow('Batch number is required');
  });

  it('should transition PO status from Draft to Partially received and then Fully received upon confirming goods receipts', () => {
    const purchaseOrders: Record<
      string,
      { id: string; po_number: string; supplier_id: string; status: string; updated_at: string; deleted_at: string | null }
    > = {
      'po-1': {
        id: 'po-1',
        po_number: 'PO-2026-000001',
        supplier_id: 'sup-1',
        status: 'Draft',
        updated_at: '2026-11-05T00:00:00.000Z',
        deleted_at: null,
      },
    };
    const poItems: Array<{
      id: string;
      po_id: string;
      product_id: string;
      purchasing_unit_id: string;
      ordered_qty: number;
      received_qty: number;
    }> = [
      {
        id: 'poi-1',
        po_id: 'po-1',
        product_id: 'p-1',
        purchasing_unit_id: 'unit-pcs',
        ordered_qty: 10,
        received_qty: 0,
      },
    ];
    const statusHistory: Array<{
      id: string;
      po_id: string;
      from_status: string;
      to_status: string;
      user_id: string;
      notes: string;
    }> = [];

    const poProducts: Record<string, Record<string, unknown>> = {
      'p-1': {
        id: 'p-1',
        name_en: 'Tuna',
        sku: 'SKU-001',
        base_unit_id: 'unit-pcs',
        purchase_cost: 10,
        track_batches: 0,
        deleted_at: null,
      },
    };
    const balances: Record<string, Record<string, unknown>> = {
      'p-1': {
        product_id: 'p-1',
        quantity_on_hand: 0,
        reserved_quantity: 0,
        available_quantity: 0,
        damaged_quantity: 0,
        expired_quantity: 0,
      },
    };

    const poMockDb: Record<string, unknown> = {
      prepare: (sql: string) => {
        if (sql.includes('SELECT * FROM products WHERE id')) {
          return { get: (id: string) => poProducts[id] };
        }
        if (sql.includes('SELECT supplier_id FROM purchase_orders WHERE id')) {
          return {
            get: (id: string) => {
              const po = purchaseOrders[id];
              return po && !po.deleted_at ? { supplier_id: po.supplier_id } : undefined;
            },
          };
        }
        if (sql.includes('SELECT id FROM suppliers WHERE id')) {
          return { get: (id: string) => ({ id }) };
        }
        if (sql.includes('SELECT id FROM units WHERE id')) {
          return { get: (id: string) => (id === 'unit-pcs' ? { id } : undefined) };
        }
        if (sql.includes('SELECT * FROM numbering_sequences')) {
          return {
            get: () => ({ prefix: 'GR', current_number: 1, padding: 6, include_year: 1 }),
          };
        }
        if (sql.includes('SELECT * FROM inventory_balances WHERE product_id')) {
          return { get: (id: string) => balances[id] };
        }
        if (sql.includes('UPDATE inventory_balances SET')) {
          return {
            run: (qtyAfter: number, _avail: number, _dmg: number, _exp: number, _now: string, id: string) => {
              if (balances[id]) balances[id].quantity_on_hand = qtyAfter;
            },
          };
        }
        if (sql.includes('UPDATE purchase_order_items SET received_qty')) {
          return {
            run: (qty: number, poItemId: string) => {
              const item = poItems.find((i) => i.id === poItemId);
              if (item) item.received_qty += qty;
            },
          };
        }
        if (sql.includes('SELECT id, status FROM purchase_orders WHERE id')) {
          return {
            get: (id: string) => {
              const po = purchaseOrders[id];
              return po && !po.deleted_at ? { id: po.id, status: po.status } : undefined;
            },
          };
        }
        if (sql.includes('SELECT ordered_qty, received_qty FROM purchase_order_items WHERE po_id')) {
          return {
            all: (poId: string) => poItems.filter((i) => i.po_id === poId),
          };
        }
        if (sql.includes('UPDATE purchase_orders SET status = ?, updated_at = ? WHERE id = ?')) {
          return {
            run: (status: string, updatedAt: string, id: string) => {
              if (purchaseOrders[id]) {
                purchaseOrders[id].status = status;
                purchaseOrders[id].updated_at = updatedAt;
              }
            },
          };
        }
        if (sql.includes('INSERT INTO purchase_order_status_history')) {
          return {
            run: (
              id: string,
              poId: string,
              fromStatus: string,
              toStatus: string,
              userId: string,
              notes: string,
            ) => {
              statusHistory.push({
                id,
                po_id: poId,
                from_status: fromStatus,
                to_status: toStatus,
                user_id: userId,
                notes,
              });
            },
          };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    const poGrService = new GoodsReceiptService(poMockDb as unknown as Database.Database);

    // 1. Receive partial quantity (4 of 10)
    poGrService.confirmReceipt(
      {
        poId: 'po-1',
        supplierId: 'sup-1',
        receiptDate: '2026-11-09',
        items: [
          {
            poItemId: 'poi-1',
            productId: 'p-1',
            unitId: 'unit-pcs',
            receivedQty: 4,
            acceptedQty: 4,
            rejectedQty: 0,
            unitCost: 10,
            discount: 0,
            taxRate: 0,
          },
        ],
      },
      'user-1',
    );

    expect(poItems[0].received_qty).toBe(4);
    expect(purchaseOrders['po-1'].status).toBe('Partially received');
    expect(balances['p-1'].quantity_on_hand).toBe(4);
    expect(statusHistory).toHaveLength(1);
    expect(statusHistory[0]).toMatchObject({
      from_status: 'Draft',
      to_status: 'Partially received',
    });

    // 2. Receive remaining quantity (6 of 10)
    poGrService.confirmReceipt(
      {
        poId: 'po-1',
        supplierId: 'sup-1',
        receiptDate: '2026-11-09',
        items: [
          {
            poItemId: 'poi-1',
            productId: 'p-1',
            unitId: 'unit-pcs',
            receivedQty: 6,
            acceptedQty: 6,
            rejectedQty: 0,
            unitCost: 10,
            discount: 0,
            taxRate: 0,
          },
        ],
      },
      'user-1',
    );

    expect(poItems[0].received_qty).toBe(10);
    expect(purchaseOrders['po-1'].status).toBe('Fully received');
    expect(balances['p-1'].quantity_on_hand).toBe(10);
    expect(statusHistory).toHaveLength(2);
    expect(statusHistory[1]).toMatchObject({
      from_status: 'Partially received',
      to_status: 'Fully received',
    });
  });
});
