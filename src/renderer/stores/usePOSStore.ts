import { create } from 'zustand';
import { ProductEntity, SalesOrderEntity, SuspendedSaleEntity } from '@shared/types';
import { POSCheckoutInput, POSRefundInput } from '@shared/validation';

export interface CartItem {
  product: ProductEntity;
  batchId?: string;
  unitId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

interface POSState {
  cart: CartItem[];
  orderDiscount: number;
  amountTendered: number;
  customerId: string;
  notes: string;
  suspendedSales: SuspendedSaleEntity[];
  salesHistory: SalesOrderEntity[];
  selectedSale: (SalesOrderEntity & { items: unknown[] }) | null;
  isLoading: boolean;
  error: string | null;

  addToCart: (product: ProductEntity, qty?: number) => void;
  removeFromCart: (index: number) => void;
  updateCartItem: (index: number, key: keyof CartItem, val: unknown) => void;
  debts: SalesOrderEntity[];
  clearCart: () => void;
  setOrderDiscount: (discount: number) => void;
  setAmountTendered: (amount: number) => void;
  checkout: (
    payments: {
      paymentMethod: 'Cash' | 'Card' | 'Digital Wallet' | 'Store Credit' | 'Borrow' | 'Credit' | string;
      amount: number;
      referenceNumber?: string;
    }[],
    cashierId?: string,
    customerDetails?: {
      customerName?: string;
      customerPhone?: string;
      dueDate?: string;
      notes?: string;
    },
  ) => Promise<SalesOrderEntity | null>;
  holdCurrentSale: (referenceName: string, cashierId?: string) => Promise<boolean>;
  loadSuspendedSales: () => Promise<void>;
  resumeSale: (id: string) => Promise<boolean>;
  loadSalesHistory: (query?: string) => Promise<void>;
  loadDebts: (query?: string) => Promise<void>;
  settleDebt: (
    saleId: string,
    amount: number,
    paymentMethod?: string,
    notes?: string,
    cashierId?: string,
  ) => Promise<boolean>;
  loadSaleById: (id: string) => Promise<void>;
  processRefund: (payload: POSRefundInput, userId?: string) => Promise<boolean>;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  orderDiscount: 0,
  amountTendered: 0,
  customerId: '',
  notes: '',
  suspendedSales: [],
  salesHistory: [],
  debts: [],
  selectedSale: null,
  isLoading: false,
  error: null,

  addToCart: (product: ProductEntity, qty = 1) => {
    const existingIdx = get().cart.findIndex((item) => item.product.id === product.id);
    if (existingIdx >= 0) {
      const updated = [...get().cart];
      updated[existingIdx].quantity += qty;
      set({ cart: updated });
    } else {
      const newItem: CartItem = {
        product,
        unitId: product.base_unit_id,
        quantity: qty,
        unitPrice: product.selling_price || 0,
        discount: 0,
        taxRate: product.is_tax_exempt ? 0 : product.tax_rate || 0,
      };
      set({ cart: [...get().cart, newItem] });
    }
  },

  removeFromCart: (index: number) => {
    set({ cart: get().cart.filter((_, idx) => idx !== index) });
  },

  updateCartItem: (index: number, key: keyof CartItem, val: unknown) => {
    const updated = [...get().cart];
    updated[index] = { ...updated[index], [key]: val };
    set({ cart: updated });
  },

  clearCart: () => {
    set({ cart: [], orderDiscount: 0, amountTendered: 0, notes: '' });
  },

  setOrderDiscount: (discount: number) => set({ orderDiscount: discount }),
  setAmountTendered: (amount: number) => set({ amountTendered: amount }),

  checkout: async (payments, cashierId, customerDetails) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.posCheckout) {
        const payload: POSCheckoutInput = {
          customerId: get().customerId || undefined,
          customerName: customerDetails?.customerName,
          customerPhone: customerDetails?.customerPhone,
          dueDate: customerDetails?.dueDate,
          notes: customerDetails?.notes || get().notes || undefined,
          orderDiscount: get().orderDiscount,
          amountTendered: get().amountTendered,
          items: get().cart.map((item) => ({
            productId: item.product.id,
            batchId: item.batchId,
            unitId: item.unitId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
          })),
          payments: payments as POSCheckoutInput['payments'],
        };

        const res = await window.api.posCheckout(payload, cashierId);
        if (res.success && res.data) {
          get().clearCart();
          return res.data;
        } else {
          set({ error: res.error?.message || 'Checkout failed' });
        }
      }
      return null;
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  holdCurrentSale: async (referenceName, cashierId) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.posHoldSale) {
        const payload = {
          referenceName,
          items: get().cart.map((i) => ({
            productId: i.product.id,
            batchId: i.batchId,
            unitId: i.unitId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount,
            taxRate: i.taxRate,
          })),
          notes: get().notes,
        };

        const res = await window.api.posHoldSale(payload, cashierId);
        if (res.success) {
          get().clearCart();
          await get().loadSuspendedSales();
          return true;
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

  loadSuspendedSales: async () => {
    try {
      if (window.api?.getSuspendedSales) {
        const res = await window.api.getSuspendedSales();
        if (res.success && res.data) {
          set({ suspendedSales: res.data });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  resumeSale: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.resumeSuspendedSale) {
        const res = await window.api.resumeSuspendedSale(id);
        if (res.success && res.data) {
          set({ cart: res.data.items as CartItem[] });
          await get().loadSuspendedSales();
          return true;
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

  loadSalesHistory: async (query = '') => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.getSalesList) {
        const res = await window.api.getSalesList(query);
        if (res.success && res.data) {
          set({ salesHistory: res.data });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadDebts: async (query = '') => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.getDebtsList) {
        const res = await window.api.getDebtsList(query);
        if (res.success && res.data) {
          set({ debts: res.data });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  settleDebt: async (saleId: string, amount: number, paymentMethod = 'Cash', notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.settleDebt) {
        const res = await window.api.settleDebt({
          saleId,
          amount,
          paymentMethod,
          notes,
        });
        if (res.success) {
          await get().loadDebts();
          await get().loadSalesHistory();
          return true;
        } else {
          set({ error: res.error?.message || 'Debt settlement failed' });
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

  loadSaleById: async (id: string) => {
    try {
      if (window.api?.getSaleById) {
        const res = await window.api.getSaleById(id);
        if (res.success && res.data) {
          set({ selectedSale: res.data });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  processRefund: async (payload, userId) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.posRefund) {
        const res = await window.api.posRefund(payload, userId);
        if (res.success) {
          await get().loadSalesHistory();
          return true;
        } else {
          set({ error: res.error?.message || 'Refund failed' });
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
