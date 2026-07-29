import React, { useState } from 'react';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';

export const RegionalSettings: React.FC = () => {
  const [symbol, setSymbol] = useState('$');
  const [pos, setPos] = useState('prefix');
  const [decimals, setDecimals] = useState('2');

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
        Regional & Formatting Settings
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Currency Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Symbol Position
          </label>
          <select
            value={pos}
            onChange={(e) => setPos(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
          >
            <option value="prefix">Before Amount ($100)</option>
            <option value="suffix">After Amount (100 $)</option>
          </select>
        </div>
        <Input
          label="Decimal Places"
          value={decimals}
          onChange={(e) => setDecimals(e.target.value)}
        />
      </div>

      <div className="pt-2 flex justify-end">
        <Button>Save Regional Settings</Button>
      </div>
    </div>
  );
};
