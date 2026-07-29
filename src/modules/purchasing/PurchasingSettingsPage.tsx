import React, { useState } from 'react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Settings } from 'lucide-react';

export const PurchasingSettingsPage: React.FC = () => {
  const [poPrefix, setPoPrefix] = useState('PO');
  const [grPrefix, setGrPrefix] = useState('GR');
  const [prPrefix, setPrPrefix] = useState('PR');
  const [costMethod, setCostMethod] = useState('weighted_average');
  const [requireApproval, setRequireApproval] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Purchasing settings updated successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3">
        <Settings className="h-6 w-6 text-sky-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Purchasing Settings
          </h1>
          <p className="text-xs text-slate-500">
            Configure numbering sequences, approval requirements, and cost calculation rules.
          </p>
        </div>
      </div>

      <Card title="Module Configuration">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                PO Number Prefix
              </label>
              <input
                type="text"
                value={poPrefix}
                onChange={(e) => setPoPrefix(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                GR Number Prefix
              </label>
              <input
                type="text"
                value={grPrefix}
                onChange={(e) => setGrPrefix(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Return Prefix
              </label>
              <input
                type="text"
                value={prPrefix}
                onChange={(e) => setPrPrefix(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Cost Update Algorithm
            </label>
            <select
              value={costMethod}
              onChange={(e) => setCostMethod(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
            >
              <option value="weighted_average">Weighted Average Cost (Recommended)</option>
              <option value="last_cost">Last Purchase Cost Only</option>
              <option value="manual">Manual Cost Update Only</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={requireApproval}
              onChange={(e) => setRequireApproval(e.target.checked)}
              className="rounded border-slate-300 text-sky-600"
            />
            <span>Require Owner Approval for Purchase Orders</span>
          </label>

          <div className="pt-2 flex justify-end">
            <Button type="submit">Save Purchasing Settings</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
