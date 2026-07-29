import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSetupWizardStore } from '@stores/useSetupWizardStore';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { OwnerPasswordSchema } from '@shared/validation';

const OwnerAccountFormSchema = z
  .object({
    ownerUsername: z.string().min(3, 'Username must be at least 3 characters'),
    ownerPassword: OwnerPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    securityQuestion: z.string().min(3, 'Security question is required'),
    securityAnswer: z.string().min(2, 'Security answer is required'),
  })
  .refine((data) => data.ownerPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type Step6FormValues = z.infer<typeof OwnerAccountFormSchema>;

export const Step6OwnerAccount: React.FC = () => {
  const { data, updateData, nextStep, prevStep } = useSetupWizardStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step6FormValues>({
    resolver: zodResolver(OwnerAccountFormSchema),
    defaultValues: {
      ownerUsername: data.ownerUsername || 'admin',
      ownerPassword: data.ownerPassword || '',
      confirmPassword: data.ownerPassword || '',
      securityQuestion: data.securityQuestion || 'What is your store name?',
      securityAnswer: data.securityAnswer || '',
    },
  });

  const pwd = watch('ownerPassword') || '';

  const passwordRules = [
    { label: 'At least 10 characters', valid: pwd.length >= 10 },
    { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(pwd) },
    { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(pwd) },
    { label: 'One number (0-9)', valid: /[0-9]/.test(pwd) },
    { label: 'One special character (!@#$%^&*)', valid: /[^A-Za-z0-9]/.test(pwd) },
  ];

  const onSubmit = (values: Step6FormValues) => {
    updateData({
      ownerUsername: values.ownerUsername,
      ownerPassword: values.ownerPassword,
      securityQuestion: values.securityQuestion,
      securityAnswer: values.securityAnswer,
    });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Step 6: Primary Owner Account
        </h3>
        <p className="text-xs text-slate-500">
          Create the primary administrative account for store operations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Owner Username *"
          {...register('ownerUsername')}
          error={errors.ownerUsername?.message}
        />
        <div />

        <Input
          label="Password *"
          type="password"
          {...register('ownerPassword')}
          error={errors.ownerPassword?.message}
        />
        <Input
          label="Confirm Password *"
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          Password Requirements:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
          {passwordRules.map((rule, idx) => (
            <div key={idx} className="flex items-center space-x-1.5">
              <span className={rule.valid ? 'text-emerald-500 font-bold' : 'text-slate-400'}>
                {rule.valid ? '✓' : '○'}
              </span>
              <span
                className={rule.valid ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500'}
              >
                {rule.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <Input
          label="Security Question (For Recovery) *"
          {...register('securityQuestion')}
          error={errors.securityQuestion?.message}
        />
        <Input
          label="Security Answer *"
          type="password"
          {...register('securityAnswer')}
          error={errors.securityAnswer?.message}
        />
      </div>

      <div className="pt-4 flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button type="submit">Review & Finish →</Button>
      </div>
    </form>
  );
};
