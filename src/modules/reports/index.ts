import { RMSModule } from '@shared/types/module';
import { ReportsDashboardPage } from './ReportsDashboardPage';
import { SalesReportPage } from './SalesReportPage';
import { ProductReportPage } from './ProductReportPage';
import { InventoryReportPage } from './InventoryReportPage';
import { FinancialReportPage } from './FinancialReportPage';

export const ReportsModule: RMSModule = {
  id: 'reports',
  name: 'Reports & Analytics',
  description:
    'Owner analytics dashboard, sales breakdowns, product profit margins, inventory valuation, and P&L financial reports.',
  version: '1.0.0',
  icon: 'BarChart2',
  routes: [
    {
      path: '/reports',
      component: ReportsDashboardPage,
      requiredPermission: 'reports.view',
      exact: true,
    },
    {
      path: '/reports/sales',
      component: SalesReportPage,
      requiredPermission: 'reports.view',
      exact: true,
    },
    {
      path: '/reports/products',
      component: ProductReportPage,
      requiredPermission: 'reports.view',
      exact: true,
    },
    {
      path: '/reports/inventory',
      component: InventoryReportPage,
      requiredPermission: 'reports.view',
      exact: true,
    },
    {
      path: '/reports/financial',
      component: FinancialReportPage,
      requiredPermission: 'reports.financial',
      exact: true,
    },
  ],
  sidebarItems: [
    {
      id: 'reports-dashboard',
      labelKey: 'reports_dashboard',
      icon: 'BarChart2',
      path: '/reports',
      order: 30,
      requiredPermission: 'reports.view',
    },
    {
      id: 'reports-sales',
      labelKey: 'sales_reports',
      icon: 'Receipt',
      path: '/reports/sales',
      order: 31,
      requiredPermission: 'reports.view',
    },
    {
      id: 'reports-products',
      labelKey: 'product_reports',
      icon: 'Award',
      path: '/reports/products',
      order: 32,
      requiredPermission: 'reports.view',
    },
    {
      id: 'reports-inventory',
      labelKey: 'inventory_reports',
      icon: 'Boxes',
      path: '/reports/inventory',
      order: 33,
      requiredPermission: 'reports.view',
    },
    {
      id: 'reports-financial',
      labelKey: 'financial_reports',
      icon: 'Layers',
      path: '/reports/financial',
      order: 34,
      requiredPermission: 'reports.financial',
    },
  ],
  permissions: [
    'reports.view',
    'reports.sales',
    'reports.products',
    'reports.inventory',
    'reports.purchasing',
    'reports.financial',
    'reports.export',
  ],
  translations: {
    en: {
      reports_dashboard: 'Analytics Dashboard',
      sales_reports: 'Sales Reports',
      product_reports: 'Product Reports',
      inventory_reports: 'Inventory Reports',
      financial_reports: 'Financial P&L',
    },
    ar: {
      reports_dashboard: 'لوحة التحليلات',
      sales_reports: 'تقارير المبيعات',
      product_reports: 'تقارير المنتجات',
      inventory_reports: 'تقارير المخزون',
      financial_reports: 'الأرباح والخسائر',
    },
  },
};
