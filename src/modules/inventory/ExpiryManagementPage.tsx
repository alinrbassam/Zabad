import React, { useEffect, useState } from 'react';
import { useInventoryStore } from '@stores/useInventoryStore';
import { Table, Column } from '@components/ui/Table';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { BatchEntity } from '@shared/types';
import { Calendar, AlertCircle } from 'lucide-react';
import { formatDate } from '@utils/date';

export const ExpiryManagementPage: React.FC = () => {
  const { expiringBatches, loadExpiringBatches, createAdjustment } = useInventoryStore();
  const [daysWindow, setDaysWindow] = useState(30);

  useEffect(() => {
    loadExpiringBatches(daysWindow);
  }, [loadExpiringBatches, daysWindow]);

  const handleRemoveExpired = async (batch: BatchEntity) => {
    if (
      confirm(
        `Remove remaining ${batch.remaining_qty} items from expired batch ${batch.batch_number}?`,
      )
    ) {
      await createAdjustment({
        productId: batch.product_id,
        batchId: batch.id,
        movementType: 'Expired stock',
        quantityChange: -batch.remaining_qty,
        reason: `Removed Expired Batch ${batch.batch_number}`,
      });
      loadExpiringBatches(daysWindow);
    }
  };

  const columns: Column<BatchEntity>[] = [
    {
      key: 'batch_number',
      header: 'Batch Number',
      render: (b) => (
        <span className="font-bold text-slate-800 dark:text-slate-200">{b.batch_number}</span>
      ),
    },
    {
      key: 'expiry_date',
      header: 'Expiry Date',
      render: (b) => (
        <span className="font-mono text-xs text-rose-500 font-bold">
          {formatDate(b.expiry_date)}
        </span>
      ),
    },
    {
      key: 'remaining_qty',
      header: 'Remaining Stock',
      render: (b) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300">{b.remaining_qty}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => (
        <Badge variant={b.status === 'Expired' ? 'danger' : 'warning'}>{b.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (b) => (
        <Button variant="outline" size="sm" onClick={() => handleRemoveExpired(b)}>
          Dispose Expired Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-sky-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Expiry Management
            </h1>
            <p className="text-xs text-slate-500">
              Track products and batches nearing expiry date or expired items.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500">Warning Window:</span>
          <select
            value={daysWindow}
            onChange={(e) => setDaysWindow(Number(e.target.value))}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
          >
            <option value={7}>Next 7 Days</option>
            <option value={30}>Next 30 Days</option>
            <option value={60}>Next 60 Days</option>
            <option value={90}>Next 90 Days</option>
          </select>
        </div>
      </div>

      <Card>
        {expiringBatches.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center space-y-2">
            <AlertCircle className="h-8 w-8 text-emerald-500" />
            <span>No batches expiring within the selected {daysWindow}-day window.</span>
          </div>
        ) : (
          <Table columns={columns} data={expiringBatches} keyExtractor={(b) => b.id} />
        )}
      </Card>
    </div>
  );
};
