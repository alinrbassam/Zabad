import React, { useEffect, useState } from 'react';
import { usePOSStore } from '@stores/usePOSStore';
import { useAuthStore } from '@stores/useAuthStore';
import { Card } from '@components/ui/Card';
import { Table, Column } from '@components/ui/Table';
import { SearchBox } from '@components/ui/SearchBox';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { SalesOrderEntity } from '@shared/types';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { History, Printer, Undo2 } from 'lucide-react';

export const SalesHistoryPage: React.FC = () => {
  const { salesHistory, loadSalesHistory, selectedSale, loadSaleById, processRefund } =
    usePOSStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [activeReceiptSale, setActiveReceiptSale] = useState<SalesOrderEntity | null>(null);

  useEffect(() => {
    loadSalesHistory(search);
  }, [search, loadSalesHistory]);

  const handleReprint = async (sale: SalesOrderEntity) => {
    await loadSaleById(sale.id);
    setActiveReceiptSale(sale);
  };

  const handleRefund = async (sale: SalesOrderEntity) => {
    if (!confirm(`Are you sure you want to refund receipt ${sale.invoice_number}?`)) return;
    const ok = await processRefund(
      {
        saleId: sale.id,
        reason: 'Customer return',
        refundMethod: 'Cash',
        items: [
          {
            saleItemId: 'item-1',
            productId: 'p-1',
            returnedQty: 1,
            refundAmount: sale.grand_total,
          },
        ],
      },
      user?.id,
    );
    if (ok) {
      alert('Sale refunded successfully');
    }
  };

  const columns: Column<SalesOrderEntity>[] = [
    {
      key: 'invoice_number',
      header: 'Receipt #',
      render: (s) => (
        <div>
          <span className="font-bold text-sky-600 block">{s.invoice_number}</span>
          <span className="text-[10px] text-slate-400">
            {new Date(s.created_at).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: 'payment_method',
      header: 'Payment Method',
      render: (s) => <Badge variant="neutral">{s.payment_method}</Badge>,
    },
    {
      key: 'grand_total',
      header: 'Grand Total',
      render: (s) => (
        <span className="font-black text-slate-900 dark:text-slate-100">
          ${s.grand_total.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'payment_status',
      header: 'Status',
      render: (s) => {
        let variant: 'success' | 'danger' | 'warning' | 'neutral' = 'success';
        if (s.payment_status === 'Refunded' || s.payment_status === 'Voided') variant = 'danger';
        return <Badge variant={variant}>{s.payment_status}</Badge>;
      },
    },
    {
      key: 'id',
      header: 'Actions',
      render: (s) => (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleReprint(s)}>
            <Printer className="h-3 w-3 mr-1" />
            Receipt
          </Button>

          {s.payment_status === 'Paid' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRefund(s)}
              className="text-rose-600"
            >
              <Undo2 className="h-3 w-3 mr-1" />
              Refund
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <History className="h-6 w-6 text-sky-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            POS Sales History
          </h1>
          <p className="text-xs text-slate-500">
            Completed register receipts, thermal reprints, voids, and refunds.
          </p>
        </div>
      </div>

      <Card className="space-y-4">
        <div className="max-w-md">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search by receipt invoice number..."
          />
        </div>
        <Table columns={columns} data={salesHistory} keyExtractor={(s) => s.id} />
      </Card>

      <ThermalReceiptModal
        isOpen={Boolean(activeReceiptSale)}
        onClose={() => setActiveReceiptSale(null)}
        sale={selectedSale || activeReceiptSale}
      />
    </div>
  );
};
