import { RMSModule } from '@shared/types/module';
import { ExpensesPage } from './ExpensesPage';

export const ExpensesModule: RMSModule = {
  id: 'expenses',
  name: 'Operating Expenses',
  description:
    'Manage store operating expenses including electricity, water, ice cooling, transport, and rent.',
  version: '1.0.0',
  icon: 'Receipt',
  routes: [
    {
      path: '/expenses',
      component: ExpensesPage,
      requiredPermission: 'expenses.view',
      exact: true,
    },
  ],
  sidebarItems: [
    {
      id: 'expenses-list',
      labelKey: 'expenses_management',
      icon: 'Receipt',
      path: '/expenses',
      order: 25,
      requiredPermission: 'expenses.view',
    },
  ],
  permissions: [
    'expenses.view',
    'expenses.create',
    'expenses.delete',
  ],
  translations: {
    en: {
      expenses_management: 'Operational Expenses',
    },
    ar: {
      expenses_management: 'المصاريف التشغيلية',
    },
  },
};
