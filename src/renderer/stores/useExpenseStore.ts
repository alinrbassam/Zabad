import { create } from 'zustand';
import { ExpenseEntity } from '@shared/types';
import { ExpenseInput } from '@shared/validation';

interface ExpenseSummary {
  total: number;
  byCategory: { category: string; total: number; count: number }[];
}

interface ExpenseState {
  expenses: ExpenseEntity[];
  summary: ExpenseSummary | null;
  isLoading: boolean;
  error: string | null;

  loadExpenses: (options?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    limit?: number;
  }) => Promise<void>;
  createExpense: (payload: ExpenseInput) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  loadSummary: (startDate?: string, endDate?: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  summary: null,
  isLoading: false,
  error: null,

  loadExpenses: async (options) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.getExpenses) {
        const res = await window.api.getExpenses(options);
        if (res.success && res.data) {
          set({ expenses: res.data });
        } else {
          set({ error: res.error?.message || 'Failed to load expenses' });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createExpense: async (payload: ExpenseInput) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.createExpense) {
        const res = await window.api.createExpense(payload);
        if (res.success) {
          await get().loadExpenses();
          await get().loadSummary();
          return true;
        } else {
          set({ error: res.error?.message || 'Failed to create expense' });
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

  deleteExpense: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.deleteExpense) {
        const res = await window.api.deleteExpense(id);
        if (res.success) {
          await get().loadExpenses();
          await get().loadSummary();
          return true;
        } else {
          set({ error: res.error?.message || 'Failed to delete expense' });
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

  loadSummary: async (startDate, endDate) => {
    try {
      if (window.api?.getExpenseSummary) {
        const res = await window.api.getExpenseSummary(startDate, endDate);
        if (res.success && res.data) {
          set({ summary: res.data });
        }
      }
    } catch (err) {
      console.error('Error loading expense summary:', err);
    }
  },
}));
