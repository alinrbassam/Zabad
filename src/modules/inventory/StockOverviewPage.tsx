import React, { useEffect, useState } from 'react';
import { useInventoryStore } from '@stores/useInventoryStore';
import { useProductStore } from '@stores/useProductStore';
import { useAuthStore } from '@stores/useAuthStore';
import { useLanguageStore } from '@stores/useLanguageStore';
import { Table, Column } from '@components/ui/Table';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { AdminPasswordConfirmModal } from '@components/auth/AdminPasswordConfirmModal';
import { InventoryMovementEntity } from '@shared/types';
import { Boxes, Trash2 } from 'lucide-react';
import { formatDateTime } from '@utils/date';

export const StockOverviewPage: React.FC = () => {
  const { movements, loadMovements, deleteMovement, error } = useInventoryStore();
  const { products, loadProducts } = useProductStore();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();

  const [movementToDelete, setMovementToDelete] = useState<InventoryMovementEntity | null>(null);
  const [revertBalance, setRevertBalance] = useState(false);
  const [isDeletingMovement, setIsDeletingMovement] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMovements();
    loadProducts('');
  }, [loadMovements, loadProducts]);

  const activeTargetProduct = movementToDelete
    ? products.find((p) => p.id === movementToDelete.product_id)
    : undefined;
  const currentTargetStock = Number(activeTargetProduct?.quantity_on_hand ?? 0);
  const revertedTargetStock = movementToDelete
    ? Math.max(0, currentTargetStock - Number(movementToDelete.quantity_change || 0))
    : 0;
  const targetUnitLabel = movementToDelete?.unit_symbol || activeTargetProduct?.unit_symbol || '';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Boxes className="h-6 w-6 text-sky-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Stock Movements & Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Transaction ledger of all stock entries, manual adjustments, and inventory changes.
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <Card>
        <Table columns={columns} data={movements} keyExtractor={(m) => m.id} />
      </Card>

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
