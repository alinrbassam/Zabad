import React, { useState } from 'react';
import { useCommercialStore } from '@stores/useCommercialStore';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { RefreshCw } from 'lucide-react';

export const UpdateSettings: React.FC = () => {
  const { updateStatus, checkForUpdates, isLoading } = useCommercialStore();
  const [checked, setChecked] = useState(false);

  const handleCheck = async () => {
    await checkForUpdates();
    setChecked(true);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Application Updates
        </h2>
        <p className="text-xs text-slate-500">
          Check for software updates via GitHub Releases without interrupting sales.
        </p>
      </div>

      <Card title="GitHub Releases Update Checker">
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">Installed Version:</span>
              <span className="font-bold text-base text-slate-900 dark:text-slate-100">v1.0.0</span>
            </div>

            {checked && updateStatus && (
              <Badge variant={updateStatus.hasUpdate ? 'warning' : 'success'}>
                {updateStatus.hasUpdate
                  ? `Update Available: ${updateStatus.latestVersion}`
                  : 'Up to Date ✓'}
              </Badge>
            )}
          </div>

          {checked && updateStatus?.releaseNotes && (
            <div className="p-3 bg-slate-900 text-slate-200 text-xs rounded-xl font-mono">
              {updateStatus.releaseNotes}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleCheck}
              isLoading={isLoading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Check for Updates Now</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
