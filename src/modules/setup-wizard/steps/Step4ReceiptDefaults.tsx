import React from 'react';
import { useForm } from 'react-hook-form';
import { useSetupWizardStore } from '@stores/useSetupWizardStore';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';

export const Step4ReceiptDefaults: React.FC = () => {
  const { data, updateData, nextStep, prevStep } = useSetupWizardStore();

  const { register, handleSubmit } = useForm({
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
          Step 4: Receipt Defaults
        </h3>
        <p className="text-xs text-slate-500">
          Customize physical thermal print and digital receipt settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Receipt Width
          </label>
          <select
            {...register('receiptWidth')}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
          >
            <option value="58mm">58mm Thermal</option>
            <option value="80mm">80mm Thermal (Standard)</option>
            <option value="A4">A4 Full Sheet</option>
          </select>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Receipt Language
          </label>
          <select
            {...register('receiptLanguage')}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
          >
            <option value="en">English</option>
            <option value="ar">العربية (Arabic)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('showReceiptLogo')}
            className="rounded border-slate-300 text-sky-600"
          />
          <span>Show Store Logo</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('showReceiptAddress')}
            className="rounded border-slate-300 text-sky-600"
          />
          <span>Show Store Address</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('showReceiptPhone')}
            className="rounded border-slate-300 text-sky-600"
          />
          <span>Show Phone Number</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('showReceiptTaxNumber')}
            className="rounded border-slate-300 text-sky-600"
          />
          <span>Show Tax Number</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('showCashierName')}
            className="rounded border-slate-300 text-sky-600"
          />
          <span>Show Cashier Name</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('autoPrintReceipt')}
            className="rounded border-slate-300 text-sky-600"
          />
          <span>Auto Print Receipt</span>
        </label>
      </div>

      <Input label="Receipt Footer Message" {...register('receiptFooterMessage')} />
      <Input label="Return Policy" {...register('returnPolicy')} />

      <div className="pt-4 flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button type="submit">Continue →</Button>
      </div>
    </form>
  );
};
