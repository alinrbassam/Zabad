import React from 'react';
import { useForm } from 'react-hook-form';
import { useSetupWizardStore } from '@stores/useSetupWizardStore';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';

export const Step2BusinessInfo: React.FC = () => {
  const { data, updateData, nextStep, prevStep } = useSetupWizardStore();

  const businessTypes = [
    'Supermarket',
    'Mini Market',
    'Fish Market',
    'Clothing',
    'Electronics',
    'Cosmetics',
    'Hardware',
    'Bakery',
    'Pharmacy',
    'Stationery',
    'General Retail',
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
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
          Step 2: Business Information
        </h3>
        <p className="text-xs text-slate-500">Specify your retail business identity details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Business Name *"
          {...register('businessName', { required: 'Business name is required' })}
          error={errors.businessName?.message as string}
        />

        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Business Type *
          </label>
          <select
            {...register('businessType')}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
          >
            {businessTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Owner Full Name *"
          {...register('ownerName', { required: 'Owner name is required' })}
          error={errors.ownerName?.message as string}
        />
        <Input
          label="Phone Number *"
          {...register('phone', { required: 'Phone number is required' })}
          error={errors.phone?.message as string}
        />
        <Input label="Email Address" type="email" {...register('email')} />
        <Input label="Website" {...register('website')} />
        <Input label="Tax Registration Number" {...register('taxNumber')} />
        <Input label="Currency (Code)" {...register('currency')} />
        <Input label="Address" {...register('address')} />
        <Input label="City" {...register('city')} />
        <Input label="Country" {...register('country')} />
        <Input label="Time Zone" {...register('timezone')} />
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
