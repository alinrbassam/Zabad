import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StockAdjustmentSchema, StockAdjustmentInput } from '@shared/validation';
import { useProductStore } from '@stores/useProductStore';
import { useInventoryStore } from '@stores/useInventoryStore';
import { useAuthStore } from '@stores/useAuthStore';
import { useLanguageStore } from '@stores/useLanguageStore';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Alert } from '@components/ui/Alert';
import { Table, Column } from '@components/ui/Table';
import { AdminPasswordConfirmModal } from '@components/auth/AdminPasswordConfirmModal';
import { InventoryMovementEntity } from '@shared/types';
import { Sliders, Trash2 } from 'lucide-react';
import { formatDateTime } from '@utils/date';

export const StockAdjustmentsPage: React.FC = () => {
  const { products, loadProducts } = useProductStore();
  const { createAdjustment, deleteMovement, movements, loadMovements, isLoading, error } = useInventoryStore();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [movementToDelete, setMovementToDelete] = useState<InventoryMovementEntity | null>(null);
  const [revertBalance, setRevertBalance] = useState(false);
  const [isDeletingMovement, setIsDeletingMovement] = useState(false);

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
    {
      key: 'actions',
      header: language === 'ar' ? 'إجراءات' : language === 'fr' ? 'Actions' : 'Actions',
      render: (m) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setMovementToDelete(m);
            setRevertBalance(false);
          }}
          title={
            language === 'ar'
              ? 'حذف السجل (يتطلب كلمة مرور المدير)'
              : language === 'fr'
              ? 'Supprimer (Mot de passe Admin requis)'
              : 'Delete Entry (Requires Admin Password)'
          }
          className="hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-500 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const activeTargetProduct = movementToDelete
    ? products.find((p) => p.id === movementToDelete.product_id)
    : undefined;
  const currentTargetStock = Number(activeTargetProduct?.quantity_on_hand ?? 0);
  const revertedTargetStock = movementToDelete
    ? Math.max(0, currentTargetStock - Number(movementToDelete.quantity_change || 0))
    : 0;
  const targetUnitLabel = movementToDelete?.unit_symbol || activeTargetProduct?.unit_symbol || '';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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

      {/* Admin Password Confirmation Modal for Deleting History Entries */}
      <AdminPasswordConfirmModal
        isOpen={Boolean(movementToDelete)}
        title={
          language === 'ar'
            ? 'حذف سجل حركة المخزون'
            : language === 'fr'
            ? "Supprimer l'entrée de stock"
            : 'Delete Stock History Entry'
        }
        message={
          language === 'ar'
            ? `هل أنت متأكد من حذف سجل "${movementToDelete?.movement_type}" (${
                (movementToDelete?.quantity_change ?? 0) > 0
                  ? `+${movementToDelete?.quantity_change}`
                  : movementToDelete?.quantity_change
              } ${targetUnitLabel}) للمنتج "${movementToDelete?.product_name || 'Product'}"؟`
            : language === 'fr'
            ? `Voulez-vous supprimer l'entrée "${movementToDelete?.movement_type}" (${
                (movementToDelete?.quantity_change ?? 0) > 0
                  ? `+${movementToDelete?.quantity_change}`
                  : movementToDelete?.quantity_change
              } ${targetUnitLabel}) pour "${movementToDelete?.product_name || 'Product'}" ?`
            : `Are you sure you want to delete the "${movementToDelete?.movement_type}" entry (${
                (movementToDelete?.quantity_change ?? 0) > 0
                  ? `+${movementToDelete?.quantity_change}`
                  : movementToDelete?.quantity_change
              } ${targetUnitLabel}) for "${movementToDelete?.product_name || 'Product'}"?`
        }
        warningText={
          activeTargetProduct
            ? language === 'ar'
              ? 'سيتم حذف هذا السجل من جدول الحركات. لن يتغير الرصيد الحالي للمنتج إلا إذا فعّلت خيار عكس الكمية أدناه.'
              : language === 'fr'
              ? "Cette entrée sera retirée de l'historique. Le stock actuel ne sera pas modifié sauf si vous cochez l'option ci-dessous."
              : 'This entry will be removed from the ledger history. Current product stock will remain unchanged unless you check the reversal option below.'
            : language === 'ar'
            ? 'سيتم حذف هذا السجل نهائياً من سجل حركات المخزون.'
            : language === 'fr'
            ? "Cette entrée sera supprimée définitivement de l'historique des mouvements."
            : 'This entry will be removed permanently from the stock movements ledger.'
        }
        confirmLabel={
          language === 'ar' ? 'حذف السجل' : language === 'fr' ? "Supprimer l'entrée" : 'Delete Entry'
        }
        isLoading={isDeletingMovement}
        extraContent={
          activeTargetProduct && movementToDelete && movementToDelete.quantity_change !== 0 ? (
            <label className="flex items-start space-x-2.5 rtl:space-x-reverse p-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-950/20 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={revertBalance}
                onChange={(e) => setRevertBalance(e.target.checked)}
                disabled={isDeletingMovement}
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {language === 'ar'
                    ? 'عكس هذه الكمية أيضاً من المخزون الحالي'
                    : language === 'fr'
                    ? 'Annuler aussi cette quantité du stock actuel'
                    : 'Also reverse this quantity change from current product stock'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                  {currentTargetStock} {targetUnitLabel} → {revertedTargetStock} {targetUnitLabel}
                </span>
              </div>
            </label>
          ) : null
        }
        onClose={() => {
          if (!isDeletingMovement) {
            setMovementToDelete(null);
            setRevertBalance(false);
          }
        }}
        onConfirm={async () => {
          if (!movementToDelete) return;
          setSuccessMsg(null);
          setIsDeletingMovement(true);
          const ok = await deleteMovement(movementToDelete.id, user?.id, revertBalance);
          setIsDeletingMovement(false);
          if (ok) {
            await loadProducts('');
            setMovementToDelete(null);
            setRevertBalance(false);
            setSuccessMsg(
              language === 'ar'
                ? 'تم حذف سجل حركة المخزون بنجاح.'
                : language === 'fr'
                ? 'Entrée de mouvement supprimée avec succès.'
                : 'Stock movement entry deleted successfully.',
            );
          } else {
            throw new Error(
              language === 'ar'
                ? 'تعذر حذف سجل حركة المخزون.'
                : language === 'fr'
                ? "Impossible de supprimer l'entrée de stock."
                : 'Failed to delete stock movement entry.',
            );
          }
        }}
      />
    </div>
  );
};
