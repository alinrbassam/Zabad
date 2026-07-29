import React, { useEffect, useState } from 'react';
import { usePurchasingStore } from '@stores/usePurchasingStore';
import { Card } from '@components/ui/Card';
import { Table, Column } from '@components/ui/Table';
import { SearchBox } from '@components/ui/SearchBox';
import { Badge } from '@components/ui/Badge';
import { PurchaseOrderEntity } from '@shared/types';
import { History } from 'lucide-react';

export const PurchasingHistoryPage: React.FC = () => {
  const { orders, loadOrders } = usePurchasingStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOrders(search);
  }, [search, loadOrders]);

  const columns: Column<PurchaseOrderEntity & { supplier_name?: string }>[] = [
    {
      key: 'po_number',
      header: 'Reference #',
      render: (po) => (
        <div>
          <span className="font-bold text-sky-600 block">{po.po_number}</span>
          <span className="text-[10px] text-slate-400">
            {new Date(po.created_at).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: 'supplier_name',
      header: 'Supplier',
      render: (po) => <span className="font-bold">{po.supplier_name || 'N/A'}</span>,
    },
    {
      key: 'grand_total',
      header: 'Total Value',
      render: (po) => <span className="font-black">${po.grand_total.toFixed(2)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (po) => <Badge variant="info">{po.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <History className="h-6 w-6 text-sky-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Purchasing History
          </h1>
          <p className="text-xs text-slate-500">
            Historical archive of purchase orders, goods receipts, and vendor invoices.
          </p>
        </div>
      </div>

      <Card className="space-y-4">
        <div className="max-w-md">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search historical purchases by number or vendor..."
          />
        </div>
        <Table columns={columns} data={orders} keyExtractor={(po) => po.id} />
      </Card>
    </div>
  );
};
