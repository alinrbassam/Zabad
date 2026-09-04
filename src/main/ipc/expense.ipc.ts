import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { IPC_CHANNELS } from '../../shared/ipc/channels';
import { ApiResponse } from '../../shared/types';
import { ExpenseService } from '../services/expense.service';
import { CloudSyncService } from '../services/cloud-sync.service';
import { ExpenseSchema } from '../../shared/validation';
import { logger } from '../services/logger.service';

export function registerExpenseIpcHandlers(db: Database.Database): void {
  const expenseService = new ExpenseService(db);
  const cloudSync = new CloudSyncService(db);

  ipcMain.handle(
    IPC_CHANNELS.EXPENSES_LIST,
    async (
      _,
      options?: { startDate?: string; endDate?: string; category?: string; limit?: number },
    ): Promise<ApiResponse> => {
      try {
        const res = expenseService.listExpenses(options);
        return { success: true, data: res };
      } catch (err) {
        logger.error('ExpenseIPC', 'Failed to list expenses', err);
        return {
          success: false,
          error: { code: 'EXPENSES_LIST_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.EXPENSES_CREATE,
    async (_, payload: unknown, userId?: string): Promise<ApiResponse> => {
      try {
        const parsed = ExpenseSchema.parse(payload);
        const res = expenseService.createExpense(parsed, userId);
        cloudSync.sync().catch((err) => logger.warn('CloudSync', 'Auto-sync after expense creation failed', err));
        return { success: true, data: res };
      } catch (err) {
        logger.error('ExpenseIPC', 'Failed to create expense', err);
        return {
          success: false,
          error: { code: 'EXPENSES_CREATE_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.EXPENSES_DELETE,
    async (_, id: string, userId?: string): Promise<ApiResponse> => {
      try {
        const res = expenseService.deleteExpense(id, userId);
        cloudSync.sync().catch((err) => logger.warn('CloudSync', 'Auto-sync after expense deletion failed', err));
        return { success: true, data: res };
      } catch (err) {
        logger.error('ExpenseIPC', 'Failed to delete expense', err);
        return {
          success: false,
          error: { code: 'EXPENSES_DELETE_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.EXPENSES_SUMMARY,
    async (_, startDate?: string, endDate?: string): Promise<ApiResponse> => {
      try {
        const res = expenseService.getSummary(startDate, endDate);
        return { success: true, data: res };
      } catch (err) {
        logger.error('ExpenseIPC', 'Failed to get expense summary', err);
        return {
          success: false,
          error: { code: 'EXPENSES_SUMMARY_ERROR', message: (err as Error).message },
        };
      }
    },
  );
}
