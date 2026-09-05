import Database from 'better-sqlite3';
import { logger } from './logger.service';
import { SettingsRepository } from '../database/repositories/settings.repository';
import { BusinessRepository } from '../database/repositories/business.repository';
import { LicensingService } from './licensing.service';

export interface StoreSyncSnapshot {
  storeName: string;
  timestamp: string;
  currency: string;
  today: {
    date: string;
    revenue: number;
    orderCount: number;
    grossProfit: number;
    cashAmount: number;
    mobileMoneyAmount: number;
    creditAmount: number;
    expensesTotal: number;
    netProfit: number;
  };
  debts: {
    totalOutstanding: number;
    debtorsCount: number;
    records: Array<{
      id: string;
      invoiceNumber: string;
      customerName: string;
      customerPhone?: string;
      dueDate?: string;
      totalAmount: number;
      paidAmount: number;
      dueAmount: number;
      createdAt: string;
    }>;
  };
  stockAlerts: {
    outOfStockCount: number;
    lowStockCount: number;
    items: Array<{
      id: string;
      name: string;
      currentStock: number;
      reorderLevel: number;
      unit: string;
      status: 'out_of_stock' | 'low_stock';
    }>;
  };
  recentSales: Array<{
    id: string;
    invoiceNumber: string;
    grandTotal: number;
    paymentMethod: string;
    customerName?: string;
    createdAt: string;
  }>;
  recentExpenses: Array<{
    id: string;
    title: string;
    category: string;
    amount: number;
    paymentMethod: string;
    expenseDate: string;
  }>;
}

export const DEFAULT_SYNC_URL = 'https://zabad.vercel.app/api/sync';
export const DEFAULT_SYNC_KEY = 'zabad-secret-key-2026';

export class CloudSyncService {
  private db: Database.Database;
  private settingsRepo: SettingsRepository;
  private businessRepo: BusinessRepository;
  private licensingService: LicensingService;

  constructor(db: Database.Database) {
    this.db = db;
    this.settingsRepo = new SettingsRepository(db);
    this.businessRepo = new BusinessRepository(db);
    this.licensingService = new LicensingService(db);
  }

  public getSyncConfig(): {
    enabled: boolean;
    syncUrl: string;
    syncKey: string;
    lastSyncAt: string | null;
    lastStatus: string | null;
  } {
    const biz = this.businessRepo.getActiveBusiness();
    const bizId = biz ? biz.id : 'biz_default';
    const settings = this.settingsRepo.getSettingsByCategory(bizId, 'cloud_sync');

    return {
      enabled: settings.cloud_sync_enabled !== 'false',
      syncUrl: settings.cloud_sync_url || DEFAULT_SYNC_URL,
      syncKey: settings.cloud_sync_key || DEFAULT_SYNC_KEY,
      lastSyncAt: settings.cloud_sync_last_at || null,
      lastStatus: settings.cloud_sync_last_status || null,
    };
  }

  public updateSyncConfig(config: { enabled: boolean; syncUrl: string; syncKey: string }): void {
    const biz = this.businessRepo.getActiveBusiness();
    const bizId = biz ? biz.id : 'biz_default';

    this.settingsRepo.setCategorySettings(bizId, 'cloud_sync', {
      cloud_sync_enabled: config.enabled ? 'true' : 'false',
      cloud_sync_url: config.syncUrl.trim(),
      cloud_sync_key: config.syncKey.trim(),
    });
  }

  public buildSnapshot(): StoreSyncSnapshot {
    const biz = this.businessRepo.getActiveBusiness();
    const storeName = biz?.name || 'Zabad Seafood';
    const currency = biz?.currency === 'USD' ? 'FCFA' : (biz?.currency || 'FCFA');
    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Today Sales
    const salesStmt = this.db.prepare(`
      SELECT
        COUNT(id) as orderCount,
        COALESCE(SUM(grand_total), 0) as revenue,
        COALESCE(SUM(CASE WHEN payment_method IN ('Cash', 'cash') THEN grand_total ELSE 0 END), 0) as cashAmount,
        COALESCE(SUM(CASE WHEN payment_method IN ('MOMO', 'OM', 'Orange Money', 'MTN Momo') THEN grand_total ELSE 0 END), 0) as mobileMoneyAmount,
        COALESCE(SUM(CASE WHEN payment_method IN ('Borrow', 'Credit') THEN grand_total ELSE 0 END), 0) as creditAmount
      FROM sales_orders
      WHERE date(created_at) = date(?) AND payment_status != 'Cancelled'
    `);
    const salesData = salesStmt.get(todayStr) as {
      orderCount: number;
      revenue: number;
      cashAmount: number;
      mobileMoneyAmount: number;
      creditAmount: number;
    };

    // COGS for today
    const cogsStmt = this.db.prepare(`
      SELECT COALESCE(SUM(i.quantity * i.cost_price), 0) as cogs
      FROM sales_order_items i
      JOIN sales_orders s ON i.sale_id = s.id
      WHERE date(s.created_at) = date(?) AND s.payment_status != 'Cancelled'
    `);
    const cogsData = cogsStmt.get(todayStr) as { cogs: number };
    const grossProfit = Math.max(0, (salesData.revenue || 0) - (cogsData.cogs || 0));

    // 2. Today Expenses
    let expensesTotal = 0;
    let recentExpenses: Array<any> = [];
    try {
      const expTotalStmt = this.db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE date(expense_date) = date(?) OR date(created_at) = date(?)
      `);
      const expRes = expTotalStmt.get(todayStr, todayStr) as { total: number };
      expensesTotal = expRes?.total || 0;

      const expListStmt = this.db.prepare(`
        SELECT id, title, category, amount, payment_method, expense_date
        FROM expenses
        ORDER BY created_at DESC LIMIT 10
      `);
      recentExpenses = expListStmt.all().map((e: any) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        amount: Number(e.amount),
        paymentMethod: e.payment_method,
        expenseDate: e.expense_date,
      }));
    } catch {
      // expenses table might be empty
    }

    const netProfit = grossProfit - expensesTotal;

    // 3. Customer Debts / Borrow
    let totalOutstanding = 0;
    const debtRecords: Array<any> = [];
    try {
      const debtStmt = this.db.prepare(`
        SELECT id, invoice_number, customer_name, customer_phone, due_date, grand_total, paid_amount, created_at
        FROM sales_orders
        WHERE (payment_status IN ('Unpaid', 'Partially paid') OR payment_method IN ('Borrow', 'Credit'))
        ORDER BY created_at DESC
      `);
      const rows = debtStmt.all() as Array<any>;
      for (const r of rows) {
        const due = Math.max(0, (r.grand_total || 0) - (r.paid_amount || 0));
        if (due > 0) {
          totalOutstanding += due;
          if (debtRecords.length < 50) {
            debtRecords.push({
              id: r.id,
              invoiceNumber: r.invoice_number,
              customerName: r.customer_name || 'Anonymous Customer',
              customerPhone: r.customer_phone || '',
              dueDate: r.due_date || '',
              totalAmount: Number(r.grand_total),
              paidAmount: Number(r.paid_amount || 0),
              dueAmount: due,
              createdAt: r.created_at,
            });
          }
        }
      }
    } catch (err) {
      logger.warn('CloudSync', 'Error retrieving debts', err);
    }

    // 4. Inventory Alerts
    const stockAlertItems: Array<any> = [];
    let outOfStockCount = 0;
    let lowStockCount = 0;
    try {
      const stockStmt = this.db.prepare(`
        SELECT
          p.id,
          p.name_en,
          COALESCE(p.reorder_level, 100) as reorder_level,
          COALESCE(b.quantity_on_hand, 0) as current_stock,
          COALESCE(u.symbol, 'Kg') as unit
        FROM products p
        LEFT JOIN inventory_balances b ON p.id = b.product_id
        LEFT JOIN units u ON p.unit_id = u.id
        WHERE (p.deleted_at IS NULL OR p.deleted_at = '') AND p.is_active = 1
        ORDER BY current_stock ASC
      `);
      const products = stockStmt.all() as Array<any>;
      for (const p of products) {
        const stock = Number(p.current_stock);
        const threshold = Number(p.reorder_level) || 100;
        if (stock <= 0) {
          outOfStockCount++;
          if (stockAlertItems.length < 50) {
            stockAlertItems.push({
              id: p.id,
              name: p.name_en,
              currentStock: stock,
              reorderLevel: threshold,
              unit: p.unit,
              status: 'out_of_stock',
            });
          }
        } else if (stock <= threshold) {
          lowStockCount++;
          if (stockAlertItems.length < 50) {
            stockAlertItems.push({
              id: p.id,
              name: p.name_en,
              currentStock: stock,
              reorderLevel: threshold,
              unit: p.unit,
              status: 'low_stock',
            });
          }
        }
      }
    } catch (err) {
      logger.warn('CloudSync', 'Error retrieving stock alerts', err);
    }

    // 5. Recent Sales
    let recentSales: Array<any> = [];
    try {
      const recentSalesStmt = this.db.prepare(`
        SELECT id, invoice_number, grand_total, payment_method, customer_name, created_at
        FROM sales_orders
        WHERE payment_status != 'Cancelled'
        ORDER BY created_at DESC LIMIT 15
      `);
      recentSales = recentSalesStmt.all().map((s: any) => ({
        id: s.id,
        invoiceNumber: s.invoice_number,
        grandTotal: Number(s.grand_total),
        paymentMethod: s.payment_method,
        customerName: s.customer_name || '',
        createdAt: s.created_at,
      }));
    } catch (err) {
      logger.warn('CloudSync', 'Error retrieving recent sales', err);
    }

    return {
      storeName,
      timestamp: new Date().toISOString(),
      currency,
      today: {
        date: todayStr,
        revenue: Number(salesData.revenue || 0),
        orderCount: Number(salesData.orderCount || 0),
        grossProfit: Number(grossProfit),
        cashAmount: Number(salesData.cashAmount || 0),
        mobileMoneyAmount: Number(salesData.mobileMoneyAmount || 0),
        creditAmount: Number(salesData.creditAmount || 0),
        expensesTotal: Number(expensesTotal),
        netProfit: Number(netProfit),
      },
      debts: {
        totalOutstanding,
        debtorsCount: debtRecords.length,
        records: debtRecords,
      },
      stockAlerts: {
        outOfStockCount,
        lowStockCount,
        items: stockAlertItems,
      },
      recentSales,
      recentExpenses,
    };
  }

  public async sync(): Promise<{ success: boolean; message: string; timestamp?: string }> {
    const config = this.getSyncConfig();
    if (!config.enabled || !config.syncUrl) {
      return { success: false, message: 'Cloud sync is disabled or Sync URL is not configured.' };
    }

    const biz = this.businessRepo.getActiveBusiness();
    const bizId = biz ? biz.id : 'biz_default';

    try {
      const snapshot = this.buildSnapshot();
      const currentDeviceId = this.licensingService.getDeviceFingerprint();
      logger.info('CloudSync', `Sending store snapshot to ${config.syncUrl} (Device: ${currentDeviceId})`);

      const response = await fetch(config.syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sync-key': config.syncKey,
          'x-device-id': currentDeviceId,
        },
        body: JSON.stringify(snapshot),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Sync server responded with HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const responseData = (await response.json().catch(() => ({}))) as any;
      if (responseData && responseData.licenseRevoked) {
        logger.warn('CloudSync', 'License has been revoked by cloud server');
        this.licensingService.revokeLicense();
      }

      const now = new Date().toISOString();
      this.settingsRepo.setCategorySettings(bizId, 'cloud_sync', {
        cloud_sync_last_at: now,
        cloud_sync_last_status: 'success',
      });
      logger.info('CloudSync', 'Store snapshot successfully uploaded');
      return { success: true, message: 'Sync completed successfully', timestamp: now };
    } catch (err: any) {
      const msg = err.message || 'Unknown network error';
      logger.warn('CloudSync', 'Sync failed', msg);
      this.settingsRepo.setCategorySettings(bizId, 'cloud_sync', {
        cloud_sync_last_status: `Error: ${msg}`,
      });
      return { success: false, message: msg };
    }
  }
}
