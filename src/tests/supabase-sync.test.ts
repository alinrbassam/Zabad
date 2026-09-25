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
});
