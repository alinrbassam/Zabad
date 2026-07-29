import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchasingStore } from '@stores/usePurchasingStore';
import { Card } from '@components/ui/Card';
import { Table, Column } from '@components/ui/Table';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { PurchaseOrderEntity } from '@shared/types';
import { Clock, Truck } from 'lucide-react';

export const PendingDeliveriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, loadOrders } = usePurchasingStore();

  useEffect(() => {
    loadOrders('', 'Ordered');
  }, [loadOrders]);

  const columns: Column<PurchaseOrderEntity & { supplier_name?: string }>[] = [
    {
      key: 'po_number',
      header: 'PO Number',
      render: (po) => <span className="font-bold text-sky-600">{po.po_number}</span>,
    },
    {
      key: 'supplier_name',
      header: 'Supplier',
      render: (po) => <span className="font-bold">{po.supplier_name || 'N/A'}</span>,
    },
    {
      key: 'expected_delivery_date',
      header: 'Expected Date',
      render: (po) => {
        const isOverdue =
          po.expected_delivery_date && new Date(po.expected_delivery_date) < new Date();
        return (
          <span
            className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}
          >
            {po.expected_delivery_date || 'Not specified'}
          </span>
        );
      },
    },
    {
      key: 'grand_total',
      header: 'Value',
      render: (po) => <span className="font-bold">${po.grand_total.toFixed(2)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (po) => <Badge variant="warning">{po.status}</Badge>,
    },
    {
      key: 'id',
      header: 'Action',
      render: (po) => (
        <Button size="sm" onClick={() => navigate(`/purchasing/receiving?poId=${po.id}`)}>
          <Truck className="h-3 w-3 mr-1" />
          Receive Goods
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Clock className="h-6 w-6 text-amber-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Pending Deliveries
          </h1>
          <p className="text-xs text-slate-500">
            Track outstanding vendor deliveries and expected incoming stock shipments.
          </p>
        </div>
      </div>

      <Card>
        <Table columns={columns} data={orders} keyExtractor={(po) => po.id} />
      </Card>
    </div>
  );
};
