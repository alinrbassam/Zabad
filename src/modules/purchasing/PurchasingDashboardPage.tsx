import React, { useEffect } from 'react';
import { usePurchasingStore } from '@stores/usePurchasingStore';
import { Card } from '@components/ui/Card';
import { ShoppingBag, Clock, AlertTriangle, TrendingUp, Users } from 'lucide-react';

export const PurchasingDashboardPage: React.FC = () => {
  const { dashboardMetrics, loadDashboardMetrics } = usePurchasingStore();

  useEffect(() => {
    loadDashboardMetrics();
  }, [loadDashboardMetrics]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Purchasing Dashboard
        </h1>
        <p className="text-xs text-slate-500">
          Overview of purchase orders, pending vendor deliveries, and supplier performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center space-x-4 border-l-4 border-l-sky-500">
          <div className="h-10 w-10 bg-sky-100 dark:bg-sky-900/40 rounded-xl flex items-center justify-center text-sky-600">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Draft POs</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {dashboardMetrics?.draftsCount || 0}
            </h3>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 border-l-4 border-l-amber-500">
          <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Ordered / Pending
            </span>
            <h3 className="text-lg font-black text-amber-600 dark:text-amber-400">
              {dashboardMetrics?.orderedCount || 0}
            </h3>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 border-l-4 border-l-rose-500">
          <div className="h-10 w-10 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Overdue Deliveries
            </span>
            <h3 className="text-lg font-black text-rose-600 dark:text-rose-400">
              {dashboardMetrics?.overdueCount || 0}
            </h3>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 border-l-4 border-l-emerald-500">
          <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Purchases This Month
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              $
              {(dashboardMetrics?.monthlyPurchasesTotal || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </h3>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Top Suppliers by Purchase Value">
          <div className="space-y-3">
            {dashboardMetrics?.topSuppliers.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                </div>
                <span className="font-black text-slate-900 dark:text-slate-100">
                  ${s.total_purchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}

            {(!dashboardMetrics?.topSuppliers || dashboardMetrics.topSuppliers.length === 0) && (
              <div className="py-6 text-center text-xs text-slate-500">
                No purchasing history yet.
              </div>
            )}
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-2 text-xs">
            <p className="text-slate-500">Shortcuts for inventory procurement workflows:</p>
            <div className="flex flex-col space-y-2 pt-2">
              <a
                href="#/purchasing/orders/new"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-center transition-all"
              >
                + Create New Purchase Order
              </a>
              <a
                href="#/purchasing/direct"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-center transition-all"
              >
                + Direct Store Purchase & Receiving
              </a>
              <a
                href="#/purchasing/pending"
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-center font-medium transition-all"
              >
                View Pending Deliveries →
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
