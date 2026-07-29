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
});
