import React, { useState } from 'react';
import { useSetupWizardStore } from '@stores/useSetupWizardStore';
import { useAuthStore } from '@stores/useAuthStore';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
export const Step7FinishSummary: React.FC = () => {
  const { data, prevStep, resetWizard } = useSetupWizardStore();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (window.api?.completeSetup) {
        const res = await window.api.completeSetup(data);
        if (res.success && res.data) {
          setAuth(res.data);
          resetWizard();
          window.location.reload();
          return;
        } else {
          setError(res.error?.message || 'Failed completing business setup');
        }
      } else {
        resetWizard();
        window.location.reload();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Step 7: Setup Complete
        </h3>
        <p className="text-xs text-slate-500">
          Review your store setup parameters before initializing the offline SQLite database.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Business Identity
            </span>
            <p className="text-slate-600 dark:text-slate-400">
              {data.businessName} ({data.businessType})
            </p>
            <p className="text-slate-500">
              {data.phone} • {data.email || 'No email'}
            </p>
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Store Owner</span>
            <p className="text-slate-600 dark:text-slate-400">{data.ownerName}</p>
            <p className="text-slate-500">Username: {data.ownerUsername}</p>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
              Tax Rules
            </span>
            <p className="text-slate-500">
              {data.taxEnabled
                ? `${data.taxRate}% (${data.pricesIncludeTax ? 'Inclusive' : 'Exclusive'})`
                : 'Tax Disabled'}
            </p>
          </div>
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
              Receipt Printing
            </span>
            <p className="text-slate-500">
              {data.receiptWidth} • {data.receiptLanguage.toUpperCase()}
            </p>
          </div>
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
              Backup Schedule
            </span>
            <p className="text-slate-500">
              {data.autoBackupEnabled
                ? `${data.backupFrequency} (${data.backupRetentionCount} retained)`
                : 'Disabled'}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading}>
          Back
        </Button>
        <Button onClick={handleFinish} isLoading={isLoading} size="lg">
          Complete Setup & Proceed to Login ✓
        </Button>
      </div>
    </div>
  );
};
