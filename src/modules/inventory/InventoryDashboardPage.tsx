import React, { useEffect } from 'react';
import { useInventoryStore } from '@stores/useInventoryStore';
import { Card } from '@components/ui/Card';
import { Package, AlertTriangle, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { formatDateTime } from '@utils/date';

export const InventoryDashboardPage: React.FC = () => {
  const { summary, loadSummary, movements, loadMovements } = useInventoryStore();

  useEffect(() => {
    loadSummary();
    loadMovements(undefined);
  }, [loadSummary, loadMovements]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Inventory Dashboard
        </h1>
        <p className="text-xs text-slate-500">
          Real-time stock valuation, inventory health indicators, low stock, and expiring batch
          metrics.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center space-x-4 border-l-4 border-l-sky-500">
          <div className="h-10 w-10 bg-sky-100 dark:bg-sky-900/40 rounded-xl flex items-center justify-center text-sky-600">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Total Active Products
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {summary?.totalProducts || 0}
            </h3>
            <span className="text-[10px] text-slate-500">
              Stock Qty: {summary?.totalStockQty || 0}
            </span>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 border-l-4 border-l-emerald-500">
          <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Inventory Cost Value
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              $
              {(summary?.totalCostValue || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </h3>
            <span className="text-[10px] text-slate-500">
              Selling: $
              {(summary?.totalSellingValue || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 border-l-4 border-l-amber-500">
          <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Low Stock Alerts</span>
            <h3 className="text-lg font-black text-amber-600 dark:text-amber-400">
              {summary?.lowStockCount || 0}
            </h3>
            <span className="text-[10px] text-slate-500">
              Out of Stock: {summary?.outOfStockCount || 0}
            </span>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 border-l-4 border-l-rose-500">
          <div className="h-10 w-10 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center text-rose-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Expiring Batches</span>
            <h3 className="text-lg font-black text-rose-600 dark:text-rose-400">
              {summary?.expiringSoonCount || 0}
            </h3>
            <span className="text-[10px] text-slate-500">
              Expired: {summary?.expiredCount || 0}
            </span>
          </div>
        </Card>
      </div>

      {/* Recent Ledger Activity */}
      <Card title="Recent Stock Movement Ledger">
        <div className="space-y-2">
          {movements.slice(0, 5).map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {m.movement_type}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Product ID: {m.product_id} • {formatDateTime(m.created_at)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`font-black text-xs ${
                    m.quantity_change > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Balance: {m.quantity_after}
                </span>
              </div>
            </div>
          ))}

          {movements.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500">
              No stock movements recorded yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
