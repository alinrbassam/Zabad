import React, { useEffect } from 'react';
import { useReportsStore } from '@stores/useReportsStore';
import { useAuthStore } from '@stores/useAuthStore';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Alert } from '@components/ui/Alert';
import { Layers, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../../renderer/utils/currency';

export const FinancialReportPage: React.FC = () => {
  const { startDate, endDate, setDateRange, financialMetrics, loadFinancialReport, error } =
    useReportsStore();
  const { role } = useAuthStore();

  const isOwner = role?.name === 'Owner' || !role;

  useEffect(() => {
    if (isOwner) {
      loadFinancialReport(role?.name);
    }
  }, [startDate, endDate, role, isOwner, loadFinancialReport]);

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          Financial Profit & Loss statements are strictly restricted to Business Owners.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Layers className="h-6 w-6 text-emerald-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Financial Profit & Loss (P&L)
            </h1>
            <p className="text-xs text-slate-500">
              Gross revenue, Cost of Goods Sold (COGS), operating expenses, and Net Profit.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setDateRange(e.target.value, endDate)}
            className="text-xs border-none p-1"
          />
          <span className="text-slate-400 text-xs">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setDateRange(startDate, e.target.value)}
            className="text-xs border-none p-1"
          />
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-sky-500 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Revenue</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(financialMetrics?.revenue || 0)}
          </h3>
        </Card>

        <Card className="border-l-4 border-l-amber-500 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Cost of Goods Sold (COGS)
          </span>
          <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {formatCurrency(financialMetrics?.cogs || 0)}
          </h3>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Net Profit</span>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(financialMetrics?.netProfit || 0)}
          </h3>
          <span className="text-[10px] text-slate-500">
            Margin: {financialMetrics?.profitMarginPercent || 0}%
          </span>
        </Card>
      </div>

      <Card title="P&L Breakdown Statement">
        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Gross Sales Revenue:
            </span>
            <span className="font-bold font-mono">{formatCurrency(financialMetrics?.revenue || 0)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Less: Cost of Goods Sold (COGS):
            </span>
            <span className="font-bold text-rose-500 font-mono">-{formatCurrency(financialMetrics?.cogs || 0)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-2 rounded font-bold text-emerald-600">
            <span>Gross Profit:</span>
            <span className="font-mono">{formatCurrency(financialMetrics?.grossProfit || 0)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Less: Operating Expenses (Electricity, Water, Ice, etc.):
            </span>
            <span className="font-bold text-rose-500 font-mono">-{formatCurrency(financialMetrics?.expenses || 0)}</span>
          </div>

          <div className="flex justify-between py-3 border-t-2 border-slate-900 dark:border-slate-100 text-base font-black text-emerald-600">
            <span>Net Operating Profit:</span>
            <span className="font-mono">{formatCurrency(financialMetrics?.netProfit || 0)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
