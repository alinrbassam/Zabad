import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseMigrator } from '../main/database/migrator';
import Database from 'better-sqlite3';

describe('DatabaseMigrator', () => {
  let mockDb: Record<string, unknown>;
  let migrator: DatabaseMigrator;
  let executedSql: string[];
  let appliedVersions: Array<{ version: number; name: string }>;

  beforeEach(() => {
    executedSql = [];
    appliedVersions = [];

    mockDb = {
      exec: vi.fn((sql: string) => {
        executedSql.push(sql);
        return mockDb;
      }),
      prepare: (sql: string) => {
        if (sql.includes('SELECT version FROM schema_migrations')) {
          return {
            all: () => appliedVersions.map((v) => ({ version: v.version })),
          };
        }
        if (sql.includes('INSERT INTO schema_migrations')) {
          return {
            run: (v: number, name: string) => {
              appliedVersions.push({ version: v, name });
              return { changes: 1, lastInsertRowid: 1 };
            },
          };
        }
        return {
          all: () => [],
          run: () => ({ changes: 1, lastInsertRowid: 1 }),
        };
      },
      transaction: (fn: () => void) => {
        return () => fn();
      },
    };

    migrator = new DatabaseMigrator(mockDb as unknown as Database.Database);
  });

  it('should initialize schema_migrations table', () => {
    migrator.initMigrationTable();
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS schema_migrations'),
    );
  });

  it('should apply versioned migrations sequentially', () => {
    const migrations = [
      {
        version: 1,
        name: 'create_test_table',
        sql: 'CREATE TABLE test (id TEXT PRIMARY KEY, title TEXT);',
      },
      {
        version: 2,
        name: 'add_column_test',
        sql: 'ALTER TABLE test ADD COLUMN created_at TEXT;',
      },
    ];

    migrator.runMigrations(migrations);
    const versions = migrator.getAppliedVersions();
    expect(versions).toEqual([1, 2]);
    expect(executedSql).toContain(migrations[0].sql);
    expect(executedSql).toContain(migrations[1].sql);
  });

  it('should not re-apply already executed migrations', () => {
    const migrations = [
      {
        version: 1,
        name: 'create_test_table',
        sql: 'CREATE TABLE test (id TEXT PRIMARY KEY);',
      },
    ];

    migrator.runMigrations(migrations);
    migrator.runMigrations(migrations);

    const versions = migrator.getAppliedVersions();
    expect(versions).toEqual([1]);
  });
});
