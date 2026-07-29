import React from 'react';
import { useForm } from 'react-hook-form';
import { useSetupWizardStore } from '@stores/useSetupWizardStore';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';

export const Step3TaxConfig: React.FC = () => {
  const { data, updateData, nextStep, prevStep } = useSetupWizardStore();

  const { register, handleSubmit, watch } = useForm({
    defaultValues: data,
  });

  const taxEnabled = watch('taxEnabled');

  const onSubmit = (values: Record<string, unknown>) => {
    updateData(values as Partial<typeof data>);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Step 3: Tax Configuration
        </h3>
        <p className="text-xs text-slate-500">Configure default tax rules for your store sales.</p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('taxEnabled')}
            className="h-4 w-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
          />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Enable Sales Tax / VAT Calculation
          </span>
        </label>

        {taxEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Input
              label="Default Tax Rate (%)"
              type="number"
              step="0.01"
              {...register('taxRate', { valueAsNumber: true })}
            />

            <div className="flex flex-col justify-center space-y-2">
              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  value="false"
                  {...register('pricesIncludeTax')}
                  checked={!watch('pricesIncludeTax')}
                  onChange={() => updateData({ pricesIncludeTax: false })}
                />
                <span>Prices Exclude Tax (Tax added at checkout)</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  value="true"
                  {...register('pricesIncludeTax')}
                  checked={watch('pricesIncludeTax')}
                  onChange={() => updateData({ pricesIncludeTax: true })}
                />
                <span>Prices Include Tax</span>
              </label>
            </div>
          </div>
        )}
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
