import { create } from 'zustand';
import { InventoryMovementEntity, BatchEntity } from '@shared/types';
import { StockAdjustmentInput } from '@shared/validation';

export interface StockSummary {
  totalProducts: number;
  totalStockQty: number;
  totalCostValue: number;
  totalSellingValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiredCount: number;
  expiringSoonCount: number;
}

interface InventoryState {
  summary: StockSummary | null;
  movements: InventoryMovementEntity[];
  expiringBatches: BatchEntity[];
  isLoading: boolean;
  error: string | null;

  loadSummary: () => Promise<void>;
  loadMovements: (productId?: string) => Promise<void>;
  loadExpiringBatches: (daysWindow?: number) => Promise<void>;
  createAdjustment: (input: StockAdjustmentInput, userId?: string) => Promise<boolean>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  summary: null,
  movements: [],
  expiringBatches: [],
  isLoading: false,
  error: null,

  loadSummary: async () => {
    try {
      if (window.api?.getStockSummary) {
        const res = await window.api.getStockSummary();
        if (res.success && res.data) {
          set({ summary: res.data as StockSummary });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  loadMovements: async (productId?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.getStockMovements) {
        const res = await window.api.getStockMovements(productId, 100);
        if (res.success && res.data) {
          set({ movements: res.data as InventoryMovementEntity[] });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadExpiringBatches: async (daysWindow = 30) => {
    try {
      if (window.api?.getExpiringBatches) {
        const res = await window.api.getExpiringBatches(daysWindow);
        if (res.success && res.data) {
          set({ expiringBatches: res.data as BatchEntity[] });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  createAdjustment: async (input: StockAdjustmentInput, userId?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.createStockAdjustment) {
        const res = await window.api.createStockAdjustment(input, userId);
        if (res.success) {
          await get().loadSummary();
          await get().loadMovements();
          return true;
        } else {
          set({ error: res.error?.message || 'Stock adjustment failed' });
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
}));
