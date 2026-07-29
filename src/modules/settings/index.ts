import { RMSModule } from '@shared/types/module';
import { SettingsContainerPage } from './SettingsContainerPage';

export const SettingsModule: RMSModule = {
  id: 'settings',
  name: 'System Settings',
  version: '1.0.0',
  description: 'Application configuration and multi-section business settings module.',
  routes: [
    {
      path: '/settings',
      component: SettingsContainerPage,
    },
  ],
  sidebarItems: [
    {
      id: 'settings',
      labelKey: 'settings',
      icon: 'Settings',
      path: '/settings',
      order: 90,
    },
  ],
  permissions: [],
};
