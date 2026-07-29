import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { PurchaseOrderService } from '../main/services/purchase-order.service';

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
});
