import React, { useEffect, useState } from 'react';
import { useCommercialStore } from '@stores/useCommercialStore';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { Database, ShieldCheck } from 'lucide-react';

export const MaintenanceSettings: React.FC = () => {
  const { runVacuum, runIntegrityCheck, diagnostics, loadDiagnostics, isLoading, error } =
    useCommercialStore();
  const [integrityRes, setIntegrityRes] = useState<{ status: string; result: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadDiagnostics();
  }, [loadDiagnostics]);

  const handleVacuum = async () => {
    setSuccessMsg(null);
    const ok = await runVacuum();
    if (ok) {
      setSuccessMsg('SQLite database VACUUM completed successfully! Storage reclaimed.');
      await loadDiagnostics();
    }
  };

  const handleIntegrityCheck = async () => {
    setSuccessMsg(null);
    const res = await runIntegrityCheck();
    if (res) {
      setIntegrityRes(res);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Database Maintenance & Diagnostics
        </h2>
        <p className="text-xs text-slate-500">
          Run database integrity checks, VACUUM storage optimization, and system diagnostics.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}
      {integrityRes && (
        <Alert variant={integrityRes.status === 'Success' ? 'success' : 'warning'}>
          Database Integrity Check Result: {integrityRes.result}
        </Alert>
      )}

      <Card title="1. System Diagnostics & Database Metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block font-bold uppercase text-[9px]">
              SQLite Version
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-slate-100">
              {diagnostics?.sqliteVersion || 'N/A'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block font-bold uppercase text-[9px]">
              Total Products
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-slate-100">
              {diagnostics?.productCount || 0}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block font-bold uppercase text-[9px]">
              Total Sales Orders
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-slate-100">
              {diagnostics?.salesCount || 0}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block font-bold uppercase text-[9px]">
              Free System Memory
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-slate-100">
              {diagnostics?.freeMemoryMB || 0} MB
            </span>
          </div>
        </div>
      </Card>

      <Card title="2. SQLite Storage Optimization & Health Tools">
        <div className="flex space-x-4 pt-2">
          <Button
            onClick={handleVacuum}
            isLoading={isLoading}
            className="flex items-center space-x-2"
          >
            <Database className="h-4 w-4" />
            <span>Run VACUUM Storage Optimization</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleIntegrityCheck}
            isLoading={isLoading}
            className="flex items-center space-x-2"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>PRAGMA Integrity Check</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};
