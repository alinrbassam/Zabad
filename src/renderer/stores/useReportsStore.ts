import { create } from 'zustand';

interface DashboardMetrics {
  totalTransactions: number;
  grossRevenue: number;
  totalDiscounts: number;
  taxCollected: number;
  averageSale: number;
  totalRefunds: number;
  lowStockCount: number;
  outOfStockCount: number;
  topProducts: { name_en: string; totalQty: number; totalAmount: number }[];
  cogs?: number;
  grossProfit?: number;
  netProfit?: number;
}

interface FinancialMetrics {
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  profitMarginPercent: number;
  taxCollected: number;
  discountsGiven: number;
}

interface ReportsState {
  startDate: string;
  endDate: string;
  dashboardMetrics: DashboardMetrics | null;
  financialMetrics: FinancialMetrics | null;
  salesData: Record<string, unknown>[];
  productData: Record<string, unknown>[];
  inventoryData: Record<string, unknown>[];
  isLoading: boolean;
  error: string | null;

  setDateRange: (startDate: string, endDate: string) => void;
  loadDashboardMetrics: (userRole?: string) => Promise<void>;
  loadSalesReport: (cashierId?: string, paymentMethod?: string) => Promise<void>;
  loadProductReport: (userRole?: string) => Promise<void>;
  loadInventoryReport: (userRole?: string) => Promise<void>;
  loadFinancialReport: (userRole?: string) => Promise<void>;
  exportCsv: (data: Record<string, unknown>[]) => Promise<string | null>;
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  startDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  dashboardMetrics: null,
  financialMetrics: null,
  salesData: [],
  productData: [],
  inventoryData: [],
  isLoading: false,
  error: null,

  setDateRange: (startDate, endDate) => set({ startDate, endDate }),

  loadDashboardMetrics: async (userRole) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.getReportsDashboard) {
        const res = await window.api.getReportsDashboard({
          startDate: get().startDate,
          endDate: get().endDate,
          userRole,
        });
        if (res.success && res.data) {
          set({ dashboardMetrics: res.data as DashboardMetrics });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadSalesReport: async (cashierId, paymentMethod) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.getSalesReport) {
        const res = await window.api.getSalesReport({
          startDate: get().startDate,
          endDate: get().endDate,
          cashierId,
          paymentMethod,
        });
        if (res.success && res.data) {
          set({ salesData: res.data as Record<string, unknown>[] });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadProductReport: async (userRole) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.getProductReport) {
        const res = await window.api.getProductReport({
          startDate: get().startDate,
          endDate: get().endDate,
          userRole,
        });
        if (res.success && res.data) {
          set({ productData: res.data as Record<string, unknown>[] });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadInventoryReport: async (userRole) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.getInventoryReport) {
        const res = await window.api.getInventoryReport({ userRole });
        if (res.success && res.data) {
          set({ inventoryData: res.data as Record<string, unknown>[] });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadFinancialReport: async (userRole) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.getFinancialReport) {
        const res = await window.api.getFinancialReport({
          startDate: get().startDate,
          endDate: get().endDate,
          userRole,
        });
        if (res.success && res.data) {
          set({ financialMetrics: res.data });
        } else {
          set({ error: res.error?.message || 'Access denied' });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  exportCsv: async (data) => {
    try {
      if (window.api?.exportReportCsv) {
        const res = await window.api.exportReportCsv(data);
        if (res.success && res.data) {
          return res.data;
        }
      }
      return null;
    } catch {
      return null;
    }
  },
}));
