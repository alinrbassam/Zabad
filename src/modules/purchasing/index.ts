import { RMSModule } from '@shared/types/module';
import { PurchasingDashboardPage } from './PurchasingDashboardPage';
import { PurchaseOrdersPage } from './PurchaseOrdersPage';
import { PurchaseOrderFormPage } from './PurchaseOrderFormPage';
import { PurchaseOrderDetailsPage } from './PurchaseOrderDetailsPage';
import { GoodsReceivingPage } from './GoodsReceivingPage';
import { DirectPurchasePage } from './DirectPurchasePage';
import { SupplierInvoicesPage } from './SupplierInvoicesPage';
import { PurchaseReturnsPage } from './PurchaseReturnsPage';
import { PendingDeliveriesPage } from './PendingDeliveriesPage';
import { PurchasingHistoryPage } from './PurchasingHistoryPage';
import { PurchasingSettingsPage } from './PurchasingSettingsPage';

export const PurchasingModule: RMSModule = {
  id: 'purchasing',
  name: 'Purchasing & Suppliers',
  description:
    'Purchase orders, receiving workflows, direct purchases, vendor invoices, weighted cost engine, and returns.',
  version: '1.0.0',
  icon: 'ShoppingBag',
  routes: [
    {
      path: '/purchasing',
      component: PurchasingDashboardPage,
      requiredPermission: 'purchasing.view',
    },
    {
      path: '/purchasing/orders',
      component: PurchaseOrdersPage,
      requiredPermission: 'purchase_orders.view',
    },
    {
      path: '/purchasing/orders/new',
      component: PurchaseOrderFormPage,
      requiredPermission: 'purchase_orders.create',
    },
    {
      path: '/purchasing/orders/:id',
      component: PurchaseOrderDetailsPage,
      requiredPermission: 'purchase_orders.view',
    },
    {
      path: '/purchasing/receiving',
      component: GoodsReceivingPage,
      requiredPermission: 'goods_receipts.create',
    },
    {
      path: '/purchasing/direct',
      component: DirectPurchasePage,
      requiredPermission: 'direct_purchases.create',
    },
    {
      path: '/purchasing/invoices',
      component: SupplierInvoicesPage,
      requiredPermission: 'supplier_invoices.view',
    },
    {
      path: '/purchasing/returns',
      component: PurchaseReturnsPage,
      requiredPermission: 'purchase_returns.create',
    },
    {
      path: '/purchasing/pending',
      component: PendingDeliveriesPage,
      requiredPermission: 'purchase_orders.view',
    },
    {
      path: '/purchasing/history',
      component: PurchasingHistoryPage,
      requiredPermission: 'purchasing.view',
    },
    {
      path: '/purchasing/settings',
      component: PurchasingSettingsPage,
      requiredPermission: 'purchasing_settings.manage',
    },
  ],
  sidebarItems: [
    {
      id: 'purchasing-dashboard',
      labelKey: 'purchasing_dashboard',
      icon: 'LayoutDashboard',
      path: '/purchasing',
      order: 20,
      requiredPermission: 'purchasing.view',
    },
    {
      id: 'purchase-orders',
      labelKey: 'purchase_orders',
      icon: 'ShoppingCart',
      path: '/purchasing/orders',
      order: 21,
      requiredPermission: 'purchase_orders.view',
    },
    {
      id: 'goods-receiving',
      labelKey: 'goods_receiving',
      icon: 'Truck',
      path: '/purchasing/receiving',
      order: 22,
      requiredPermission: 'goods_receipts.create',
    },
    {
      id: 'direct-purchases',
      labelKey: 'direct_purchases',
      icon: 'Store',
      path: '/purchasing/direct',
      order: 23,
      requiredPermission: 'direct_purchases.create',
    },
    {
      id: 'supplier-invoices',
      labelKey: 'supplier_invoices',
      icon: 'Receipt',
      path: '/purchasing/invoices',
      order: 24,
      requiredPermission: 'supplier_invoices.view',
    },
    {
      id: 'purchase-returns',
      labelKey: 'purchase_returns',
      icon: 'Undo2',
      path: '/purchasing/returns',
      order: 25,
      requiredPermission: 'purchase_returns.create',
    },
    {
      id: 'pending-deliveries',
      labelKey: 'pending_deliveries',
      icon: 'Clock',
      path: '/purchasing/pending',
      order: 26,
      requiredPermission: 'purchase_orders.view',
    },
    {
      id: 'purchasing-history',
      labelKey: 'purchasing_history',
      icon: 'History',
      path: '/purchasing/history',
      order: 27,
      requiredPermission: 'purchasing.view',
    },
    {
      id: 'purchasing-settings',
      labelKey: 'purchasing_settings',
      icon: 'Settings',
      path: '/purchasing/settings',
      order: 28,
      requiredPermission: 'purchasing_settings.manage',
    },
  ],
  permissions: [
    'purchasing.view',
    'purchasing.dashboard',
    'purchase_orders.view',
    'purchase_orders.create',
    'purchase_orders.edit',
    'purchase_orders.submit',
    'purchase_orders.approve',
    'purchase_orders.cancel',
    'purchase_orders.print',
    'goods_receipts.view',
    'goods_receipts.create',
    'goods_receipts.confirm',
    'goods_receipts.reverse',
    'direct_purchases.create',
    'supplier_invoices.view',
    'supplier_invoices.manage',
    'purchase_returns.view',
    'purchase_returns.create',
    'purchase_returns.approve',
    'purchase_returns.complete',
    'purchase_costs.view',
    'purchase_costs.edit',
    'purchase_attachments.view',
    'purchase_attachments.manage',
    'purchasing_settings.manage',
  ],
  translations: {
    en: {
      purchasing_dashboard: 'Purchasing Dashboard',
      purchase_orders: 'Purchase Orders',
      goods_receiving: 'Goods Receiving',
      direct_purchases: 'Direct Purchases',
      supplier_invoices: 'Supplier Invoices',
      purchase_returns: 'Purchase Returns',
      pending_deliveries: 'Pending Deliveries',
      purchasing_history: 'Purchasing History',
      purchasing_settings: 'Purchasing Settings',
    },
    ar: {
      purchasing_dashboard: 'لوحة أداء المشتريات',
      purchase_orders: 'أوامر الشراء',
      goods_receiving: 'استلام البضائع',
      direct_purchases: 'المشتريات المباشرة',
      supplier_invoices: 'فواتير الموردين',
      purchase_returns: 'مرتجعات الموردين',
      pending_deliveries: 'تسليمات معلقة',
      purchasing_history: 'سجل المشتريات',
      purchasing_settings: 'إعدادات المشتريات',
    },
  },
};
