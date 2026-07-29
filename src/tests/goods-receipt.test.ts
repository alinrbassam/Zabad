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
});
