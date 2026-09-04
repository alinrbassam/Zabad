import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StockAdjustmentSchema, StockAdjustmentInput } from '@shared/validation';
import { useProductStore } from '@stores/useProductStore';
import { useInventoryStore } from '@stores/useInventoryStore';
import { useAuthStore } from '@stores/useAuthStore';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Alert } from '@components/ui/Alert';
import { Table, Column } from '@components/ui/Table';
import { InventoryMovementEntity } from '@shared/types';
import { Sliders } from 'lucide-react';
import { formatDateTime } from '@utils/date';

export const StockAdjustmentsPage: React.FC = () => {
  const { products, loadProducts } = useProductStore();
  const { createAdjustment, movements, loadMovements, isLoading, error } = useInventoryStore();
  const { user } = useAuthStore();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<StockAdjustmentInput>({
    resolver: zodResolver(StockAdjustmentSchema),
    defaultValues: {
      productId: '',
      movementType: 'Manual addition',
      quantityChange: 1,
      reason: 'Physical Count Adjustment',
      notes: '',
    },
  });

  const selectedProductId = watch('productId');
  const selectedMovementType = watch('movementType');
  const selectedQtyChange = watch('quantityChange');

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentStock = selectedProduct?.quantity_on_hand ?? 0;
  const unit = selectedProduct?.unit_symbol || '';

  const isDeduction = [
    'Manual deduction',
    'Damaged stock',
    'Expired stock',
    'Lost stock',
  ].includes(selectedMovementType);

  const delta = isDeduction
    ? -Math.abs(Number(selectedQtyChange) || 0)
    : Math.abs(Number(selectedQtyChange) || 0);

  const newStock = currentStock + delta;

  useEffect(() => {
    loadProducts('');
    loadMovements();
  }, [loadProducts, loadMovements]);

  const onSubmit = async (data: StockAdjustmentInput) => {
    setSuccessMsg(null);
    const ok = await createAdjustment(data, user?.id);
    if (ok) {
      setSuccessMsg('Stock adjustment recorded successfully in movement ledger!');
      await loadProducts('');
      await loadMovements();
      reset({
        productId: '',
        movementType: 'Manual addition',
        quantityChange: 1,
        reason: 'Physical Count Adjustment',
        notes: '',
      });
    }
  };

  const historyColumns: Column<InventoryMovementEntity>[] = [
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
      header: 'Type',
      render: (m) => (
        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
          {m.movement_type}
        </span>
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
          {m.quantity_before} ➔{' '}
          <span className="font-bold text-slate-900 dark:text-slate-100">{m.quantity_after}</span>{' '}
          {m.unit_symbol || ''}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (m) => <span className="text-slate-500 text-xs">{m.reason || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3">
        <Sliders className="h-6 w-6 text-sky-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Manual Stock Adjustment
          </h1>
          <p className="text-xs text-slate-500">
            Record manual stock additions, corrections, damaged, or lost inventory entries.
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Product *
            </label>
            <select
              {...register('productId')}
              className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              <option value="">Choose a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name_en} ({p.sku}) [Stock: {p.quantity_on_hand ?? 0} {p.unit_symbol || ''}]
                </option>
              ))}
            </select>
            {errors.productId && (
              <span className="text-xs text-rose-500">{errors.productId.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Adjustment Type *
              </label>
              <select
                {...register('movementType')}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="Manual addition">Manual Addition (+)</option>
                <option value="Manual deduction">Manual Deduction (-)</option>
                <option value="Stock correction">Stock Correction</option>
                <option value="Damaged stock">Damaged Stock (-)</option>
                <option value="Expired stock">Expired Stock (-)</option>
                <option value="Lost stock">Lost Stock (-)</option>
              </select>
            </div>

            <Input
              label="Quantity Change *"
              type="number"
              step="0.01"
              {...register('quantityChange', { valueAsNumber: true })}
              error={errors.quantityChange?.message}
            />
          </div>
          {selectedProduct && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Adjustment Impact Preview
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[10px] block">Current Stock</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {currentStock} {unit}
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[10px] block">Adjustment</span>
                  <span
                    className={`font-black text-sm ${
                      delta < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta} {unit}
                  </span>
                </div>
                <div className="p-2 bg-sky-50 dark:bg-sky-950/40 rounded-lg border border-sky-200 dark:border-sky-800">
                  <span className="text-sky-600 dark:text-sky-400 text-[10px] block font-semibold">New Stock After</span>
                  <span className="font-black text-sky-700 dark:text-sky-300 text-sm">
                    {newStock} {unit}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Input label="Reason *" {...register('reason')} error={errors.reason?.message} />
          <Input label="Additional Notes" {...register('notes')} />

          <div className="pt-2 flex justify-end">
            <Button type="submit" isLoading={isLoading} size="lg">
              Confirm Stock Adjustment →
            </Button>
          </div>
        </form>
      </Card>

      {/* Adjustments History Table */}
      <Card
        title="Recent Stock Adjustments History"
        subtitle="Live ledger of all additions, deductions, corrections, and damage entries"
      >
        <Table
          columns={historyColumns}
          data={movements}
          keyExtractor={(m) => m.id}
        />
      </Card>
    </div>
  );
};
