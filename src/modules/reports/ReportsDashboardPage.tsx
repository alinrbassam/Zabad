import React, { useEffect } from 'react';
import { useReportsStore } from '@stores/useReportsStore';
import { useAuthStore } from '@stores/useAuthStore';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  AlertTriangle,
  Award,
  Calendar,
  Layers,
} from 'lucide-react';

export const ReportsDashboardPage: React.FC = () => {
  const { startDate, endDate, setDateRange, dashboardMetrics, loadDashboardMetrics } =
    useReportsStore();

  const { role } = useAuthStore();
  const isOwner = role?.name === 'Owner' || !role;

  useEffect(() => {
    loadDashboardMetrics(role?.name);
  }, [startDate, endDate, role, loadDashboardMetrics]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Analytics & Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Real-time business performance metrics, sales totals, and stock valuation.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
          <Calendar className="h-4 w-4 text-slate-400" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setDateRange(e.target.value, endDate)}
            className="text-xs border-none p-1 bg-transparent"
          />
          <span className="text-slate-400 text-xs">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setDateRange(startDate, e.target.value)}
            className="text-xs border-none p-1 bg-transparent"
          />
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-sky-500 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Gross Revenue</span>
            <DollarSign className="h-4 w-4 text-sky-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            $
            {(dashboardMetrics?.grossRevenue || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </h3>
          <span className="text-[10px] text-slate-500">
            {dashboardMetrics?.totalTransactions || 0} Paid Transactions
          </span>
        </Card>

        {isOwner && (
          <Card className="border-l-4 border-l-emerald-500 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>Gross Profit</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              $
              {(dashboardMetrics?.grossProfit || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </h3>
            <span className="text-[10px] text-slate-500">
              COGS: ${dashboardMetrics?.cogs?.toFixed(2)}
            </span>
          </Card>
        )}

        <Card className="border-l-4 border-l-amber-500 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Average Ticket</span>
            <Receipt className="h-4 w-4 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            ${(dashboardMetrics?.averageSale || 0).toFixed(2)}
          </h3>
          <span className="text-[10px] text-slate-500">
            Discounts: ${dashboardMetrics?.totalDiscounts?.toFixed(2)}
          </span>
        </Card>

        <Card className="border-l-4 border-l-rose-500 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {dashboardMetrics?.lowStockCount || 0}
          </h3>
          <span className="text-[10px] text-slate-500">
            Out of Stock: {dashboardMetrics?.outOfStockCount || 0} items
          </span>
        </Card>
      </div>

      {/* Top Sellers Table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Top Selling Products" className="md:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-center">Qty Sold</th>
                  <th className="p-3 text-right">Revenue (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {dashboardMetrics?.topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-sky-600">#{idx + 1}</td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                      {p.name_en}
                    </td>
                    <td className="p-3 text-center font-bold">{p.totalQty}</td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">
                      ${p.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}

                {(!dashboardMetrics?.topProducts || dashboardMetrics.topProducts.length === 0) && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      No sales recorded for the selected date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Report Shortcuts */}
        <Card title="Report Navigation">
          <div className="space-y-3 text-xs">
            <a
              href="#/reports/sales"
              className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all"
            >
              <Receipt className="h-5 w-5 text-sky-500" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Sales Reports
                </span>
                <span className="text-[10px] text-slate-400">
                  Breakdown by payment, product & cashier
                </span>
              </div>
            </a>

            <a
              href="#/reports/products"
              className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all"
            >
              <Award className="h-5 w-5 text-amber-500" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Product Performance
                </span>
                <span className="text-[10px] text-slate-400">
                  Best & worst sellers, unit profits
                </span>
              </div>
            </a>

            {isOwner && (
              <a
                href="#/reports/financial"
                className="flex items-center space-x-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-all text-emerald-900 dark:text-emerald-100"
              >
                <Layers className="h-5 w-5 text-emerald-500" />
                <div>
                  <span className="font-bold block">Financial P&L Statement</span>
                  <span className="text-[10px] text-slate-400">Gross profit, COGS, net profit</span>
                </div>
              </a>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
