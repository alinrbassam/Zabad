import Database from 'better-sqlite3';

export interface ReportFilterOptions {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  supplierId?: string;
  paymentMethod?: string;
  cashierId?: string;
  userRole?: string;
}

export class ReportsService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public getDashboardMetrics(options: ReportFilterOptions) {
    const isOwner = options.userRole === 'Owner' || !options.userRole;

    const startDate =
      options.startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const endDate = options.endDate || new Date().toISOString().slice(0, 10);

    const salesStmt = this.db.prepare(`
      SELECT
        COUNT(id) as totalTransactions,
        COALESCE(SUM(grand_total), 0) as grossRevenue,
        COALESCE(SUM(subtotal), 0) as subtotalSum,
        COALESCE(SUM(item_discount + order_discount), 0) as totalDiscounts,
        COALESCE(SUM(tax_total), 0) as taxCollected,
        COALESCE(AVG(grand_total), 0) as averageSale
      FROM sales_orders
      WHERE payment_status = 'Paid' AND date(created_at) BETWEEN ? AND ?
    `);
    const salesRes = salesStmt.get(startDate, endDate) as {
      totalTransactions: number;
      grossRevenue: number;
      subtotalSum: number;
      totalDiscounts: number;
      taxCollected: number;
      averageSale: number;
    };

    const cogsStmt = this.db.prepare(`
      SELECT COALESCE(SUM(i.quantity * i.cost_price), 0) as cogs
      FROM sales_order_items i
      JOIN sales_orders s ON i.sale_id = s.id
      WHERE s.payment_status = 'Paid' AND date(s.created_at) BETWEEN ? AND ?
    `);
    const cogsRes = cogsStmt.get(startDate, endDate) as { cogs: number };
    const cogs = cogsRes.cogs || 0;

    const refundStmt = this.db.prepare(`
      SELECT COALESCE(SUM(refund_amount), 0) as totalRefunds
      FROM sales_refunds
      WHERE date(created_at) BETWEEN ? AND ?
    `);
    const refundRes = refundStmt.get(startDate, endDate) as { totalRefunds: number };

    const stockStmt = this.db.prepare(`
      SELECT
        SUM(CASE WHEN b.quantity_on_hand <= p.reorder_level AND b.quantity_on_hand > 0 THEN 1 ELSE 0 END) as lowStockCount,
        SUM(CASE WHEN b.quantity_on_hand <= 0 THEN 1 ELSE 0 END) as outOfStockCount
      FROM products p
      LEFT JOIN inventory_balances b ON p.id = b.product_id
      WHERE (p.deleted_at IS NULL OR p.deleted_at = '') AND p.is_active = 1
    `);
    const stockRes = stockStmt.get() as { lowStockCount: number; outOfStockCount: number };

    const topProductsStmt = this.db.prepare(`
      SELECT
        p.name_en,
        SUM(i.quantity) as totalQty,
        SUM(i.line_total) as totalAmount
      FROM sales_order_items i
      JOIN products p ON i.product_id = p.id
      JOIN sales_orders s ON i.sale_id = s.id
      WHERE s.payment_status = 'Paid' AND date(s.created_at) BETWEEN ? AND ?
      GROUP BY p.id
      ORDER BY totalAmount DESC
      LIMIT 5
    `);
    const topProducts = topProductsStmt.all(startDate, endDate);

    const grossProfit = Math.round((salesRes.grossRevenue - cogs) * 100) / 100;

    return {
      totalTransactions: salesRes.totalTransactions || 0,
      grossRevenue: salesRes.grossRevenue || 0,
      totalDiscounts: salesRes.totalDiscounts || 0,
      taxCollected: salesRes.taxCollected || 0,
      averageSale: Math.round((salesRes.averageSale || 0) * 100) / 100,
      totalRefunds: refundRes.totalRefunds || 0,
      lowStockCount: stockRes.lowStockCount || 0,
      outOfStockCount: stockRes.outOfStockCount || 0,
      topProducts,
      ...(isOwner
        ? {
            cogs,
            grossProfit,
            netProfit: grossProfit,
          }
        : {}),
    };
  }

  public getSalesReport(options: ReportFilterOptions) {
    const startDate =
      options.startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const endDate = options.endDate || new Date().toISOString().slice(0, 10);

    let sql = `
      SELECT
        id, invoice_number, subtotal, item_discount, order_discount,
        tax_total, grand_total, payment_method, payment_status, created_at
      FROM sales_orders
      WHERE date(created_at) BETWEEN ? AND ?
    `;
    const params: string[] = [startDate, endDate];

    if (options.paymentMethod) {
      sql += ' AND payment_method = ?';
      params.push(options.paymentMethod);
    }
    if (options.cashierId) {
      sql += ' AND cashier_id = ?';
      params.push(options.cashierId);
    }

    sql += ' ORDER BY created_at DESC LIMIT 200';
    return this.db.prepare(sql).all(...params);
  }

  public getProductPerformanceReport(options: ReportFilterOptions) {
    const isOwner = options.userRole === 'Owner' || !options.userRole;
    const startDate =
      options.startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const endDate = options.endDate || new Date().toISOString().slice(0, 10);

    const selectFields = isOwner
      ? `p.id, p.name_en, p.sku, SUM(i.quantity) as total_sold_qty,
         SUM(i.line_total) as total_revenue,
         SUM(i.quantity * i.cost_price) as total_cost,
         SUM(i.line_total - (i.quantity * i.cost_price)) as total_profit`
      : `p.id, p.name_en, p.sku, SUM(i.quantity) as total_sold_qty, SUM(i.line_total) as total_revenue`;

    const sql = `
      SELECT ${selectFields}
      FROM sales_order_items i
      JOIN products p ON i.product_id = p.id
      JOIN sales_orders s ON i.sale_id = s.id
      WHERE s.payment_status = 'Paid' AND date(s.created_at) BETWEEN ? AND ?
      GROUP BY p.id
      ORDER BY total_sold_qty DESC
      LIMIT 100
    `;

    return this.db.prepare(sql).all(startDate, endDate);
  }

  public getInventoryValuationReport(options: ReportFilterOptions) {
    const isOwner = options.userRole === 'Owner' || !options.userRole;

    const selectFields = isOwner
      ? `p.id, p.name_en, p.sku, p.avg_cost, p.selling_price, COALESCE(b.quantity_on_hand, 0) as stock_qty,
         (COALESCE(b.quantity_on_hand, 0) * p.avg_cost) as total_cost_value,
         (COALESCE(b.quantity_on_hand, 0) * p.selling_price) as total_retail_value`
      : `p.id, p.name_en, p.sku, p.selling_price, COALESCE(b.quantity_on_hand, 0) as stock_qty,
         (COALESCE(b.quantity_on_hand, 0) * p.selling_price) as total_retail_value`;

    const sql = `
      SELECT ${selectFields}
      FROM products p
      LEFT JOIN inventory_balances b ON p.id = b.product_id
      WHERE (p.deleted_at IS NULL OR p.deleted_at = '') AND p.is_active = 1
      ORDER BY p.name_en ASC
    `;

    return this.db.prepare(sql).all();
  }

  public getFinancialReport(options: ReportFilterOptions) {
    if (options.userRole && options.userRole !== 'Owner') {
      throw new Error('Access Denied: Financial P&L statements are restricted to Business Owners.');
    }

    const startDate =
      options.startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const endDate = options.endDate || new Date().toISOString().slice(0, 10);

    const salesStmt = this.db.prepare(`
      SELECT
        COALESCE(SUM(grand_total), 0) as totalRevenue,
        COALESCE(SUM(tax_total), 0) as totalTax,
        COALESCE(SUM(item_discount + order_discount), 0) as totalDiscounts
      FROM sales_orders
      WHERE payment_status = 'Paid' AND date(created_at) BETWEEN ? AND ?
    `);
    const salesRes = salesStmt.get(startDate, endDate) as {
      totalRevenue: number;
      totalTax: number;
      totalDiscounts: number;
    };

    const cogsStmt = this.db.prepare(`
      SELECT COALESCE(SUM(i.quantity * i.cost_price), 0) as cogs
      FROM sales_order_items i
      JOIN sales_orders s ON i.sale_id = s.id
      WHERE s.payment_status = 'Paid' AND date(s.created_at) BETWEEN ? AND ?
    `);
    const cogsRes = cogsStmt.get(startDate, endDate) as { cogs: number };
    const cogs = cogsRes.cogs || 0;

    const grossProfit = Math.round((salesRes.totalRevenue - cogs) * 100) / 100;
    const expenses = 0; // Operating expenses placeholder
    const netProfit = Math.round((grossProfit - expenses) * 100) / 100;
    const profitMarginPercent =
      salesRes.totalRevenue > 0 ? Math.round((netProfit / salesRes.totalRevenue) * 10000) / 100 : 0;

    return {
      revenue: salesRes.totalRevenue,
      cogs,
      grossProfit,
      expenses,
      netProfit,
      profitMarginPercent,
      taxCollected: salesRes.totalTax,
      discountsGiven: salesRes.totalDiscounts,
    };
  }
}
