import React from 'react';
import { RMSModule } from '@shared/types/module';

const SystemInfoPage: React.FC = () => {
  return React.createElement(
    'div',
    { className: 'p-6 space-y-4' },
    React.createElement(
      'h1',
      { className: 'text-2xl font-bold text-slate-800 dark:text-slate-100' },
      'System Architecture Status',
    ),
    React.createElement(
      'p',
      { className: 'text-slate-600 dark:text-slate-400' },
      'Enterprise RMS Core Foundation Initialized Successfully.',
    ),
  );
};

export const SystemInfoModule: RMSModule = {
  id: 'system-info',
  name: 'System Information',
  version: '1.0.0',
  description: 'Core system status and architecture diagnostic module.',
  routes: [
    {
      path: '/system',
      component: SystemInfoPage,
    },
  ],
  sidebarItems: [
    {
      id: 'system-info',
      labelKey: 'system_status',
      icon: 'Info',
      path: '/system',
      order: 100,
    },
  ],
  permissions: ['system.view'],
  translations: {
    en: { system_status: 'System Status' },
    ar: { system_status: 'حالة النظام' },
  },
};
