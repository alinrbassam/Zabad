import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { DemoDataService } from '../main/services/demo-data.service';

describe('DemoDataService', () => {
  let mockDb: Record<string, unknown>;
  let demoService: DemoDataService;

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn().mockReturnValue({
        run: vi.fn(),
      }),
    };

    demoService = new DemoDataService(mockDb as unknown as Database.Database);
  });

  it('should seed demo products and categories', () => {
    const res = demoService.seedDemoData();
    expect(res.categoriesSeeded).toBe(3);
    expect(res.productsSeeded).toBe(3);
    expect(mockDb.prepare).toHaveBeenCalled();
  });

  it('should clear demo products and categories', () => {
    demoService.clearDemoData();
    expect(mockDb.prepare).toHaveBeenCalledWith("DELETE FROM products WHERE sku LIKE 'DEMO-%'");
  });
});
