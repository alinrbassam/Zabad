import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { PurchaseNumberingService } from '../main/services/purchase-numbering.service';

interface SeqItem {
  prefix: string;
  current_number: number;
  padding: number;
  include_year: number;
}

describe('Purchase Numbering Service', () => {
  let mockDb: Record<string, unknown>;
  let service: PurchaseNumberingService;
  let sequences: Record<string, SeqItem>;

  beforeEach(() => {
    sequences = {
      po: { prefix: 'PO', current_number: 0, padding: 6, include_year: 1 },
      gr: { prefix: 'GR', current_number: 12, padding: 6, include_year: 1 },
    };

    mockDb = {
      prepare: (sql: string) => {
        if (sql.includes('SELECT * FROM numbering_sequences')) {
          return {
            get: (key: string) => sequences[key],
          };
        }
        if (sql.includes('UPDATE numbering_sequences')) {
          return {
            run: (currentNum: number, key: string) => {
              if (sequences[key]) {
                sequences[key].current_number = currentNum;
              }
            },
          };
        }
        return { get: () => undefined, run: vi.fn() };
      },
    };

    service = new PurchaseNumberingService(mockDb as unknown as Database.Database);
  });

  it('should generate sequential PO numbers formatted as PO-YYYY-000001', () => {
    const year = new Date().getFullYear();
    const poNum1 = service.generateNextNumber('po');
    expect(poNum1).toBe(`PO-${year}-000001`);

    const poNum2 = service.generateNextNumber('po');
    expect(poNum2).toBe(`PO-${year}-000002`);
  });

  it('should format GR numbers with existing sequence offset', () => {
    const year = new Date().getFullYear();
    const grNum = service.generateNextNumber('gr');
    expect(grNum).toBe(`GR-${year}-000013`);
  });
});
