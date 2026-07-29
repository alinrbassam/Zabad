import React from 'react';
import { useForm } from 'react-hook-form';
import { useSetupWizardStore } from '@stores/useSetupWizardStore';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';

export const Step5BackupDefaults: React.FC = () => {
  const { data, updateData, nextStep, prevStep } = useSetupWizardStore();

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: data,
  });

  const onSubmit = (values: Record<string, unknown>) => {
    updateData(values as Partial<typeof data>);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Step 5: Backup Defaults
        </h3>
        <p className="text-xs text-slate-500">
          Configure automated offline database snapshot policies.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('autoBackupEnabled')}
            className="h-4 w-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
          />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Enable Automatic Local Database Backups
          </span>
        </label>

        {watch('autoBackupEnabled') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex flex-col space-y-1 w-full">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Local Backup Folder Path
              </label>
              <div className="flex space-x-2">
                <Input
                  {...register('backupFolder')}
                  placeholder="e.g. C:\Backups\RMS"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (window.api?.selectDirectory) {
                      const res = await window.api.selectDirectory();
                      if (res.success && res.data) {
                        setValue('backupFolder', res.data);
                      }
                    }
                  }}
                  className="px-4 py-2 text-xs"
                >
                  Browse...
                </Button>
              </div>
            </div>

            <div className="flex flex-col space-y-1 w-full">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cloud Folder Sync Path
              </label>
              <div className="flex space-x-2">
                <Input
                  {...register('cloudSyncFolder')}
                  placeholder="e.g. OneDrive / Dropbox path"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (window.api?.selectDirectory) {
                      const res = await window.api.selectDirectory();
                      if (res.success && res.data) {
                        setValue('cloudSyncFolder', res.data);
                      }
                    }
                  }}
                  className="px-4 py-2 text-xs"
                >
                  Browse...
                </Button>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Backup Frequency
              </label>
              <select
                {...register('backupFrequency')}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <Input
              label="Backup Retention Count"
              type="number"
              min="1"
              {...register('backupRetentionCount', { valueAsNumber: true })}
            />
          </div>
        )}
      </div>

      <div className="flex space-x-6 text-xs text-slate-700 dark:text-slate-300">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('backupCompressionEnabled')}
            className="rounded border-slate-300 text-sky-600"
          />
          <span>Enable Backup Compression (.zip)</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('backupEncryptionEnabled')}
            className="rounded border-slate-300 text-sky-600"
          />
          <span>Enable Local Encryption</span>
        </label>
      </div>

      <div className="pt-4 flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button type="submit">Continue →</Button>
      </div>
    </form>
  );
};
