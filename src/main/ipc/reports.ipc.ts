import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { IPC_CHANNELS } from '../../shared/ipc/channels';
import { ApiResponse } from '../../shared/types';
import { ReportsService, ReportFilterOptions } from '../services/reports.service';
import { ReportExportService } from '../services/report-export.service';
import { logger } from '../services/logger.service';

export function registerReportsIpcHandlers(db: Database.Database): void {
  const reportsService = new ReportsService(db);
  const exportService = new ReportExportService();

  ipcMain.handle(IPC_CHANNELS.REPORTS_DASHBOARD, async (_, options: ReportFilterOptions): Promise<ApiResponse> => {
    try {
      const res = reportsService.getDashboardMetrics(options);
      return { success: true, data: res };
    } catch (err) {
      logger.error('ReportsIPC', 'Failed getting dashboard metrics', err);
      return { success: false, error: { code: 'REPORTS_DASHBOARD_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.REPORTS_SALES, async (_, options: ReportFilterOptions): Promise<ApiResponse> => {
    try {
      const res = reportsService.getSalesReport(options);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'REPORTS_SALES_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.REPORTS_PRODUCTS, async (_, options: ReportFilterOptions): Promise<ApiResponse> => {
    try {
      const res = reportsService.getProductPerformanceReport(options);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'REPORTS_PRODUCTS_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.REPORTS_INVENTORY, async (_, options: ReportFilterOptions): Promise<ApiResponse> => {
    try {
      const res = reportsService.getInventoryValuationReport(options);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'REPORTS_INVENTORY_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.REPORTS_FINANCIAL, async (_, options: ReportFilterOptions): Promise<ApiResponse> => {
    try {
      const res = reportsService.getFinancialReport(options);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'REPORTS_FINANCIAL_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.REPORTS_EXPORT_CSV, async (_, data: Record<string, unknown>[]): Promise<ApiResponse<string>> => {
    try {
      const csvStr = exportService.exportToCsv(data);
      return { success: true, data: csvStr };
    } catch (err) {
      return { success: false, error: { code: 'REPORTS_EXPORT_ERROR', message: (err as Error).message } };
    }
  });
}
