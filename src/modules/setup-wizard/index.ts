import { RMSModule } from '@shared/types/module';
import { SetupWizardPage } from './SetupWizardPage';

export const SetupWizardModule: RMSModule = {
  id: 'setup-wizard',
  name: 'Setup Wizard',
  version: '1.0.0',
  description: 'First launch business configuration wizard module.',
  routes: [
    {
      path: '/setup-wizard',
      component: SetupWizardPage,
    },
  ],
  sidebarItems: [],
  permissions: [],
};
