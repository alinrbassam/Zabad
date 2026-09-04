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
import { ExpensesModule } from '../modules/expenses';
import { HelpModule } from '../modules/help';
import { NavigationLayout } from './components/layout/NavigationLayout';
import { useAuthStore } from './stores/useAuthStore';
import { useConfigStore } from './stores/useConfigStore';
import { useThemeStore } from './stores/useThemeStore';
import { RouteDefinition } from '@shared/types/module';

import { DashboardPage } from './pages/DashboardPage';
import { ManagerPasswordModal } from './components/auth/ManagerPasswordModal';
import { useLanguageStore } from './stores/useLanguageStore';
import { Lock, ShieldAlert } from 'lucide-react';

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
  moduleRegistry.registerModule(ExpensesModule);
  moduleRegistry.registerModule(ReportsModule);
  moduleRegistry.registerModule(HelpModule);
} catch {
  // Modules already registered
}

const ManagerRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeRoleMode, setManagerUnlockModalOpen } = useAuthStore();
  const { language } = useLanguageStore();

  if (activeRoleMode === 'cashier') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4 select-none">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="max-w-md space-y-1">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {language === 'ar'
              ? 'هذه الصفحة تتطلب صلاحيات المدير'
              : language === 'fr'
              ? 'Accès Réservé au Gérant'
              : 'Manager Access Required'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'ar'
              ? 'أنت حالياً في وضع الكاشير (المبيعات فقط). يرجى إدخال كلمة مرور المدير للمتابعة.'
              : language === 'fr'
              ? 'Vous êtes actuellement en Mode Caisse (vente seule). Veuillez entrer le mot de passe gérant.'
              : 'You are currently in Cashier Mode (sales only). Please enter the manager password to continue.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setManagerUnlockModalOpen(true)}
          className="flex items-center space-x-2 rtl:space-x-reverse px-5 py-2.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all"
        >
          <Lock className="h-4 w-4" />
          <span>
            {language === 'ar'
              ? 'إدخال كلمة مرور المدير'
              : language === 'fr'
              ? 'Déverrouiller le Mode Gérant'
              : 'Unlock Manager Mode'}
          </span>
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { checkSession, activeRoleMode } = useAuthStore();
  const { loadConfig } = useConfigStore();
  const { theme } = useThemeStore();
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    loadConfig();

    if (import.meta.env.DEV) {
      setIsSetupComplete(true);
      useAuthStore.setState({
        isAuthenticated: true,
        isScreenLocked: false,
      });
      return;
    }

    checkSession();

    if (window.api?.checkSetup) {
      window.api
        .checkSetup()
        .then((res) => {
          if (res.success && res.data) {
            setIsSetupComplete(res.data.isSetupComplete);
          } else {
            setIsSetupComplete(false);
          }
        })
        .catch((err) => {
          if (window.api?.writeLog) {
            window.api.writeLog('error', 'App-CheckSetup', (err as Error).message, {
              stack: (err as Error).stack,
            });
          }
          setIsSetupComplete(false);
        });
    } else {
      setIsSetupComplete(true);
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
          <p className="text-sm font-semibold tracking-wide">Initializing Zabad System...</p>
        </div>
      </div>
    );
  }

  const SetupPage = SetupWizardModule.routes[0].component;
  const allRoutes = moduleRegistry.getAllRoutes();

  return (
    <HashRouter>
      {!isSetupComplete ? (
        <SetupPage />
      ) : (
        <NavigationLayout>
          <ManagerPasswordModal />
          <Routes>
            <Route
              path="/"
              element={activeRoleMode === 'cashier' ? <Navigate to="/pos" replace /> : <DashboardPage />}
            />
            {allRoutes.map((r: RouteDefinition) => {
              const isPosRoute = r.path.startsWith('/pos');
              return (
                <Route
                  key={r.path}
                  path={r.path}
                  element={
                    isPosRoute ? (
                      <r.component />
                    ) : (
                      <ManagerRouteGuard>
                        <r.component />
                      </ManagerRouteGuard>
                    )
                  }
                />
              );
            })}
            <Route path="*" element={<Navigate to={activeRoleMode === 'cashier' ? '/pos' : '/'} replace />} />
          </Routes>
        </NavigationLayout>
      )}
    </HashRouter>
  );
};

export default App;
