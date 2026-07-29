import { RMSModule } from '@shared/types/module';
import { LoginPage } from './LoginPage';

export const AuthModule: RMSModule = {
  id: 'auth',
  name: 'Authentication',
  version: '1.0.0',
  description: 'User login, session management and authentication module.',
  routes: [
    {
      path: '/login',
      component: LoginPage,
    },
  ],
  sidebarItems: [],
  permissions: [],
};
