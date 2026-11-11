import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePurchasingStore } from '@stores/usePurchasingStore';
import { useAuthStore } from '@stores/useAuthStore';
import { useLanguageStore } from '@stores/useLanguageStore';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Alert } from '@components/ui/Alert';
import { Dialog } from '@components/ui/Dialog';
import { AdminPasswordConfirmModal } from '@components/auth/AdminPasswordConfirmModal';
import { Printer, ArrowLeft, Truck, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { formatDate } from '@utils/date';
import { POStatus } from '@shared/types';

export const PurchaseOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedOrder, loadOrderById, updateOrderStatus, deleteOrder, isLoading, error } =
    usePurchasingStore();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrderById(id);
    }
  }, [id, loadOrderById]);

  if (!selectedOrder) {
    return <div className="p-6 text-center text-slate-500">Loading purchase order details...</div>;
  }

  const getStatusVariant = (
    status: POStatus,
  ): 'info' | 'warning' | 'success' | 'danger' | 'neutral' => {
    if (status === 'Approved' || status === 'Ordered') return 'info';
    if (status === 'Partially received') return 'warning';
    if (status === 'Fully received' || status === 'Closed') return 'success';
    if (status === 'Cancelled') return 'danger';
    return 'neutral';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMarkOrdered = async () => {
    if (id) {
      await updateOrderStatus(id, 'Ordered', 'Sent purchase order to vendor', user?.id);
    }
  };

  const handleConfirmCancel = async () => {
    if (!id) return;
    const ok = await updateOrderStatus(
      id,
      'Cancelled',
      cancelReason.trim() || 'Cancelled by manager',
      user?.id,
    );
    if (ok) {
      setIsCancelOpen(false);
      setCancelReason('');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap gap-2 justify-between items-center print:hidden">
        <Button variant="outline" size="sm" onClick={() => navigate('/purchasing/orders')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Orders
        </Button>

        <div className="flex flex-wrap gap-2">
          {(selectedOrder.status === 'Draft' || selectedOrder.status === 'Approved') && (
            <Button size="sm" onClick={handleMarkOrdered} isLoading={isLoading}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Mark as Sent / Ordered
            </Button>
          )}

          {selectedOrder.status !== 'Fully received' &&
            selectedOrder.status !== 'Cancelled' &&
            selectedOrder.status !== 'Closed' && (
              <Button
                size="sm"
                onClick={() => navigate(`/purchasing/receiving?poId=${selectedOrder.id}`)}
              >
                <Truck className="h-4 w-4 mr-1" />
                Receive Goods
              </Button>
            )}

          {selectedOrder.status !== 'Fully received' &&
            selectedOrder.status !== 'Cancelled' &&
            selectedOrder.status !== 'Closed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelOpen(true)}
                className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancel Order
              </Button>
            )}

          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Print A4 PO
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            className="text-rose-600 border-rose-300 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Printable A4 Purchase Order Document */}
      <Card className="p-8 print:p-0 print:border-none print:shadow-none space-y-6">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-black text-sky-600">PURCHASE ORDER</h1>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
              {selectedOrder.po_number}
            </span>
            <span className="text-xs text-slate-500">
              Date: {formatDate(selectedOrder.order_date)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 block uppercase">Status</span>
            <Badge variant={getStatusVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>
          </div>
        </div>

        {/* Supplier & Delivery Info */}
        <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <span className="font-bold uppercase text-slate-400 block mb-1">Supplier</span>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">
              {selectedOrder.supplier_name || `Supplier ID: ${selectedOrder.supplier_id}`}
            </span>
          </div>

          <div>
            <span className="font-bold uppercase text-slate-400 block mb-1">Delivery Info</span>
            <p className="text-slate-600 dark:text-slate-400">
              Expected Delivery:{' '}
              {selectedOrder.expected_delivery_date
                ? formatDate(selectedOrder.expected_delivery_date)
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3 text-right">Ordered Qty</th>
                <th className="p-3 text-right">Received Qty</th>
                <th className="p-3 text-right">Unit Cost (FCFA)</th>
                <th className="p-3 text-right">Tax (FCFA)</th>
                <th className="p-3 text-right">Line Total (FCFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {selectedOrder.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3 font-bold">
                    <span>{item.product_name || item.description || item.product_id}</span>
                    {item.product_sku && (
                      <span className="block text-[10px] font-normal text-slate-400">
                        SKU: {item.product_sku}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right font-medium">{item.ordered_qty}</td>
                  <td className="p-3 text-right font-medium text-emerald-600">
                    {item.received_qty}
                  </td>
                  <td className="p-3 text-right">${item.unit_cost.toFixed(2)}</td>
                  <td className="p-3 text-right">${item.tax_amount.toFixed(2)}</td>
                  <td className="p-3 text-right font-bold">${item.line_total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Document Totals */}
        <div className="flex justify-end pt-4">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-bold">${selectedOrder.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax Total:</span>
              <span className="font-bold">${selectedOrder.tax_subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Shipping &amp; Freight:</span>
              <span className="font-bold">${selectedOrder.shipping_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-base font-black text-slate-900 dark:text-slate-100">
              <span>Grand Total:</span>
              <span>${selectedOrder.grand_total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs text-slate-400">
          <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
            Authorized Buyer Signature
          </div>
          <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
            Supplier Representative Signature
          </div>
        </div>
      </Card>

      <Dialog
        isOpen={isCancelOpen}
        title={
          language === 'ar'
            ? 'إلغاء أمر الشراء'
            : language === 'fr'
            ? 'Annuler le bon de commande'
            : 'Cancel Purchase Order'
        }
        onClose={() => setIsCancelOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {language === 'ar'
              ? `هل تريد تغيير حالة أمر الشراء "${selectedOrder.po_number}" إلى ملغى؟`
              : language === 'fr'
              ? `Voulez-vous marquer le bon de commande « ${selectedOrder.po_number} » comme annulé ?`
              : `Mark Purchase Order "${selectedOrder.po_number}" as Cancelled?`}
          </p>
          <input
            type="text"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={
              language === 'ar'
                ? 'سبب الإلغاء (اختياري)...'
                : language === 'fr'
                ? "Motif d'annulation (optionnel)..."
                : 'Cancellation reason (optional)...'
            }
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              {language === 'ar' ? 'تراجع' : language === 'fr' ? 'Retour' : 'Keep Order'}
            </Button>
            <Button variant="danger" onClick={handleConfirmCancel} isLoading={isLoading}>
              {language === 'ar'
                ? 'تأكيد الإلغاء'
                : language === 'fr'
                ? "Confirmer l'annulation"
                : 'Confirm Cancel'}
            </Button>
          </div>
        </div>
      </Dialog>

      <AdminPasswordConfirmModal
        isOpen={isDeleteOpen}
        title={
          language === 'ar'
            ? 'حذف أمر الشراء'
            : language === 'fr'
            ? 'Supprimer le bon de commande'
            : 'Delete Purchase Order'
        }
        message={
          language === 'ar'
            ? `هل أنت متأكد من حذف أمر الشراء "${selectedOrder.po_number}"؟`
            : language === 'fr'
            ? `Voulez-vous supprimer le bon de commande « ${selectedOrder.po_number} » ?`
            : `Are you sure you want to delete Purchase Order "${selectedOrder.po_number}"?`
        }
        warningText={
          selectedOrder.status === 'Partially received' || selectedOrder.status === 'Fully received'
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
          if (!isDeleting) setIsDeleteOpen(false);
        }}
        onConfirm={async () => {
          setIsDeleting(true);
          const ok = await deleteOrder(selectedOrder.id, user?.id);
          setIsDeleting(false);
          if (ok) {
            setIsDeleteOpen(false);
            navigate('/purchasing/orders');
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
