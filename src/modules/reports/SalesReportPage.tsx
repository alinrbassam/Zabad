import React, { useEffect, useState } from 'react';
import { useReportsStore } from '@stores/useReportsStore';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Table, Column } from '@components/ui/Table';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Receipt, Download } from 'lucide-react';

export const SalesReportPage: React.FC = () => {
  const { startDate, endDate, setDateRange, salesData, loadSalesReport, exportCsv } =
    useReportsStore();
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    loadSalesReport(undefined, paymentMethod || undefined);
  }, [startDate, endDate, paymentMethod, loadSalesReport]);

  const handleExport = async () => {
    const csv = await exportCsv(salesData);
    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sales_Report_${startDate}_to_${endDate}.csv`;
      a.click();
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice #',
      render: (r) => (
        <div>
          <span className="font-bold text-sky-600 block">{String(r.invoice_number)}</span>
          <span className="text-[10px] text-slate-400">
            {new Date(String(r.created_at)).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: 'payment_method',
      header: 'Method',
      render: (r) => <Badge variant="neutral">{String(r.payment_method)}</Badge>,
    },
    {
      key: 'subtotal',
      header: 'Subtotal ($)',
      render: (r) => <span>${Number(r.subtotal).toFixed(2)}</span>,
    },
    {
      key: 'tax_total',
      header: 'Tax ($)',
      render: (r) => <span>${Number(r.tax_total).toFixed(2)}</span>,
    },
    {
      key: 'grand_total',
      header: 'Grand Total ($)',
      render: (r) => <span className="font-black">${Number(r.grand_total).toFixed(2)}</span>,
    },
    {
      key: 'payment_status',
      header: 'Status',
      render: (r) => <Badge variant="success">{String(r.payment_status)}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Receipt className="h-6 w-6 text-sky-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Sales Reports</h1>
            <p className="text-xs text-slate-500">
              Filter sales receipts, payment breakdown, and export CSV data.
            </p>
          </div>
        </div>

        <Button onClick={handleExport} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      <Card className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="From Date"
            type="date"
            value={startDate}
            onChange={(e) => setDateRange(e.target.value, endDate)}
          />
          <Input
            label="To Date"
            type="date"
            value={endDate}
            onChange={(e) => setDateRange(startDate, e.target.value)}
          />
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
            >
              <option value="">All Payment Methods</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Split">Split Payment</option>
            </select>
          </div>
        </div>

        <Table columns={columns} data={salesData} keyExtractor={(r) => String(r.id)} />
      </Card>
    </div>
  );
};
