import React from 'react';
import { Input } from './Input';

export interface DatePickerProps {
  label?: string;
  value?: string;
  onChange: (val: string) => void;
  error?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange, error }) => {
  return (
    <Input
      type="date"
      label={label}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      error={error}
    />
  );
};
