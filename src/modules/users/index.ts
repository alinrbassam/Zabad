import { RMSModule } from '@shared/types/module';
import { UsersPage } from './UsersPage';

export const UsersModule: RMSModule = {
  id: 'users',
  name: 'Users & Roles',
  version: '1.0.0',
  description: 'User management, cashier accounts and RBAC access control module.',
  routes: [
    {
      path: '/users',
      component: UsersPage,
      requiredPermission: 'users.manage',
    },
  ],
  sidebarItems: [
    {
      id: 'users',
      labelKey: 'users_management',
      icon: 'Users',
      path: '/users',
      order: 80,
      requiredPermission: 'users.manage',
    },
  ],
  permissions: ['users.manage'],
  translations: {
    en: { users_management: 'Users & Accounts' },
    ar: { users_management: 'إدارة المستخدمين' },
  },
};
