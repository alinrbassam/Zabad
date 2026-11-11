import Database from 'better-sqlite3';
import { DatabaseMigrator } from '../migrator';
import { migrationV2 } from './v2_auth_and_settings';
import { migrationV3 } from './v3_inventory';
import { migrationV4 } from './v4_purchasing';
import { migrationV5 } from './v5_pos';
import { migrationV6 } from './v6_reports';
import { migrationV7 } from './v7_commercial';
import { migrationV8, ensureBorrowColumns } from './v8_expenses_and_borrow';
import { migrationV9, ensureWeightColumns } from './v9_weight_and_packaging';
import { migrationV10, ensureCleanUnits } from './v10_simplify_units';
import { migrationV11, ensureMovementDeleteColumns } from './v11_movement_soft_delete';
import {
  migrationV12,
  ensurePurchaseOrderDeleteColumns,
  reconcilePurchaseOrderStatuses,
} from './v12_purchase_order_soft_delete';
import {
  migrationV13,
  ensureSalesOrderDeleteColumns,
} from './v13_sales_order_soft_delete';
import { logger } from '../../services/logger.service';

export const ALL_MIGRATIONS = [
  migrationV2,
  migrationV3,
  migrationV4,
  migrationV5,
  migrationV6,
  migrationV7,
  migrationV8,
  migrationV9,
  migrationV10,
  migrationV11,
  migrationV12,
  migrationV13,
];

/**
 * Runs every schema column guard independently so a failure in one step
 * never blocks later column repairs (e.g., piece_weight on products).
 */
export function ensureAllSchemaColumns(db: Database.Database): void {
  const steps: Array<{ name: string; fn: (database: Database.Database) => void }> = [
    { name: 'ensureBorrowColumns', fn: ensureBorrowColumns },
    { name: 'ensureWeightColumns', fn: ensureWeightColumns },
    { name: 'ensureCleanUnits', fn: ensureCleanUnits },
    { name: 'ensureMovementDeleteColumns', fn: ensureMovementDeleteColumns },
    { name: 'ensurePurchaseOrderDeleteColumns', fn: ensurePurchaseOrderDeleteColumns },
    { name: 'ensureSalesOrderDeleteColumns', fn: ensureSalesOrderDeleteColumns },
    { name: 'reconcilePurchaseOrderStatuses', fn: reconcilePurchaseOrderStatuses },
  ];

  for (const step of steps) {
    try {
      step.fn(db);
    } catch (err) {
      logger.error('SchemaEnsure', `Schema repair step "${step.name}" failed`, err);
    }
  }
}

/**
 * Runs versioned migrations and unconditionally enforces idempotent schema column guards,
 * safe on initial boot as well as after hot-swapping a downloaded cloud/backup database.
 */
export function initializeDatabaseSchema(db: Database.Database): void {
  try {
    const migrator = new DatabaseMigrator(db);
    migrator.initMigrationTable();
    migrator.runMigrations(ALL_MIGRATIONS);
  } catch (err) {
    logger.error(
      'SchemaEnsure',
      'Versioned migration execution encountered an error; continuing with column repair guards',
      err,
    );
  }

  ensureAllSchemaColumns(db);
}
