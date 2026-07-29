import { RMSModule } from '@shared/types/module';
import { AuditLogPage } from './AuditLogPage';

export const AuditModule: RMSModule = {
  id: 'audit',
  name: 'Audit Logs',
  version: '1.0.0',
  description: 'Security and system audit log trail viewer.',
  routes: [
    {
      path: '/audit',
      component: AuditLogPage,
      requiredPermission: 'users.manage',
    },
  ],
  sidebarItems: [
    {
      id: 'audit',
      labelKey: 'audit_logs',
      icon: 'BarChart3',
      path: '/audit',
      order: 85,
      requiredPermission: 'users.manage',
    },
  ],
  permissions: ['users.manage'],
  translations: {
    en: { audit_logs: 'Audit Logs' },
    ar: { audit_logs: 'سجل العمليات' },
  },
};
