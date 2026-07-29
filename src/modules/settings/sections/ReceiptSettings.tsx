import React, { useState } from 'react';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';

export const ReceiptSettings: React.FC = () => {
  const [footer, setFooter] = useState('Thank you for shopping with us!');
  const [policy, setPolicy] = useState('30 Days Return Policy');

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Receipt Defaults</h3>
      <Input
        label="Receipt Footer Message"
        value={footer}
        onChange={(e) => setFooter(e.target.value)}
      />
      <Input
        label="Return Policy Statement"
        value={policy}
        onChange={(e) => setPolicy(e.target.value)}
      />
      <div className="pt-2 flex justify-end">
        <Button>Save Receipt Settings</Button>
      </div>
    </div>
  );
};
