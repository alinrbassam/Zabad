import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { BackupService } from '../main/services/backup.service';

describe('BackupService & Automated Cloud-Sync', () => {
  let mockDb: Record<string, unknown>;
  let backupService: BackupService;

  beforeEach(() => {
    mockDb = {
      backup: vi.fn(),
      prepare: (sql: string) => {
        if (sql.includes('INSERT INTO backup_records')) {
          return { run: vi.fn() };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
    };

    backupService = new BackupService(mockDb as unknown as Database.Database);
  });

  it('should trigger SQLite database online backup', async () => {
    const res = await backupService.createFullBackup('./tmp_backups');
    expect(res.backupType).toBe('Full');
    expect(mockDb.backup).toHaveBeenCalled();
  });
});
