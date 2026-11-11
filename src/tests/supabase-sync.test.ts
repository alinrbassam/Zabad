import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { SupabaseSyncService } from '../main/services/supabase-sync.service';

describe('SupabaseSyncService Configuration & Roles', () => {
  let mockDb: Record<string, unknown>;
  let service: SupabaseSyncService;
  let settingsStore: Record<string, string>;

  beforeEach(() => {
    settingsStore = {
      supabase_sync_enabled: 'true',
      supabase_sync_role: 'store',
      supabase_url: 'https://zlewivlmnwjloksdercw.supabase.co',
      supabase_key: Buffer.from('c2Jfc2VjcmV0X2ZjRDA0cGxzOXpDNEdRNHlnQ2d0blFfLUIzclplUDI=', 'base64').toString('utf-8'),
      supabase_sync_interval: '10',
    };

    mockDb = {
      prepare: (sql: string) => {
        if (sql.includes('business_settings')) {
          if (sql.includes('SELECT')) {
            return {
              all: () =>
                Object.entries(settingsStore).map(([key, value]) => ({
                  key,
                  value,
                })),
              get: () => undefined,
            };
          }
          if (sql.includes('INSERT')) {
            return {
              run: (...args: any[]) => {
                // args: [id, businessId, category, key, value]
                if (args.length >= 5 && typeof args[3] === 'string') {
                  settingsStore[args[3]] = String(args[4]);
                }
                return { changes: 1 };
              },
            };
          }
        }
        if (sql.includes('businesses')) {
          return {
            get: () => ({ id: 'biz_default', name: 'Khalil Test Store', currency: 'USD' }),
          };
        }
        return {
          get: () => undefined,
          all: () => [],
          run: vi.fn(),
        };
      },
      transaction: (fn: (...args: any[]) => any) => {
        return (...args: any[]) => fn(...args);
      },
    };

    service = new SupabaseSyncService(mockDb as unknown as Database.Database);
  });

  it('should return default Supabase configuration', () => {
    const config = service.getConfig();
    expect(config.enabled).toBe(true);
    expect(config.role).toBe('store');
    expect(config.supabaseUrl).toContain('supabase.co');
    expect(config.supabaseKey).toBeTruthy();
    expect(config.autoSyncIntervalMinutes).toBe(10);
  });

  it('should update and persist configuration changes to database', () => {
    service.updateConfig({
      role: 'manager',
      autoSyncIntervalMinutes: 5,
    });

    const updated = service.getConfig();
    expect(updated.role).toBe('manager');
    expect(updated.autoSyncIntervalMinutes).toBe(5);
  });

  it('should persist and retrieve remote store metadata', () => {
    const mockMeta = {
      storeName: 'Khalil Test Store',
      currency: 'USD',
      orderCountToday: 25,
      revenueToday: 1500,
      productCount: 150,
      lastSyncedAt: new Date().toISOString(),
      deviceId: 'TEST-DEVICE-1234',
      version: '1.0.9',
    };

    service.updateConfig({
      remoteMeta: mockMeta,
      lastSyncAt: mockMeta.lastSyncedAt,
      lastStatus: 'success',
    });

    const config = service.getConfig();
    expect(config.remoteMeta).not.toBeNull();
    expect(config.remoteMeta?.storeName).toBe('Khalil Test Store');
    expect(config.remoteMeta?.orderCountToday).toBe(25);
    expect(config.lastStatus).toBe('success');
  });

  it('should call mergeRemoteData with foreign_keys disabled before transaction', () => {
    const pragmaCalls: string[] = [];
    const testMockDb = {
      pragma: (arg: string) => {
        pragmaCalls.push(arg);
      },
      prepare: (sql: string) => {
        if (sql.includes('table_info')) {
          return {
            all: () => [
              { name: 'id', pk: 1 },
              { name: 'name', pk: 0 },
            ],
          };
        }
        return {
          get: () => undefined,
          run: vi.fn(),
        };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    const s = new SupabaseSyncService(testMockDb as unknown as Database.Database);
    const count = s.mergeRemoteData({
      suppliers: [{ id: 'sup-1', name: 'Bassam' }],
    });

    expect(count).toBe(1);
    expect(pragmaCalls).toContain('foreign_keys = OFF');
    expect(pragmaCalls).toContain('foreign_keys = ON');
    expect(pragmaCalls.indexOf('foreign_keys = OFF')).toBeLessThan(pragmaCalls.indexOf('foreign_keys = ON'));
  });

  it('should propagate sales_orders soft-deletions across synced laptops without resurrecting deleted test sales', () => {
    const localSales: Record<string, Record<string, unknown>> = {
      'sale-remote-deleted': {
        id: 'sale-remote-deleted',
        invoice_number: 'INV-2026-000044',
        grand_total: 400,
        paid_amount: 400,
        payment_status: 'Paid',
        updated_at: '2026-10-27T09:47:00.000Z',
        deleted_at: null,
      },
      'sale-local-deleted': {
        id: 'sale-local-deleted',
        invoice_number: 'INV-2026-000045',
        grand_total: 4636359,
        paid_amount: 4636359,
        payment_status: 'Paid',
        updated_at: '2026-11-09T11:30:00.000Z',
        deleted_at: '2026-11-09T11:30:00.000Z',
      },
    };

    const cols = [
      'id',
      'invoice_number',
      'grand_total',
      'paid_amount',
      'payment_status',
      'updated_at',
      'deleted_at',
    ];

    const syncMockDb = {
      pragma: vi.fn(),
      prepare: (sql: string) => {
        if (sql.includes('PRAGMA table_info(sales_orders)')) {
          return {
            all: () => cols.map((name) => ({ name, pk: name === 'id' ? 1 : 0 })),
          };
        }
        if (sql.includes('SELECT * FROM sales_orders WHERE id = ?')) {
          return {
            get: (id: string) => localSales[id],
          };
        }
        if (sql.includes('UPDATE sales_orders SET')) {
          const nonPkCols = cols.filter((c) => c !== 'id');
          return {
            run: (...args: unknown[]) => {
              const id = String(args[nonPkCols.length]);
              const target = localSales[id];
              if (target) {
                nonPkCols.forEach((col, idx) => {
                  target[col] = args[idx];
                });
              }
            },
          };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    const syncService = new SupabaseSyncService(syncMockDb as unknown as Database.Database);
    const mergedCount = syncService.mergeRemoteData({
      sales_orders: [
        {
          id: 'sale-remote-deleted',
          invoice_number: 'INV-2026-000044',
          grand_total: 400,
          paid_amount: 400,
          payment_status: 'Paid',
          updated_at: '2026-11-09T11:35:00.000Z',
          deleted_at: '2026-11-09T11:35:00.000Z',
        },
        {
          id: 'sale-local-deleted',
          invoice_number: 'INV-2026-000045',
          grand_total: 4636359,
          paid_amount: 5000000,
          payment_status: 'Refunded',
          updated_at: '2026-11-09T10:00:00.000Z',
          deleted_at: null,
        },
      ],
    });

    // Only the remote soft-delete should overwrite local non-deleted sale; local deletion must stay deleted
    expect(mergedCount).toBe(1);
    expect(localSales['sale-remote-deleted'].deleted_at).toBe('2026-11-09T11:35:00.000Z');
    expect(localSales['sale-local-deleted'].deleted_at).toBe('2026-11-09T11:30:00.000Z');
  });
});
