import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchasingStore } from '@stores/usePurchasingStore';
import { Table, Column } from '@components/ui/Table';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { SearchBox } from '@components/ui/SearchBox';
import { PurchaseOrderEntity } from '@shared/types';
import { Plus, Eye, Truck } from 'lucide-react';

export const PurchaseOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, loadOrders } = usePurchasingStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadOrders(search, statusFilter);
  }, [search, statusFilter, loadOrders]);

  const columns: Column<PurchaseOrderEntity & { supplier_name?: string }>[] = [
    {
      key: 'po_number',
      header: 'PO Number',
      render: (po) => (
        <div>
          <span className="font-bold text-sky-600 dark:text-sky-400 block">{po.po_number}</span>
          <span className="text-[10px] text-slate-400">
            {new Date(po.order_date).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: 'supplier_name',
      header: 'Supplier',
      render: (po) => (
        <span className="font-bold text-slate-800 dark:text-slate-200">
          {po.supplier_name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'grand_total',
      header: 'Total Value',
      render: (po) => (
        <span className="font-black text-slate-900 dark:text-slate-100">
          ${po.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (po) => {
        let variant: 'info' | 'warning' | 'success' | 'danger' | 'neutral' = 'neutral';
        if (po.status === 'Approved' || po.status === 'Ordered') variant = 'info';
        if (po.status === 'Partially received') variant = 'warning';
        if (po.status === 'Fully received' || po.status === 'Closed') variant = 'success';
        if (po.status === 'Cancelled') variant = 'danger';

        return <Badge variant={variant}>{po.status}</Badge>;
      },
    },
    {
      key: 'id',
      header: 'Actions',
      render: (po) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/purchasing/orders/${po.id}`)}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>

          {po.status !== 'Fully received' && po.status !== 'Cancelled' && (
            <Button size="sm" onClick={() => navigate(`/purchasing/receiving?poId=${po.id}`)}>
              <Truck className="h-3 w-3 mr-1" />
              Receive
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Purchase Orders</h1>
          <p className="text-xs text-slate-500">
            Manage supplier purchase orders, track approvals, and receive goods.
          </p>
        </div>

        <Button
          onClick={() => navigate('/purchasing/orders/new')}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Purchase Order</span>
        </Button>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search by PO # or supplier name..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Approved">Approved</option>
            <option value="Ordered">Ordered</option>
            <option value="Partially received">Partially Received</option>
            <option value="Fully received">Fully Received</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <Table columns={columns} data={orders} keyExtractor={(po) => po.id} />
      </Card>
    </div>
  );
};
