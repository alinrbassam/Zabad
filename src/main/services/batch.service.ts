import Database from 'better-sqlite3';
import { BatchRepository } from '../database/repositories/batch.repository';
import { BatchEntity } from '@shared/types';

export class BatchService {
  private batchRepo: BatchRepository;

  constructor(db: Database.Database) {
    this.batchRepo = new BatchRepository(db);
  }

  public getBatchesByProduct(productId: string): BatchEntity[] {
    return this.batchRepo.getBatchesByProduct(productId);
  }

  public getExpiringBatches(daysWindow = 30): BatchEntity[] {
    return this.batchRepo.getExpiringBatches(daysWindow);
  }

  public getOrCreateBatch(params: {
    productId: string;
    batchNumber: string;
    supplierId?: string;
    mfgDate?: string;
    expiryDate?: string;
    receivedQty: number;
    unitCost?: number;
  }): BatchEntity {
    return this.batchRepo.createBatch(params);
  }
}
