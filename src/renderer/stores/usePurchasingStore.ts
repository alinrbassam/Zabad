import { create } from 'zustand';
import { PurchaseOrderEntity, PurchaseOrderItemEntity, POStatus } from '@shared/types';
import { PurchaseOrderInput, GoodsReceivingInput, PurchaseReturnInput } from '@shared/validation';

interface PurchasingMetrics {
  draftsCount: number;
  awaitingApprovalCount: number;
  orderedCount: number;
  overdueCount: number;
  monthlyPurchasesTotal: number;
  topSuppliers: { name: string; total_purchases: number }[];
}

interface PurchasingState {
  orders: (PurchaseOrderEntity & { supplier_name?: string })[];
  selectedOrder: (PurchaseOrderEntity & { items: PurchaseOrderItemEntity[] }) | null;
  dashboardMetrics: PurchasingMetrics | null;
  isLoading: boolean;
  error: string | null;

  loadOrders: (query?: string, status?: string) => Promise<void>;
  loadOrderById: (id: string) => Promise<void>;
  createOrder: (payload: PurchaseOrderInput, userId?: string) => Promise<boolean>;
  updateOrderStatus: (id: string, toStatus: POStatus, notes?: string) => Promise<boolean>;
  confirmReceipt: (payload: GoodsReceivingInput, userId?: string) => Promise<boolean>;
  createReturn: (payload: PurchaseReturnInput, userId?: string) => Promise<boolean>;
  loadDashboardMetrics: () => Promise<void>;
}

export const usePurchasingStore = create<PurchasingState>((set, get) => ({
  orders: [],
  selectedOrder: null,
  dashboardMetrics: null,
  isLoading: false,
  error: null,

  loadOrders: async (query, status) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.getPurchaseOrders) {
        const res = await window.api.getPurchaseOrders(query, status);
        if (res.success && res.data) {
          set({ orders: res.data });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadOrderById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.getPurchaseOrderById) {
        const res = await window.api.getPurchaseOrderById(id);
        if (res.success && res.data) {
          set({ selectedOrder: res.data });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createOrder: async (payload: PurchaseOrderInput, userId?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.createPurchaseOrder) {
        const res = await window.api.createPurchaseOrder(payload, userId);
        if (res.success) {
          await get().loadOrders();
          return true;
        } else {
          set({ error: res.error?.message || 'Failed creating purchase order' });
          return false;
        }
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateOrderStatus: async (id: string, toStatus: POStatus, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.updatePurchaseOrderStatus) {
        const res = await window.api.updatePurchaseOrderStatus(id, toStatus, notes);
        if (res.success) {
          await get().loadOrders();
          if (get().selectedOrder?.id === id) {
            await get().loadOrderById(id);
          }
          return true;
        } else {
          set({ error: res.error?.message || 'Failed updating order status' });
          return false;
        }
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  confirmReceipt: async (payload: GoodsReceivingInput, userId?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.confirmGoodsReceipt) {
        const res = await window.api.confirmGoodsReceipt(payload, userId);
        if (res.success) {
          await get().loadOrders();
          return true;
        } else {
          set({ error: res.error?.message || 'Failed confirming goods receipt' });
          return false;
        }
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  createReturn: async (payload: PurchaseReturnInput, userId?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.createPurchaseReturn) {
        const res = await window.api.createPurchaseReturn(payload, userId);
        if (res.success) {
          return true;
        } else {
          set({ error: res.error?.message || 'Failed creating supplier return' });
          return false;
        }
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  loadDashboardMetrics: async () => {
    try {
      if (window.api?.getPurchasingDashboard) {
        const res = await window.api.getPurchasingDashboard();
        if (res.success && res.data) {
          set({ dashboardMetrics: res.data });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
