import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { POSSuspendedService } from '../main/services/pos-suspended.service';

describe('POS Suspended Service (Hold / Resume)', () => {
  let mockDb: Record<string, unknown>;
  let suspendedService: POSSuspendedService;

  beforeEach(() => {
    mockDb = {
      prepare: () => ({
        get: () => ({ id: 'susp-1', reference_name: 'Table 1', subtotal: 20, grand_total: 20 }),
        all: () => [{ id: 'susp-1', reference_name: 'Table 1', subtotal: 20, grand_total: 20 }],
        run: vi.fn(),
      }),
      transaction: (fn: () => void) => () => fn(),
    };

    suspendedService = new POSSuspendedService(mockDb as unknown as Database.Database);
  });

  it('should hold current sale and generate suspended sale entity', () => {
    const input = {
      referenceName: 'Table 1',
      items: [
        {
          productId: 'p-1',
          unitId: 'u-1',
          quantity: 2,
          unitPrice: 10,
          discount: 0,
          taxRate: 0,
        },
      ],
    };

    const res = suspendedService.holdSale(input);
    expect(res.reference_name).toBe('Table 1');
    expect(res.grand_total).toBe(20);
  });
});
