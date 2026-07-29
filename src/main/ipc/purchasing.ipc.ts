import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { IPC_CHANNELS } from '../../shared/ipc/channels';
import { ApiResponse, POStatus } from '../../shared/types';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { GoodsReceiptService } from '../services/goods-receipt.service';
import { PurchaseReturnService } from '../services/purchase-return.service';
import { PurchasingDashboardService } from '../services/purchasing-dashboard.service';
import { PurchaseOrderSchema, GoodsReceivingSchema, PurchaseReturnSchema } from '../../shared/validation';
import { logger } from '../services/logger.service';

export function registerPurchasingIpcHandlers(db: Database.Database): void {
  const poService = new PurchaseOrderService(db);
  const grService = new GoodsReceiptService(db);
  const prService = new PurchaseReturnService(db);
  const dashboardService = new PurchasingDashboardService(db);

  ipcMain.handle(
    IPC_CHANNELS.PURCHASE_ORDERS_LIST,
    async (_, query?: string, status?: string): Promise<ApiResponse> => {
      try {
        const res = poService.searchPurchaseOrders(query, status);
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'PO_LIST_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.PURCHASE_ORDERS_GET_BY_ID,
    async (_, id: string): Promise<ApiResponse> => {
      try {
        const res = poService.getPurchaseOrderById(id);
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'PO_GET_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.PURCHASE_ORDERS_CREATE,
    async (_, payload: unknown, userId?: string): Promise<ApiResponse> => {
      try {
        const parsed = PurchaseOrderSchema.parse(payload);
        const res = poService.createPurchaseOrder(parsed, userId);
        return { success: true, data: res };
      } catch (err) {
        logger.error('PurchasingIPC', 'Failed creating PO', err);
        return {
          success: false,
          error: { code: 'PO_CREATE_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.PURCHASE_ORDERS_UPDATE_STATUS,
    async (_, payload: { id: string; toStatus: POStatus; notes?: string }): Promise<ApiResponse> => {
      try {
        poService.updateStatus(payload.id, payload.toStatus, undefined, payload.notes);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: { code: 'PO_STATUS_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GOODS_RECEIPTS_CONFIRM,
    async (_, payload: unknown, userId?: string): Promise<ApiResponse> => {
      try {
        const parsed = GoodsReceivingSchema.parse(payload);
        const res = grService.confirmReceipt(parsed, userId);
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'GR_CONFIRM_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.PURCHASE_RETURNS_CREATE,
    async (_, payload: unknown, userId?: string): Promise<ApiResponse> => {
      try {
        const parsed = PurchaseReturnSchema.parse(payload);
        const res = prService.createReturn(parsed, userId);
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'PURCHASE_RETURN_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.PURCHASING_DASHBOARD_GET,
    async (): Promise<ApiResponse> => {
      try {
        const res = dashboardService.getDashboardMetrics();
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'PURCHASING_DASHBOARD_ERROR', message: (err as Error).message },
        };
      }
    },
  );
}
