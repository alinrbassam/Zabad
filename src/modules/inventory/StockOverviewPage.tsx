import React, { useEffect } from 'react';
import { useInventoryStore } from '@stores/useInventoryStore';
import { Table, Column } from '@components/ui/Table';
import { Card } from '@components/ui/Card';
import { InventoryMovementEntity } from '@shared/types';
import { Boxes } from 'lucide-react';
import { formatDateTime } from '@utils/date';

export const StockOverviewPage: React.FC = () => {
  const { movements, loadMovements } = useInventoryStore();

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const columns: Column<InventoryMovementEntity>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (m) => (
        <span className="font-mono text-slate-500 text-[11px]">
          {formatDateTime(m.created_at)}
        </span>
      ),
    },
    {
      key: 'product_name' as keyof InventoryMovementEntity,
      header: 'Product',
      render: (m) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">
            {m.product_name || 'Product'}
          </span>
          {m.sku && <span className="text-[10px] font-mono text-slate-400">[{m.sku}]</span>}
        </div>
      ),
    },
    {
      key: 'movement_type',
      header: 'Movement Type',
      render: (m) => (
        <span className="font-bold text-slate-800 dark:text-slate-200">{m.movement_type}</span>
      ),
    },
    {
      key: 'quantity_change',
      header: 'Qty Change',
      render: (m) => {
        const isPos = m.quantity_change > 0;
        return (
          <span className={`font-black ${isPos ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPos ? `+${m.quantity_change}` : m.quantity_change} {m.unit_symbol || ''}
          </span>
        );
      },
    },
    {
      key: 'quantity_after',
      header: 'Before ➔ After',
      render: (m) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {m.quantity_before} ➔ <span className="font-bold text-slate-900 dark:text-slate-100">{m.quantity_after}</span> {m.unit_symbol || ''}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason / Reference',
      render: (m) => <span className="text-slate-500 text-xs">{m.reason || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Boxes className="h-6 w-6 text-sky-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Stock Movements & Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Immutable transaction history of all stock entries, manual adjustments, and inventory
            changes.
          </p>
        </div>
      </div>

      <Card>
        <Table columns={columns} data={movements} keyExtractor={(m) => m.id} />
      </Card>
    </div>
  );
};
