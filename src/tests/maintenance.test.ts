import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { MaintenanceService } from '../main/services/maintenance.service';

describe('MaintenanceService', () => {
  let mockDb: Record<string, unknown>;
  let maintenanceService: MaintenanceService;

  beforeEach(() => {
    mockDb = {
      exec: vi.fn(),
      prepare: (sql: string) => {
        if (sql.includes('PRAGMA integrity_check')) {
          return { get: () => ({ integrity_check: 'ok' }) };
        }
        if (sql.includes('sqlite_version()')) {
          return { get: () => ({ ver: '3.45.0' }) };
        }
        return { get: () => ({ cnt: 10 }) };
      },
    };

    maintenanceService = new MaintenanceService(mockDb as unknown as Database.Database);
  });

  it('should run VACUUM successfully', () => {
    const res = maintenanceService.runVacuum();
    expect(res).toBe(true);
    expect(mockDb.exec).toHaveBeenCalledWith('VACUUM');
  });

  it('should run integrity check and return Success status', () => {
    const res = maintenanceService.runIntegrityCheck();
    expect(res.status).toBe('Success');
    expect(res.result).toBe('ok');
  });
});
