import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { ReportsService } from '../main/services/reports.service';

describe('ReportsService - Dashboard Sales Metrics', () => {
  let mockDb: Record<string, unknown>;
  let reportsService: ReportsService;

  beforeEach(() => {
    mockDb = {
      prepare: (sql: string) => {
        if (sql.includes('SELECT') && sql.includes('FROM sales_orders')) {
          return {
            get: () => ({
              totalTransactions: 15,
              grossRevenue: 1500,
              subtotalSum: 1400,
              totalDiscounts: 50,
              taxCollected: 150,
              averageSale: 100,
            }),
          };
        }
        if (sql.includes('FROM sales_order_items i')) {
          if (sql.includes('GROUP BY p.id')) {
            return {
              all: () => [{ name_en: 'Best Item', totalQty: 10, totalAmount: 200 }],
            };
          }
          return { get: () => ({ cogs: 800 }) };
        }
        if (sql.includes('FROM sales_refunds')) {
          return { get: () => ({ totalRefunds: 20 }) };
        }
        if (sql.includes('FROM products p')) {
          return { get: () => ({ lowStockCount: 2, outOfStockCount: 1 }) };
        }
        return { get: () => undefined, all: () => [] };
      },
    };

    reportsService = new ReportsService(mockDb as unknown as Database.Database);
  });

  it('should aggregate dashboard sales metrics and top products', () => {
    const res = reportsService.getDashboardMetrics({ userRole: 'Owner' });
    expect(res.totalTransactions).toBe(15);
    expect(res.grossRevenue).toBe(1500);
    expect(res.grossProfit).toBe(700);
    expect(res.topProducts).toHaveLength(1);
  });
});
