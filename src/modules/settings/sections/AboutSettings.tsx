import React from 'react';
import { Card } from '@components/ui/Card';

export const AboutSettings: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="h-10 w-10 bg-sky-600 rounded-xl flex items-center justify-center font-bold text-white text-lg">
          RMS
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Retail Management System (RMS)
          </h3>
          <p className="text-xs text-slate-500">Enterprise Offline Desktop Core</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <Card title="System Environment">
          <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
            <p>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Application Version:
              </span>{' '}
              1.0.0
            </p>
            <p>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Build Number:
              </span>{' '}
              2026.07.21-PROD
            </p>
            <p>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Electron Core:
              </span>{' '}
              v31.2.0
            </p>
            <p>
              <span className="font-semibold text-slate-800 dark:text-slate-200">React Core:</span>{' '}
              v18.3.1
            </p>
            <p>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Database Engine:
              </span>{' '}
              SQLite (WAL Mode)
            </p>
          </div>
        </Card>

        <Card title="License & Ownership">
          <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
            <p>
              <span className="font-semibold text-slate-800 dark:text-slate-200">License:</span>{' '}
              Enterprise Commercial
            </p>
            <p>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Copyright:</span> ©
              2026 RMS Enterprise Systems
            </p>
            <p>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Support:</span>{' '}
              support@rms-enterprise.local
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
