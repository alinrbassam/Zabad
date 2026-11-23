import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { POSRefundService } from '../main/services/pos-refund.service';

describe('POS Refund Service', () => {
  let mockDb: Record<string, unknown>;
  let refundService: POSRefundService;

  beforeEach(() => {
    mockDb = {
      prepare: (sql: string) => {
        if (sql.includes('SELECT * FROM products WHERE id')) {
          return {
            get: () => ({
              id: 'p-1',
              name_en: 'Test Product',
              base_unit_id: 'u-1',
              purchase_cost: 5,
            }),
          };
        }
        if (sql.includes('SELECT * FROM sales_orders')) {
          return {
            get: () => ({ id: 'sale-1', invoice_number: 'INV-2026-000001' }),
          };
        }
        if (sql.includes('SELECT * FROM numbering_sequences')) {
          return {
            get: () => ({ prefix: 'PR', current_number: 0, padding: 6, include_year: 1 }),
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

    refundService = new POSRefundService(mockDb as unknown as Database.Database);
  });

  it('should process sales refund and generate refund record', () => {
    const input = {
      saleId: 'sale-1',
      reason: 'Damaged item return',
      refundMethod: 'Cash' as const,
      items: [
        {
          saleItemId: 'item-1',
          productId: 'p-1',
          returnedQty: 1,
          refundAmount: 10,
        },
      ],
    };

    const res = refundService.processRefund(input, 'user-1');
    expect(res.refund_amount).toBe(10);
    expect(res.refund_number).toContain('PR-');
  });

  it('should mark order as "Partially refunded" when only 1 out of 5 items is returned', () => {
    let updatedPaymentStatus = '';
    let adjustedQty = 0;

    const testDb: Record<string, unknown> = {
      prepare: (sql: string) => {
        if (sql.includes('SELECT * FROM products WHERE id')) {
          return {
            get: () => ({ id: 'p-fish', name_en: 'Sea Fish', base_unit_id: 'u-1', purchase_cost: 1000 }),
          };
        }
        if (sql.includes('SELECT * FROM sales_orders WHERE id')) {
          return {
            get: () => ({
              id: 'sale-100',
              invoice_number: 'INV-2026-000100',
              grand_total: 10000,
              payment_status: 'Paid',
            }),
          };
        }
        if (sql.includes('SELECT soi.*') || sql.includes('SELECT * FROM sales_order_items')) {
          return {
            all: () => [
              {
                id: 'soi-1',
                sale_id: 'sale-100',
                product_id: 'p-fish',
                quantity: 5,
                unit_price: 2000,
                line_total: 10000,
                previously_refunded_qty: 0,
              },
            ],
          };
        }
        if (sql.includes('UPDATE sales_orders SET payment_status')) {
          return {
            run: (status: string) => {
              updatedPaymentStatus = status;
            },
          };
        }
        if (sql.includes('INSERT INTO stock_movements')) {
          return {
            run: (...args: unknown[]) => {
              adjustedQty = Number(args[4] || 0);
            },
          };
        }
        if (sql.includes('SELECT * FROM numbering_sequences')) {
          return {
            get: () => ({ prefix: 'PR', current_number: 1, padding: 6, include_year: 1 }),
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

    const svc = new POSRefundService(testDb as unknown as Database.Database);
    const refundRes = svc.processRefund(
      {
        saleId: 'sale-100',
        reason: 'Customer returned 1 spoiled pack',
        refundMethod: 'Cash',
        items: [
          {
            saleItemId: 'soi-1',
            productId: 'p-fish',
            returnedQty: 1,
            refundAmount: 2000,
          },
        ],
      },
      'cashier-1',
    );

    expect(refundRes.refund_amount).toBe(2000);
    expect(updatedPaymentStatus).toBe('Partially refunded');
    expect(adjustedQty).toBe(1);
  });

  it('should mark order as "Refunded" when remaining 4 items are returned', () => {
    let updatedPaymentStatus = '';

    const testDb: Record<string, unknown> = {
      prepare: (sql: string) => {
        if (sql.includes('SELECT * FROM products WHERE id')) {
          return {
            get: () => ({ id: 'p-fish', name_en: 'Sea Fish', base_unit_id: 'u-1', purchase_cost: 1000 }),
          };
        }
        if (sql.includes('SELECT * FROM sales_orders WHERE id')) {
          return {
            get: () => ({
              id: 'sale-100',
              invoice_number: 'INV-2026-000100',
              grand_total: 10000,
              payment_status: 'Partially refunded',
            }),
          };
        }
        if (sql.includes('SELECT soi.*') || sql.includes('SELECT * FROM sales_order_items')) {
          return {
            all: () => [
              {
                id: 'soi-1',
                sale_id: 'sale-100',
                product_id: 'p-fish',
                quantity: 5,
                unit_price: 2000,
                line_total: 10000,
                previously_refunded_qty: 1, // 1 already refunded
              },
            ],
          };
        }
        if (sql.includes('UPDATE sales_orders SET payment_status')) {
          return {
            run: (status: string) => {
              updatedPaymentStatus = status;
            },
          };
        }
        if (sql.includes('SELECT * FROM numbering_sequences')) {
          return {
            get: () => ({ prefix: 'PR', current_number: 2, padding: 6, include_year: 1 }),
          };
        }
        if (sql.includes('SELECT * FROM inventory_balances')) {
          return {
            get: () => ({ quantity_on_hand: 51 }),
          };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    const svc = new POSRefundService(testDb as unknown as Database.Database);
    const refundRes = svc.processRefund(
      {
        saleId: 'sale-100',
        reason: 'Customer returned remaining 4 packs',
        refundMethod: 'Cash',
        items: [
          {
            saleItemId: 'soi-1',
            productId: 'p-fish',
            returnedQty: 4,
            refundAmount: 8000,
          },
        ],
      },
      'cashier-1',
    );

    expect(refundRes.refund_amount).toBe(8000);
    expect(updatedPaymentStatus).toBe('Refunded');
  });
});
