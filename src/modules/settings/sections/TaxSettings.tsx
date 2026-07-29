import React, { useState } from 'react';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';

export const TaxSettings: React.FC = () => {
  const [rate, setRate] = useState('15');

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Tax Settings</h3>
      <Input label="Default Tax Rate (%)" value={rate} onChange={(e) => setRate(e.target.value)} />
      <div className="pt-2 flex justify-end">
        <Button>Save Tax Rate</Button>
      </div>
    </div>
  );
};
