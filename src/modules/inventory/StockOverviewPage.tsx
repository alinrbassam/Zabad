import React, { useEffect } from 'react';
import { useInventoryStore } from '@stores/useInventoryStore';
import { Table, Column } from '@components/ui/Table';
import { Card } from '@components/ui/Card';
import { InventoryMovementEntity } from '@shared/types';
import { Boxes } from 'lucide-react';

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
          {new Date(m.created_at).toLocaleString()}
        </span>
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
      render: (m) => (
        <span
          className={`font-black ${m.quantity_change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}
        >
          {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
        </span>
      ),
    },
    {
      key: 'quantity_after',
      header: 'Balance After',
      render: (m) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300">{m.quantity_after}</span>
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
