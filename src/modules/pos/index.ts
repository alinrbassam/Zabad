import { RMSModule } from '@shared/types/module';
import { POSTerminalPage } from './POSTerminalPage';
import { SalesHistoryPage } from './SalesHistoryPage';
import { DebtsPage } from './DebtsPage';

export const POSModule: RMSModule = {
  id: 'pos',
  name: 'POS Terminal & Sales',
  description:
    'Fast barcode checkout terminal, receipt printing, held sales, customer debts, and refunds.',
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
    {
      path: '/pos/debts',
      component: DebtsPage,
      requiredPermission: 'pos.checkout',
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
      id: 'pos-debts',
      labelKey: 'pos_debts',
      icon: 'HandCoins',
      path: '/pos/debts',
      order: 6,
      requiredPermission: 'pos.checkout',
    },
    {
      id: 'pos-sales-history',
      labelKey: 'sales_history',
      icon: 'History',
      path: '/pos/sales',
      order: 7,
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
      pos_debts: 'Customer Debts',
      sales_history: 'Sales History',
    },
    ar: {
      pos_terminal: 'نقطة البيع',
      pos_debts: 'سجل الديون (الآجل)',
      sales_history: 'سجل المبيعات',
    },
  },
};
