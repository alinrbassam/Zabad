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
import { Sliders } from 'lucide-react';

export const StockAdjustmentsPage: React.FC = () => {
  const { products, loadProducts } = useProductStore();
  const { createAdjustment, isLoading, error } = useInventoryStore();
  const { user } = useAuthStore();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
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

  useEffect(() => {
    loadProducts('');
  }, [loadProducts]);

  const onSubmit = async (data: StockAdjustmentInput) => {
    setSuccessMsg(null);
    const ok = await createAdjustment(data, user?.id);
    if (ok) {
      setSuccessMsg('Stock adjustment recorded successfully in movement ledger!');
      reset();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
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
                  {p.name_en} ({p.sku})
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

          <Input label="Reason *" {...register('reason')} error={errors.reason?.message} />
          <Input label="Additional Notes" {...register('notes')} />

          <div className="pt-2 flex justify-end">
            <Button type="submit" isLoading={isLoading} size="lg">
              Confirm Stock Adjustment →
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
