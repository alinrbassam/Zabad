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
});
