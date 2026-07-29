import { RMSModule } from '@shared/types/module';
import { POSTerminalPage } from './POSTerminalPage';
import { SalesHistoryPage } from './SalesHistoryPage';

export const POSModule: RMSModule = {
  id: 'pos',
  name: 'POS Terminal & Sales',
  description:
    'Fast barcode checkout terminal, receipt printing, held sales, cash drawer, and refunds.',
  version: '1.0.0',
  icon: 'ShoppingCart',
  routes: [
    { path: '/pos', component: POSTerminalPage, requiredPermission: 'pos.checkout', exact: true },
    {
      path: '/pos/sales',
      component: SalesHistoryPage,
      requiredPermission: 'pos.sales_history',
      exact: true,
    },
  ],
  sidebarItems: [
    {
      id: 'pos-terminal',
      labelKey: 'pos_terminal',
      icon: 'ShoppingCart',
      path: '/pos',
      order: 5,
      requiredPermission: 'pos.checkout',
    },
    {
      id: 'pos-sales-history',
      labelKey: 'sales_history',
      icon: 'History',
      path: '/pos/sales',
      order: 6,
      requiredPermission: 'pos.sales_history',
    },
  ],
  permissions: [
    'pos.checkout',
    'pos.sales_history',
    'pos.discount',
    'pos.override_price',
    'pos.refund',
    'pos.void',
    'pos.reprint_receipt',
    'pos.shift_manage',
  ],
  translations: {
    en: {
      pos_terminal: 'POS Checkout',
      sales_history: 'Sales History',
    },
    ar: {
      pos_terminal: 'نقطة البيع',
      sales_history: 'سجل المبيعات',
    },
  },
};
