import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AlertProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ title, children, variant = 'info', className }) => {
  const styles = {
    info: 'bg-sky-50 border-sky-300 text-sky-900 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-200',
    success:
      'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200',
    warning:
      'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200',
    danger:
      'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200',
  };

  return (
    <div className={twMerge(clsx('p-4 border rounded-lg text-sm', styles[variant], className))}>
      {title && <h4 className="font-bold mb-1">{title}</h4>}
      <div>{children}</div>
    </div>
  );
};
