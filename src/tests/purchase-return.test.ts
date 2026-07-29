import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { PurchaseReturnService } from '../main/services/purchase-return.service';

describe('Purchase Return Service', () => {
  let mockDb: Record<string, unknown>;
  let returnService: PurchaseReturnService;

  beforeEach(() => {
    mockDb = {
      prepare: (sql: string) => {
        if (sql.includes('SELECT * FROM products WHERE id')) {
          return {
            get: () => ({
              id: 'p-1',
              name_en: 'Test Product',
              base_unit_id: 'u-1',
              purchase_cost: 10,
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

    returnService = new PurchaseReturnService(mockDb as unknown as Database.Database);
  });

  it('should process supplier return transaction and return completed entity', () => {
    const input = {
      supplierId: 'sup-1',
      returnDate: '2026-07-21',
      reason: 'Damaged stock',
      items: [
        {
          productId: 'p-1',
          unitId: 'u-1',
          returnedQty: 5,
          unitCost: 10,
          reason: 'Damaged in transit',
          stockDisposition: 'Remove from sellable stock',
        },
      ],
    };

    const res = returnService.createReturn(input);
    expect(res.status).toBe('Completed');
    expect(res.return_number).toContain('PR-');
  });
});
