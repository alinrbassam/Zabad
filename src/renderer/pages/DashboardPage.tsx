import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { useLanguageStore } from '../stores/useLanguageStore';
import { ShieldCheck, Database, Layers, Cpu } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { t } = useLanguageStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('dashboard')}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          RMS Enterprise Desktop Core Architecture Status
        </p>
      </div>

      <Alert variant="info" title="Architecture Ready">
        Offline-first SQLite database layer, typed IPC security bridge, dynamic module registry, and
        Tailwind design system are fully initialized.
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Database Engine">
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-sky-500" />
              <span className="text-xs text-slate-600 dark:text-slate-300">SQLite (WAL Mode)</span>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </Card>

        <Card title="IPC Isolation">
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span className="text-xs text-slate-600 dark:text-slate-300">ContextIsolated</span>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
        </Card>

        <Card title="Module Registry">
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-indigo-500" />
              <span className="text-xs text-slate-600 dark:text-slate-300">Dynamic Modules</span>
            </div>
            <Badge variant="info">Ready</Badge>
          </div>
        </Card>

        <Card title="Execution Mode">
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-amber-500" />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Electron Main Process
              </span>
            </div>
            <Badge variant="warning">Offline</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};
