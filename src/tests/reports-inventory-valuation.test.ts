import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { ReportsService } from '../main/services/reports.service';

describe('ReportsService - Inventory Valuation', () => {
  let mockDb: Record<string, unknown>;
  let reportsService: ReportsService;

  beforeEach(() => {
    mockDb = {
      prepare: (sql: string) => {
        if (sql.includes('FROM products p')) {
          return {
            all: () => [
              {
                id: 'p-1',
                name_en: 'Product A',
                sku: 'SKU-A',
                avg_cost: 10,
                selling_price: 15,
                stock_qty: 20,
                total_cost_value: 200,
                total_retail_value: 300,
              },
            ],
          };
        }
        return { get: () => undefined, all: () => [] };
      },
    };

    reportsService = new ReportsService(mockDb as unknown as Database.Database);
  });

  it('should return inventory cost valuation for Business Owner', () => {
    const res = reportsService.getInventoryValuationReport({ userRole: 'Owner' }) as Record<
      string,
      number
    >[];
    expect(res).toHaveLength(1);
    expect(res[0].total_cost_value).toBe(200);
    expect(res[0].total_retail_value).toBe(300);
  });
});
