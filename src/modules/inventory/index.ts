import { RMSModule } from '@shared/types/module';
import { InventoryDashboardPage } from './InventoryDashboardPage';
import { ProductsPage } from './ProductsPage';
import { ProductFormPage } from './ProductFormPage';
import { CategoriesPage } from './CategoriesPage';
import { BrandsPage } from './BrandsPage';
import { UnitsPage } from './UnitsPage';
import { SuppliersPage } from './SuppliersPage';
import { StockOverviewPage } from './StockOverviewPage';
import { StockAdjustmentsPage } from './StockAdjustmentsPage';
import { ExpiryManagementPage } from './ExpiryManagementPage';
import { BarcodeLabelPage } from './BarcodeLabelPage';
import { ImportExportPage } from './ImportExportPage';

export const InventoryModule: RMSModule = {
  id: 'inventory',
  name: 'Inventory & Products',
  version: '1.0.0',
  description:
    'Enterprise inventory management, product master records, stock movements, batches, expiry tracking, and barcode label printing.',
  routes: [
    { path: '/inventory', component: InventoryDashboardPage, requiredPermission: 'inventory.view' },
    { path: '/inventory/products', component: ProductsPage, requiredPermission: 'products.view' },
    {
      path: '/inventory/products/new',
      component: ProductFormPage,
      requiredPermission: 'products.create',
    },
    {
      path: '/inventory/products/edit/:id',
      component: ProductFormPage,
      requiredPermission: 'products.edit',
    },
    {
      path: '/inventory/categories',
      component: CategoriesPage,
      requiredPermission: 'categories.manage',
    },
    { path: '/inventory/brands', component: BrandsPage, requiredPermission: 'brands.manage' },
    { path: '/inventory/units', component: UnitsPage, requiredPermission: 'units.manage' },
    {
      path: '/inventory/suppliers',
      component: SuppliersPage,
      requiredPermission: 'suppliers.view',
    },
    {
      path: '/inventory/movements',
      component: StockOverviewPage,
      requiredPermission: 'stock.view',
    },
    {
      path: '/inventory/adjustments',
      component: StockAdjustmentsPage,
      requiredPermission: 'stock.adjust',
    },
    {
      path: '/inventory/expiry',
      component: ExpiryManagementPage,
      requiredPermission: 'expiry.manage',
    },
    {
      path: '/inventory/barcodes',
      component: BarcodeLabelPage,
      requiredPermission: 'barcode.print',
    },
    {
      path: '/inventory/import-export',
      component: ImportExportPage,
      requiredPermission: 'products.import',
    },
  ],
  sidebarItems: [
    {
      id: 'inventory-dashboard',
      labelKey: 'inventory_dashboard',
      icon: 'LayoutDashboard',
      path: '/inventory',
      order: 10,
      requiredPermission: 'inventory.view',
    },
    {
      id: 'products',
      labelKey: 'products_list',
      icon: 'Package',
      path: '/inventory/products',
      order: 11,
      requiredPermission: 'products.view',
    },
    {
      id: 'categories',
      labelKey: 'categories',
      icon: 'FolderTree',
      path: '/inventory/categories',
      order: 12,
      requiredPermission: 'categories.manage',
    },
    {
      id: 'brands',
      labelKey: 'brands',
      icon: 'Tag',
      path: '/inventory/brands',
      order: 13,
      requiredPermission: 'brands.manage',
    },
    {
      id: 'units',
      labelKey: 'units',
      icon: 'Scale',
      path: '/inventory/units',
      order: 14,
      requiredPermission: 'units.manage',
    },
    {
      id: 'suppliers',
      labelKey: 'suppliers',
      icon: 'Truck',
      path: '/inventory/suppliers',
      order: 15,
      requiredPermission: 'suppliers.view',
    },
    {
      id: 'stock-movements',
      labelKey: 'stock_movements',
      icon: 'Boxes',
      path: '/inventory/movements',
      order: 16,
      requiredPermission: 'stock.view',
    },
    {
      id: 'stock-adjustments',
      labelKey: 'stock_adjustments',
      icon: 'Sliders',
      path: '/inventory/adjustments',
      order: 17,
      requiredPermission: 'stock.adjust',
    },
    {
      id: 'expiry-management',
      labelKey: 'expiry_management',
      icon: 'Calendar',
      path: '/inventory/expiry',
      order: 18,
      requiredPermission: 'expiry.manage',
    },
    {
      id: 'barcode-labels',
      labelKey: 'barcode_labels',
      icon: 'Barcode',
      path: '/inventory/barcodes',
      order: 19,
      requiredPermission: 'barcode.print',
    },
    {
      id: 'import-export',
      labelKey: 'import_export',
      icon: 'FileSpreadsheet',
      path: '/inventory/import-export',
      order: 20,
      requiredPermission: 'products.import',
    },
  ],
  permissions: [
    'inventory.view',
    'inventory.manage',
    'products.view',
    'products.create',
    'products.edit',
    'products.archive',
    'products.view_cost',
    'products.change_price',
    'products.import',
    'products.export',
    'categories.manage',
    'brands.manage',
    'units.manage',
    'suppliers.view',
    'suppliers.manage',
    'stock.view',
    'stock.adjust',
    'stock.count',
    'batches.manage',
    'expiry.manage',
    'barcode.manage',
    'barcode.print',
  ],
  translations: {
    en: {
      inventory_dashboard: 'Inventory Overview',
      products_list: 'Products Catalog',
      categories: 'Categories',
      brands: 'Brands',
      units: 'Units of Measure',
      suppliers: 'Suppliers',
      stock_movements: 'Stock Movements',
      stock_adjustments: 'Stock Adjustments',
      expiry_management: 'Expiry Tracking',
      barcode_labels: 'Barcode Printing',
      import_export: 'Import / Export',
    },
    ar: {
      inventory_dashboard: 'نظرة عامة على المخزون',
      products_list: 'دليل المنتجات',
      categories: 'الأقسام والأنواع',
      brands: 'العلامات التجارية',
      units: 'وحدات القياس',
      suppliers: 'الموردين',
      stock_movements: 'حركة المخزون',
      stock_adjustments: 'تسويات المخزون',
      expiry_management: 'إدارة الصلاحية',
      barcode_labels: 'طباعة البارcode',
      import_export: 'استيراد وتصدير',
    },
  },
};
