import Database from 'better-sqlite3';

export class PurchasingDashboardService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public getDashboardMetrics() {
    const notDeleted = "(deleted_at IS NULL OR deleted_at = '')";

    const drafts = (
      this.db
        .prepare(`SELECT COUNT(*) as cnt FROM purchase_orders WHERE status = 'Draft' AND ${notDeleted}`)
        .get() as { cnt: number }
    ).cnt;

    const awaitingApproval = (
      this.db
        .prepare(
          `SELECT COUNT(*) as cnt FROM purchase_orders WHERE status = 'Awaiting approval' AND ${notDeleted}`,
        )
        .get() as { cnt: number }
    ).cnt;

    const ordered = (
      this.db
        .prepare(
          `SELECT COUNT(*) as cnt FROM purchase_orders WHERE status IN ('Ordered', 'Partially received') AND ${notDeleted}`,
        )
        .get() as { cnt: number }
    ).cnt;

    const overdue = (
      this.db
        .prepare(
          `SELECT COUNT(*) as cnt FROM purchase_orders WHERE status IN ('Ordered', 'Partially received') AND expected_delivery_date < DATE('now') AND ${notDeleted}`,
        )
        .get() as { cnt: number }
    ).cnt;

    const totalThisMonth =
      (
        this.db
          .prepare(
            `SELECT SUM(grand_total) as total FROM purchase_orders WHERE status != 'Cancelled' AND ${notDeleted} AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`,
          )
          .get() as { total: number | null }
      ).total || 0;

    const topSuppliers = this.db
      .prepare(
        `
      SELECT s.name, SUM(po.grand_total) as total_purchases
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.status != 'Cancelled' AND (po.deleted_at IS NULL OR po.deleted_at = '')
      GROUP BY po.supplier_id
      ORDER BY total_purchases DESC
      LIMIT 5
    `,
      )
      .all();

    return {
      draftsCount: drafts,
      awaitingApprovalCount: awaitingApproval,
      orderedCount: ordered,
      overdueCount: overdue,
      monthlyPurchasesTotal: Math.round(totalThisMonth * 100) / 100,
      topSuppliers,
    };
  }
}
