import { RMSModule } from '@shared/types/module';
import { HelpPage } from './HelpPage';

export const HelpModule: RMSModule = {
  id: 'help',
  name: 'Help Center',
  description: 'In-app keyboard shortcuts reference, FAQ, and technical support documentation.',
  version: '1.0.0',
  icon: 'HelpCircle',
  routes: [
    { path: '/help', component: HelpPage, exact: true },
  ],
  sidebarItems: [
    { id: 'help-center', labelKey: 'help_center', icon: 'HelpCircle', path: '/help', order: 90 },
  ],
  permissions: ['help.view'],
  translations: {
    en: { help_center: 'Help Center' },
    ar: { help_center: 'مركز المساعدة' },
  },
};
