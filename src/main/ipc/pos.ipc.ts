import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { IPC_CHANNELS } from '../../shared/ipc/channels';
import { ApiResponse } from '../../shared/types';
import { POSSalesService } from '../services/pos-sales.service';
import { POSSuspendedService } from '../services/pos-suspended.service';
import { POSRefundService } from '../services/pos-refund.service';
import { POSCheckoutSchema, POSRefundSchema } from '../../shared/validation';
import { logger } from '../services/logger.service';

export function registerPOSIpcHandlers(db: Database.Database): void {
  const posSalesService = new POSSalesService(db);
  const posSuspendedService = new POSSuspendedService(db);
  const posRefundService = new POSRefundService(db);

  ipcMain.handle(
    IPC_CHANNELS.POS_CHECKOUT,
    async (_, payload: unknown, cashierId?: string): Promise<ApiResponse> => {
      try {
        const parsed = POSCheckoutSchema.parse(payload);
        const res = posSalesService.processCheckout(parsed, cashierId);
        return { success: true, data: res };
      } catch (err) {
        logger.error('POSIPC', 'Checkout failed', err);
        return {
          success: false,
          error: { code: 'POS_CHECKOUT_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.POS_SALES_LIST,
    async (_, query?: string): Promise<ApiResponse> => {
      try {
        const res = posSalesService.getSalesHistory(query);
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'POS_SALES_LIST_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.POS_SALES_GET_BY_ID,
    async (_, id: string): Promise<ApiResponse> => {
      try {
        const res = posSalesService.getSaleById(id);
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'POS_SALES_GET_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.POS_HOLD_SALE,
    async (_, payload: { customerName?: string; note?: string; items: unknown[] }, cashierId?: string): Promise<ApiResponse> => {
      try {
        const res = posSuspendedService.holdSale({
          referenceName: payload.customerName || 'Held Cart',
          items: payload.items as any[],
          cashierId,
          notes: payload.note,
        });
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'POS_HOLD_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.POS_SUSPENDED_LIST,
    async (): Promise<ApiResponse> => {
      try {
        const res = posSuspendedService.getSuspendedSales();
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'POS_SUSPENDED_LIST_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.POS_RESUME_SALE,
    async (_, id: string): Promise<ApiResponse> => {
      try {
        const res = posSuspendedService.resumeSale(id);
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'POS_RESUME_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.POS_REFUND,
    async (_, payload: unknown, userId?: string): Promise<ApiResponse> => {
      try {
        const parsed = POSRefundSchema.parse(payload);
        const res = posRefundService.processRefund(parsed, userId);
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'POS_REFUND_ERROR', message: (err as Error).message },
        };
      }
    },
  );
}
