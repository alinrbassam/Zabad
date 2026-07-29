import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { BatchRepository } from '../main/database/repositories/batch.repository';
import { BatchEntity } from '@shared/types';

describe('Batch Management & Expiry Status Logic', () => {
  let mockDb: Record<string, unknown>;
  let batchRepo: BatchRepository;
  let batches: BatchEntity[];

  beforeEach(() => {
    batches = [];

    mockDb = {
      prepare: (sql: string) => {
        if (sql.includes('INSERT INTO batches')) {
          return {
            run: (
              id: string,
              productId: string,
              batchNumber: string,
              supplierId: string,
              mfgDate: string,
              expiryDate: string,
              receivedQty: number,
              remainingQty: number,
              unitCost: number,
              status: BatchEntity['status'],
            ) => {
              batches.push({
                id,
                product_id: productId,
                batch_number: batchNumber,
                supplier_id: supplierId,
                mfg_date: mfgDate,
                expiry_date: expiryDate,
                received_qty: receivedQty,
                remaining_qty: remainingQty,
                unit_cost: unitCost,
                status,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            },
          };
        }
        if (sql.includes('SELECT * FROM batches WHERE id = ?')) {
          return {
            get: (id: string) => batches.find((b) => b.id === id),
          };
        }
        return {
          get: () => undefined,
          all: () => batches,
          run: vi.fn(),
        };
      },
    };

    batchRepo = new BatchRepository(mockDb as unknown as Database.Database);
  });

  it('should auto-classify batch as Expired if expiry date is past', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const batch = batchRepo.createBatch({
      productId: 'prod-1',
      batchNumber: 'BATCH-EXPIRED-01',
      expiryDate: pastDate,
      receivedQty: 50,
    });

    expect(batch.status).toBe('Expired');
  });

  it('should auto-classify batch as Expiring soon if within 30 days', () => {
    const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    const batch = batchRepo.createBatch({
      productId: 'prod-1',
      batchNumber: 'BATCH-SOON-01',
      expiryDate: soonDate,
      receivedQty: 20,
    });

    expect(batch.status).toBe('Expiring soon');
  });
});
