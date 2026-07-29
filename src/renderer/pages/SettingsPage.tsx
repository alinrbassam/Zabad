import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SettingsLayout } from '../components/layout/SettingsLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { AppConfigSchema, AppConfigInput } from '@shared/validation';
import { useConfigStore } from '../stores/useConfigStore';
import { useLanguageStore } from '../stores/useLanguageStore';

export const SettingsPage: React.FC = () => {
  const { config, loadConfig, updateConfig, isLoading } = useConfigStore();
  const { t } = useLanguageStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppConfigInput>({
    resolver: zodResolver(AppConfigSchema),
    defaultValues: config || {
      theme: 'system',
      language: 'en',
      currency: 'USD',
      businessName: 'My Enterprise Store',
      businessType: 'Supermarket',
      taxRate: 15,
      taxNumber: '',
      address: '',
      phone: '',
      backupPath: '',
      receiptHeader: '',
      receiptFooter: '',
      appVersion: '1.0.0',
    },
  });

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (config) {
      reset(config);
    }
  }, [config, reset]);

  const onSubmit = async (data: AppConfigInput) => {
    await updateConfig(data);
  };

  return (
    <SettingsLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <Input
          label="Business Name"
          {...register('businessName')}
          error={errors.businessName?.message}
        />
        <Input
          label="Business Type"
          {...register('businessType')}
          error={errors.businessType?.message}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Currency" {...register('currency')} error={errors.currency?.message} />
          <Input
            label="Tax Rate (%)"
            type="number"
            step="0.01"
            {...register('taxRate', { valueAsNumber: true })}
            error={errors.taxRate?.message}
          />
        </div>
        <Input label="Tax Number" {...register('taxNumber')} error={errors.taxNumber?.message} />
        <Input label="Store Address" {...register('address')} error={errors.address?.message} />
        <Input label="Phone Number" {...register('phone')} error={errors.phone?.message} />

        <div className="pt-4 flex justify-end">
          <Button type="submit" isLoading={isLoading}>
            {t('save')}
          </Button>
        </div>
      </form>
    </SettingsLayout>
  );
};
