import Database from 'better-sqlite3';
import { logger } from '../../services/logger.service';

export const migrationV12 = {
  version: 12,
  name: 'purchase_order_soft_delete_and_status_v12',
  sql: `
    -- Track soft deletion on purchase_orders so deletions stay deleted across cloud sync
  `,
};

export function ensurePurchaseOrderDeleteColumns(db: Database.Database): void {
  try {
    const cols = db.prepare(`PRAGMA table_info(purchase_orders)`).all() as Array<{ name: string }>;
    if (cols.length === 0) return;

    const colNames = new Set(cols.map((c) => c.name));

    if (!colNames.has('deleted_at')) {
      db.exec(`ALTER TABLE purchase_orders ADD COLUMN deleted_at DATETIME NULL`);
    }
    if (!colNames.has('updated_at')) {
      db.exec(`ALTER TABLE purchase_orders ADD COLUMN updated_at DATETIME NULL`);
    }
  } catch (err) {
    logger.error('MigrationV12', 'Failed ensuring purchase_orders soft-delete columns', err);
  }
}

export function reconcilePurchaseOrderStatuses(db: Database.Database): void {
  try {
    const pos = db
      .prepare(
        `SELECT id, status FROM purchase_orders
         WHERE (deleted_at IS NULL OR deleted_at = '')
           AND status NOT IN ('Cancelled', 'Closed', 'Fully received')`,
      )
      .all() as Array<{ id: string; status: string }>;

    if (!pos || pos.length === 0) return;

    const itemsStmt = db.prepare(
      'SELECT ordered_qty, received_qty FROM purchase_order_items WHERE po_id = ?',
    );
    const updateStmt = db.prepare(
      'UPDATE purchase_orders SET status = ?, updated_at = ? WHERE id = ?',
    );
    const historyStmt = db.prepare(
      'INSERT INTO purchase_order_status_history (id, po_id, from_status, to_status, user_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
    );
    const now = new Date().toISOString();

    db.transaction(() => {
      for (const po of pos) {
        const items = itemsStmt.all(po.id) as Array<{
          ordered_qty: number;
          received_qty: number;
        }>;
        if (!items || items.length === 0) continue;

        const anyReceived = items.some((i) => Number(i.received_qty || 0) > 0);
        if (!anyReceived) continue;

        const allFullyReceived = items.every(
          (i) => Number(i.received_qty || 0) + 1e-6 >= Number(i.ordered_qty || 0),
        );
        const nextStatus = allFullyReceived ? 'Fully received' : 'Partially received';

        if (nextStatus !== po.status) {
          updateStmt.run(nextStatus, now, po.id);
          historyStmt.run(
            crypto.randomUUID(),
            po.id,
            po.status,
            nextStatus,
            'system',
            'Reconciled purchase order status from received item quantities',
          );
        }
      }
    })();
  } catch {
    // Ignore if tables don't exist yet
  }
}
