import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { IPC_CHANNELS } from '../../shared/ipc/channels';
import { ApiResponse } from '../../shared/types';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { BrandService } from '../services/brand.service';
import { UnitService } from '../services/unit.service';
import { SupplierService } from '../services/supplier.service';
import { InventoryService } from '../services/inventory.service';
import { BatchService } from '../services/batch.service';
import { ImportExportService, ImportProductRow } from '../services/import-export.service';
import {
  ProductSchema,
  RawProductSchema,
  CategorySchema,
  BrandSchema,
  UnitSchema,
  SupplierSchema,
  StockAdjustmentSchema,
  ProductInput,
  CategoryInput,
} from '../../shared/validation';
import { logger } from '../services/logger.service';

export function registerInventoryIpcHandlers(db: Database.Database): void {
  const productService = new ProductService(db);
  const categoryService = new CategoryService(db);
  const brandService = new BrandService(db);
  const unitService = new UnitService(db);
  const supplierService = new SupplierService(db);
  const inventoryService = new InventoryService(db);
  const batchService = new BatchService(db);
  const importExportService = new ImportExportService(db);

  // Products
  ipcMain.handle(
    IPC_CHANNELS.PRODUCTS_SEARCH,
    async (_, query: string, limit?: number, offset?: number): Promise<ApiResponse> => {
      try {
        const res = productService.searchProducts(query || '', limit, offset);
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'PRODUCT_SEARCH_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(IPC_CHANNELS.PRODUCTS_GET_BY_ID, async (_, id: string): Promise<ApiResponse> => {
    try {
      const res = productService.getProductById(id);
      return { success: true, data: res };
    } catch (err) {
      return {
        success: false,
        error: { code: 'PRODUCT_GET_ERROR', message: (err as Error).message },
      };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.PRODUCTS_CREATE,
    async (_, payload: unknown, userId?: string): Promise<ApiResponse> => {
      try {
        const parsed = ProductSchema.parse(payload);
        const res = productService.createProduct(parsed, userId);
        return { success: true, data: res };
      } catch (err) {
        logger.error('InventoryIPC', 'Product creation failed', err);
        return {
          success: false,
          error: { code: 'PRODUCT_CREATE_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.PRODUCTS_UPDATE,
    async (_, payload: unknown, userId?: string): Promise<ApiResponse> => {
      try {
        const parsed = RawProductSchema.partial()
          .extend({ id: RawProductSchema.shape.id.unwrap() })
          .parse(payload);
        const res = productService.updateProduct(
          parsed as Partial<ProductInput> & { id: string },
          userId,
        );
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'PRODUCT_UPDATE_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.PRODUCTS_ARCHIVE,
    async (_, id: string, userId?: string): Promise<ApiResponse> => {
      try {
        productService.archiveProduct(id, userId);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: { code: 'PRODUCT_ARCHIVE_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  // Categories
  ipcMain.handle(IPC_CHANNELS.CATEGORIES_LIST, async (): Promise<ApiResponse> => {
    try {
      const res = categoryService.getAllCategories();
      return { success: true, data: res };
    } catch (err) {
      return {
        success: false,
        error: { code: 'CATEGORIES_LIST_ERROR', message: (err as Error).message },
      };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.CATEGORIES_CREATE,
    async (_, payload: unknown): Promise<ApiResponse> => {
      try {
        const parsed = CategorySchema.parse(payload);
        const res = categoryService.createCategory(parsed);
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'CATEGORY_CREATE_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.CATEGORIES_UPDATE,
    async (_, payload: unknown): Promise<ApiResponse> => {
      try {
        const parsed = CategorySchema.partial()
          .extend({ id: CategorySchema.shape.id.unwrap() })
          .parse(payload);
        const res = categoryService.updateCategory(
          parsed as Partial<CategoryInput> & { id: string },
        );
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'CATEGORY_UPDATE_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(IPC_CHANNELS.CATEGORIES_DELETE, async (_, id: string): Promise<ApiResponse> => {
    try {
      categoryService.deleteCategory(id);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: { code: 'CATEGORY_DELETE_ERROR', message: (err as Error).message },
      };
    }
  });

  // Brands
  ipcMain.handle(IPC_CHANNELS.BRANDS_LIST, async (): Promise<ApiResponse> => {
    try {
      const res = brandService.getAllBrands();
      return { success: true, data: res };
    } catch (err) {
      return {
        success: false,
        error: { code: 'BRANDS_LIST_ERROR', message: (err as Error).message },
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.BRANDS_CREATE, async (_, payload: unknown): Promise<ApiResponse> => {
    try {
      const parsed = BrandSchema.parse(payload);
      const res = brandService.createBrand(parsed);
      return { success: true, data: res };
    } catch (err) {
      return {
        success: false,
        error: { code: 'BRAND_CREATE_ERROR', message: (err as Error).message },
      };
    }
  });

  // Units
  ipcMain.handle(IPC_CHANNELS.UNITS_LIST, async (): Promise<ApiResponse> => {
    try {
      const res = unitService.getAllUnits();
      return { success: true, data: res };
    } catch (err) {
      return {
        success: false,
        error: { code: 'UNITS_LIST_ERROR', message: (err as Error).message },
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.UNITS_CREATE, async (_, payload: unknown): Promise<ApiResponse> => {
    try {
      const parsed = UnitSchema.parse(payload);
      const res = unitService.createUnit(parsed);
      return { success: true, data: res };
    } catch (err) {
      return {
        success: false,
        error: { code: 'UNIT_CREATE_ERROR', message: (err as Error).message },
      };
    }
  });

  // Suppliers
  ipcMain.handle(IPC_CHANNELS.SUPPLIERS_LIST, async (): Promise<ApiResponse> => {
    try {
      const res = supplierService.getAllSuppliers();
      return { success: true, data: res };
    } catch (err) {
      return {
        success: false,
        error: { code: 'SUPPLIERS_LIST_ERROR', message: (err as Error).message },
      };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.SUPPLIERS_CREATE,
    async (_, payload: unknown): Promise<ApiResponse> => {
      try {
        const parsed = SupplierSchema.parse(payload);
        const res = supplierService.createSupplier(parsed);
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'SUPPLIER_CREATE_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  // Stock & Dashboard
  ipcMain.handle(IPC_CHANNELS.STOCK_GET_SUMMARY, async (): Promise<ApiResponse> => {
    try {
      const res = inventoryService.getInventorySummary();
      return { success: true, data: res };
    } catch (err) {
      return {
        success: false,
        error: { code: 'STOCK_SUMMARY_ERROR', message: (err as Error).message },
      };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.STOCK_LIST_MOVEMENTS,
    async (_, productId?: string, limit?: number): Promise<ApiResponse> => {
      try {
        const res = inventoryService.getMovements(productId, limit);
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'STOCK_MOVEMENTS_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.STOCK_CREATE_ADJUSTMENT,
    async (_, payload: unknown, userId?: string): Promise<ApiResponse> => {
      try {
        const parsed = StockAdjustmentSchema.parse(payload);
        const res = inventoryService.createAdjustment(parsed, userId);
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'STOCK_ADJUSTMENT_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  // Batches & Expiry
  ipcMain.handle(IPC_CHANNELS.BATCHES_LIST, async (_, productId: string): Promise<ApiResponse> => {
    try {
      const res = batchService.getBatchesByProduct(productId);
      return { success: true, data: res };
    } catch (err) {
      return {
        success: false,
        error: { code: 'BATCHES_LIST_ERROR', message: (err as Error).message },
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.EXPIRY_LIST, async (_, daysWindow?: number): Promise<ApiResponse> => {
    try {
      const res = batchService.getExpiringBatches(daysWindow || 30);
      return { success: true, data: res };
    } catch (err) {
      return {
        success: false,
        error: { code: 'EXPIRY_LIST_ERROR', message: (err as Error).message },
      };
    }
  });

  // Import / Export
  ipcMain.handle(
    IPC_CHANNELS.IMPORT_PRODUCTS,
    async (_, rows: ImportProductRow[], userId?: string): Promise<ApiResponse> => {
      try {
        const res = importExportService.importProductsFromRows(rows, userId);
        return { success: true, data: res };
      } catch (err) {
        return {
          success: false,
          error: { code: 'IMPORT_PRODUCTS_ERROR', message: (err as Error).message },
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.EXPORT_PRODUCTS,
    async (_, query?: string, includeCost?: boolean): Promise<ApiResponse> => {
      try {
        const products = productService.searchProducts(query || '', 10000, 0);
        const csv = importExportService.exportProductsToCsv(products, includeCost !== false);
        return { success: true, data: csv };
      } catch (err) {
        return {
          success: false,
          error: { code: 'EXPORT_PRODUCTS_ERROR', message: (err as Error).message },
        };
      }
    },
  );
}
