import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchasingStore } from '@stores/usePurchasingStore';
import { useAuthStore } from '@stores/useAuthStore';
import { useLanguageStore } from '@stores/useLanguageStore';
import { Table, Column } from '@components/ui/Table';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { SearchBox } from '@components/ui/SearchBox';
import { Alert } from '@components/ui/Alert';
import { AdminPasswordConfirmModal } from '@components/auth/AdminPasswordConfirmModal';
import { PurchaseOrderEntity } from '@shared/types';
import { Plus, Eye, Truck, Trash2 } from 'lucide-react';
import { formatDate } from '@utils/date';

export const PurchaseOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, loadOrders, deleteOrder, error } = usePurchasingStore();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [poToDelete, setPoToDelete] = useState<(PurchaseOrderEntity & { supplier_name?: string }) | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

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
            {formatDate(po.order_date)}
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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPoToDelete(po)}
            title={
              language === 'ar'
                ? 'حذف أمر الشراء'
                : language === 'fr'
                ? 'Supprimer la commande'
                : 'Delete Purchase Order'
            }
            className="hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-500 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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

      {error && <Alert variant="danger">{error}</Alert>}
      {feedbackMsg && <Alert variant="success">{feedbackMsg}</Alert>}

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

      <AdminPasswordConfirmModal
        isOpen={Boolean(poToDelete)}
        title={
          language === 'ar'
            ? 'حذف أمر الشراء'
            : language === 'fr'
            ? 'Supprimer le bon de commande'
            : 'Delete Purchase Order'
        }
        message={
          language === 'ar'
            ? `هل أنت متأكد من حذف أمر الشراء "${poToDelete?.po_number}"؟`
            : language === 'fr'
            ? `Voulez-vous supprimer le bon de commande « ${poToDelete?.po_number} » ?`
            : `Are you sure you want to delete Purchase Order "${poToDelete?.po_number}"?`
        }
        warningText={
          poToDelete?.status === 'Partially received' || poToDelete?.status === 'Fully received'
            ? language === 'ar'
              ? 'سيتم حذف سجل أمر الشراء فقط. الكميات التي تم استلامها وإضافتها إلى المخزون سابقاً ستبقى كما هي.'
              : language === 'fr'
              ? 'Cette commande sera retirée de la liste. Les quantités déjà reçues en stock ne seront pas modifiées.'
              : 'This purchase order will be removed from the list. Inventory quantities already received from this order will remain unchanged.'
            : language === 'ar'
            ? 'سيتم حذف أمر الشراء نهائياً من قائمة أوامر الشراء.'
            : language === 'fr'
            ? 'Ce bon de commande sera supprimé définitivement de la liste des commandes.'
            : 'This purchase order will be permanently removed from the Purchase Orders list.'
        }
        confirmLabel={
          language === 'ar' ? 'حذف الأمر' : language === 'fr' ? 'Supprimer' : 'Delete Order'
        }
        isLoading={isDeleting}
        onClose={() => {
          if (!isDeleting) setPoToDelete(null);
        }}
        onConfirm={async () => {
          if (!poToDelete) return;
          setFeedbackMsg(null);
          setIsDeleting(true);
          const deletedNumber = poToDelete.po_number;
          const ok = await deleteOrder(poToDelete.id, user?.id);
          setIsDeleting(false);
          if (ok) {
            setPoToDelete(null);
            await loadOrders(search, statusFilter);
            setFeedbackMsg(
              language === 'ar'
                ? `تم حذف أمر الشراء ${deletedNumber} بنجاح.`
                : language === 'fr'
                ? `Bon de commande ${deletedNumber} supprimé avec succès.`
                : `Purchase order ${deletedNumber} deleted successfully.`,
            );
          } else {
            throw new Error(
              language === 'ar'
                ? 'تعذر حذف أمر الشراء.'
                : language === 'fr'
                ? 'Impossible de supprimer le bon de commande.'
                : 'Failed to delete purchase order.',
            );
          }
        }}
      />
    </div>
  );
};
