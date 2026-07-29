import React, { useEffect } from 'react';
import { useReportsStore } from '@stores/useReportsStore';
import { useAuthStore } from '@stores/useAuthStore';
import { Card } from '@components/ui/Card';
import { Table, Column } from '@components/ui/Table';
import { Boxes } from 'lucide-react';

export const InventoryReportPage: React.FC = () => {
  const { inventoryData, loadInventoryReport } = useReportsStore();
  const { role } = useAuthStore();
  const isOwner = role?.name === 'Owner' || !role;

  useEffect(() => {
    loadInventoryReport(role?.name);
  }, [role, loadInventoryReport]);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name_en',
      header: 'Product Name',
      render: (r) => (
        <div>
          <span className="font-bold block">{String(r.name_en)}</span>
          <span className="text-[10px] text-slate-400">SKU: {String(r.sku)}</span>
        </div>
      ),
    },
    {
      key: 'stock_qty',
      header: 'Current Stock Qty',
      render: (r) => <span className="font-bold">{Number(r.stock_qty)}</span>,
    },
    {
      key: 'selling_price',
      header: 'Retail Price ($)',
      render: (r) => <span>${Number(r.selling_price).toFixed(2)}</span>,
    },
    {
      key: 'total_retail_value',
      header: 'Total Retail Value ($)',
      render: (r) => <span className="font-bold">${Number(r.total_retail_value).toFixed(2)}</span>,
    },
    ...(isOwner
      ? [
          {
            key: 'avg_cost',
            header: 'Avg Cost ($)',
            render: (r: Record<string, unknown>) => (
              <span>${Number(r.avg_cost || 0).toFixed(2)}</span>
            ),
          },
          {
            key: 'total_cost_value',
            header: 'Total Cost Valuation ($)',
            render: (r: Record<string, unknown>) => (
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                ${Number(r.total_cost_value || 0).toFixed(2)}
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Boxes className="h-6 w-6 text-sky-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Inventory Valuation Report
          </h1>
          <p className="text-xs text-slate-500">
            Stock quantities on hand, cost valuation, and total retail value.
          </p>
        </div>
      </div>

      <Card>
        <Table columns={columns} data={inventoryData} keyExtractor={(r) => String(r.id)} />
      </Card>
    </div>
  );
};
