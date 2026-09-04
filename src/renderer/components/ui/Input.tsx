import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col space-y-1 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          lang={props.type === 'date' ? (props.lang || 'en-GB') : props.lang}
          className={twMerge(
            clsx(
              'px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all',
              error
                ? 'border-red-500 focus:ring-red-400'
                : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500 focus:border-sky-500',
              className,
            ),
          )}
          {...props}
        />
        {error ? (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">{helperText}</span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
