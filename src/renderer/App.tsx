import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { moduleRegistry } from '../modules/registry';
import { SetupWizardModule } from '../modules/setup-wizard';
import { AuthModule } from '../modules/auth';
import { UsersModule } from '../modules/users';
import { SettingsModule } from '../modules/settings';
import { AuditModule } from '../modules/audit';
import { SystemInfoModule } from '../modules/system-info';
import { InventoryModule } from '../modules/inventory';
import { PurchasingModule } from '../modules/purchasing';
import { POSModule } from '../modules/pos';
import { ReportsModule } from '../modules/reports';
import { HelpModule } from '../modules/help';
import { NavigationLayout } from './components/layout/NavigationLayout';
import { useAuthStore } from './stores/useAuthStore';
import { useConfigStore } from './stores/useConfigStore';
import { useThemeStore } from './stores/useThemeStore';
import { RouteDefinition } from '@shared/types/module';

// Register core modules
try {
  moduleRegistry.registerModule(SetupWizardModule);
  moduleRegistry.registerModule(AuthModule);
  moduleRegistry.registerModule(UsersModule);
  moduleRegistry.registerModule(SettingsModule);
  moduleRegistry.registerModule(AuditModule);
  moduleRegistry.registerModule(SystemInfoModule);
  moduleRegistry.registerModule(InventoryModule);
  moduleRegistry.registerModule(PurchasingModule);
  moduleRegistry.registerModule(POSModule);
  moduleRegistry.registerModule(ReportsModule);
  moduleRegistry.registerModule(HelpModule);
} catch {
  // Modules already registered
}

export const App: React.FC = () => {
  const { isAuthenticated, isScreenLocked, checkSession } = useAuthStore();
  const { loadConfig } = useConfigStore();
  const { theme } = useThemeStore();
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    loadConfig();
    checkSession();

    if (window.api?.checkSetup) {
      window.api.checkSetup().then((res) => {
        if (res.success && res.data) {
          setIsSetupComplete(res.data.isSetupComplete);
        } else {
          setIsSetupComplete(false);
        }
      }).catch((err) => {
        if (window.api?.writeLog) {
          window.api.writeLog('error', 'App-CheckSetup', (err as Error).message, { stack: (err as Error).stack });
        }
        setIsSetupComplete(false);
      });
    }
  }, [loadConfig, checkSession]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  if (isSetupComplete === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
          <p className="text-sm font-semibold tracking-wide">Initializing Retail System...</p>
        </div>
      </div>
    );
  }

  const SetupPage = SetupWizardModule.routes[0].component;
  const LoginPage = AuthModule.routes[0].component;
  const allRoutes = moduleRegistry.getAllRoutes();

  return (
    <HashRouter>
      {!isSetupComplete ? (
        <SetupPage />
      ) : !isAuthenticated || isScreenLocked ? (
        <LoginPage />
      ) : (
        <NavigationLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/pos" replace />} />
            {allRoutes.map((r: RouteDefinition) => (
              <Route key={r.path} path={r.path} element={<r.component />} />
            ))}
            <Route path="*" element={<Navigate to="/pos" replace />} />
          </Routes>
        </NavigationLayout>
      )}
    </HashRouter>
  );
};

export default App;
