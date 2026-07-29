import { create } from 'zustand';
import {
  ProductEntity,
  CategoryEntity,
  BrandEntity,
  UnitEntity,
  SupplierEntity,
} from '@shared/types';
import { ProductInput } from '@shared/validation';

interface ProductState {
  products: ProductEntity[];
  categories: CategoryEntity[];
  brands: BrandEntity[];
  units: UnitEntity[];
  suppliers: SupplierEntity[];
  isLoading: boolean;
  error: string | null;

  loadProducts: (query?: string) => Promise<void>;
  loadMetadata: () => Promise<void>;
  createProduct: (input: ProductInput, userId?: string) => Promise<boolean>;
  archiveProduct: (id: string, userId?: string) => Promise<boolean>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  brands: [],
  units: [],
  suppliers: [],
  isLoading: false,
  error: null,

  loadProducts: async (query = '') => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.searchProducts) {
        const res = await window.api.searchProducts(query, 100, 0);
        if (res.success && res.data) {
          set({ products: res.data as ProductEntity[] });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMetadata: async () => {
    try {
      if (window.api) {
        const [catRes, brandRes, unitRes, supRes] = await Promise.all([
          window.api.getCategories(),
          window.api.getBrands(),
          window.api.getUnits(),
          window.api.getSuppliers(),
        ]);

        set({
          categories: catRes.success ? (catRes.data as CategoryEntity[]) : [],
          brands: brandRes.success ? (brandRes.data as BrandEntity[]) : [],
          units: unitRes.success ? (unitRes.data as UnitEntity[]) : [],
          suppliers: supRes.success ? (supRes.data as SupplierEntity[]) : [],
        });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  createProduct: async (input: ProductInput, userId?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.createProduct) {
        const res = await window.api.createProduct(input, userId);
        if (res.success) {
          await get().loadProducts();
          return true;
        } else {
          set({ error: res.error?.message || 'Failed creating product' });
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

  archiveProduct: async (id: string, userId?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.archiveProduct) {
        const res = await window.api.archiveProduct(id, userId);
        if (res.success) {
          await get().loadProducts();
          return true;
        } else {
          set({ error: res.error?.message || 'Failed archiving product' });
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
