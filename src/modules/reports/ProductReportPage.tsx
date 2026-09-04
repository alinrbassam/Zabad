import React, { useEffect } from 'react';
import { useReportsStore } from '@stores/useReportsStore';
import { useAuthStore } from '@stores/useAuthStore';
import { Card } from '@components/ui/Card';
import { Table, Column } from '@components/ui/Table';
import { Award } from 'lucide-react';
import { formatCurrency } from '@renderer/utils/currency';

export const ProductReportPage: React.FC = () => {
  const { productData, loadProductReport } = useReportsStore();
  const { role } = useAuthStore();
  const isOwner = role?.name === 'Owner' || !role;

  useEffect(() => {
    loadProductReport(role?.name);
  }, [role, loadProductReport]);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name_en',
      header: 'Product Name',
      render: (r) => (
        <div>
          <span className="font-bold block text-slate-800 dark:text-slate-200">
            {String(r.name_en)}
          </span>
          <span className="text-[10px] text-slate-400">SKU: {String(r.sku)}</span>
        </div>
      ),
    },
    {
      key: 'total_sold_qty',
      header: 'Qty Sold',
      render: (r) => <span className="font-bold">{Number(r.total_sold_qty)}</span>,
    },
    {
      key: 'total_revenue',
      header: 'Total Revenue (FCFA)',
      render: (r) => (
        <span className="font-black text-slate-900 dark:text-slate-100">
          {formatCurrency(Number(r.total_revenue))}
        </span>
      ),
    },
    ...(isOwner
      ? [
          {
            key: 'total_cost',
            header: 'Total Cost (FCFA)',
            render: (r: Record<string, unknown>) => (
              <span>{formatCurrency(Number(r.total_cost || 0))}</span>
            ),
          },
          {
            key: 'total_profit',
            header: 'Gross Profit (FCFA)',
            render: (r: Record<string, unknown>) => (
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(Number(r.total_profit || 0))}
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Award className="h-6 w-6 text-amber-500" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Product Performance Report
          </h1>
          <p className="text-xs text-slate-500">
            Best selling products, total revenues, and profit margins.
          </p>
        </div>
      </div>

      <Card>
        <Table columns={columns} data={productData} keyExtractor={(r) => String(r.id)} />
      </Card>
    </div>
  );
};
