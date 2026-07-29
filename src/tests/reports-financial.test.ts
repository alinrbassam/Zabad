import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { ReportsService } from '../main/services/reports.service';

describe('ReportsService - Financial P&L Statement', () => {
  let mockDb: Record<string, unknown>;
  let reportsService: ReportsService;

  beforeEach(() => {
    mockDb = {
      prepare: (sql: string) => {
        if (sql.includes('FROM sales_orders')) {
          return {
            get: () => ({ totalRevenue: 1000, totalTax: 100, totalDiscounts: 50 }),
          };
        }
        if (sql.includes('FROM sales_order_items')) {
          return {
            get: () => ({ cogs: 600 }),
          };
        }
        return { get: () => undefined, all: () => [] };
      },
    };

    reportsService = new ReportsService(mockDb as unknown as Database.Database);
  });

  it('should calculate Gross Profit and Net Profit correctly for Business Owner', () => {
    const res = reportsService.getFinancialReport({ userRole: 'Owner' });
    expect(res.revenue).toBe(1000);
    expect(res.cogs).toBe(600);
    expect(res.grossProfit).toBe(400);
    expect(res.netProfit).toBe(400);
    expect(res.profitMarginPercent).toBe(40);
  });

  it('should block non-Owner users from accessing Financial P&L statements', () => {
    expect(() => reportsService.getFinancialReport({ userRole: 'Cashier' })).toThrow(
      'Access Denied: Financial P&L statements are restricted to Business Owners.',
    );
  });
});
