import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePurchasingStore } from '@stores/usePurchasingStore';
import { useProductStore } from '@stores/useProductStore';
import { useAuthStore } from '@stores/useAuthStore';
import { ProductEntity } from '@shared/types';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { DatePicker } from '@components/ui/DatePicker';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { Truck } from 'lucide-react';

interface ReceivingLine {
  poItemId?: string;
  product: ProductEntity;
  orderedQty: number;
  previouslyReceivedQty: number;
  receivedQtyNow: number;
  unitCost: number;
  unitId?: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
}

export const GoodsReceivingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const poId = searchParams.get('poId');
  const navigate = useNavigate();
  const { selectedOrder, loadOrderById, confirmReceipt, isLoading, error } = usePurchasingStore();
  const { suppliers, units, loadMetadata } = useProductStore();
  const { user } = useAuthStore();

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryNote, setDeliveryNote] = useState('');
  const [receivingLines, setReceivingLines] = useState<ReceivingLine[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    if (poId) {
      setReceivingLines([]);
      setLocalError(null);
      loadOrderById(poId);
    }
  }, [poId, loadOrderById]);

  useEffect(() => {
    if (selectedOrder && (!poId || selectedOrder.id === poId)) {
      setSupplierId(selectedOrder.supplier_id);
      window.api?.searchProducts('', 1000, 0).then((res) => {
        const prods = res?.success && res.data ? res.data : [];
        const lines: ReceivingLine[] = selectedOrder.items.map((item, idx) => {
          const prod = prods.find((p) => p.id === item.product_id) || {
            id: item.product_id,
            name_en: item.product_name || item.description || 'Product',
            sku: item.product_sku || item.product_id,
            base_unit_id: item.purchasing_unit_id,
            track_batches: 0,
            track_expiry: 0,
          };
          const remaining = Math.max(0, item.ordered_qty - item.received_qty);
          return {
            poItemId: item.id,
            product: prod as ProductEntity,
            orderedQty: item.ordered_qty,
            previouslyReceivedQty: item.received_qty,
            receivedQtyNow: remaining,
            unitCost: item.unit_cost,
            unitId: item.purchasing_unit_id || prod.base_unit_id,
            batchNumber: `BATCH-${Date.now().toString().slice(-4)}-${idx + 1}`,
            mfgDate: '',
            expiryDate: '',
          };
        });
        setReceivingLines(lines);
      });
    }
  }, [selectedOrder, poId]);

  const updateLine = (index: number, key: keyof ReceivingLine, val: unknown) => {
    const updated = [...receivingLines];
    updated[index] = { ...updated[index], [key]: val };
    setReceivingLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setLocalError(null);

    const itemsToReceive = receivingLines.filter((l) => Number(l.receivedQtyNow) > 0);
    if (itemsToReceive.length === 0) {
      setLocalError('Please enter a received quantity greater than 0 for at least one product.');
      return;
    }

    const defaultUnitId = units[0]?.id || 'ad17f3a3-1fc6-4f49-9e3d-6eaf0f48a035';
    const finalSupplierId = supplierId || selectedOrder?.supplier_id || suppliers[0]?.id;

    const payload = {
      poId: poId || undefined,
      supplierId: finalSupplierId,
      supplierInvoiceNumber: invoiceNumber || undefined,
      receiptDate,
      deliveryNoteNumber: deliveryNote || undefined,
      items: itemsToReceive.map((l) => ({
        poItemId: l.poItemId,
        productId: l.product.id,
        unitId: l.unitId || l.product.base_unit_id || defaultUnitId,
        receivedQty: l.receivedQtyNow,
        acceptedQty: l.receivedQtyNow,
        rejectedQty: 0,
        unitCost: l.unitCost,
        discount: 0,
        taxRate: 0,
        batchNumber: l.product.track_batches ? l.batchNumber : undefined,
        mfgDate: l.product.track_expiry ? l.mfgDate : undefined,
        expiryDate: l.product.track_expiry ? l.expiryDate : undefined,
      })),
    };

    const ok = await confirmReceipt(payload, user?.id);
    if (ok) {
      setSuccessMsg('Goods Receipt confirmed successfully! Inventory updated.');
      setTimeout(() => navigate('/purchasing/orders'), 1200);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {poId
              ? `Receive Goods for ${selectedOrder?.id === poId ? selectedOrder.po_number : '...'}`
              : 'Store Goods Receiving'}
          </h1>
          <p className="text-xs text-slate-500">
            Record incoming goods, batch numbers, expiry dates, and update inventory.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/purchasing/orders')}>
          Cancel
        </Button>
      </div>

      {(localError || error) && <Alert variant="danger">{localError || error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="1. Receiving Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Supplier Invoice Number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
            <Input
              label="Delivery Note Number"
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
            />
            <DatePicker
              label="Receipt Date *"
              value={receiptDate}
              onChange={setReceiptDate}
              required
            />
          </div>
        </Card>

        <Card title="2. Incoming Items, Batches & Expiry Dates">
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3 w-20 text-center">Ordered</th>
                  <th className="p-3 w-20 text-center">Prev Recv</th>
                  <th className="p-3 w-24">Recv Now</th>
                  <th className="p-3 w-28">Batch #</th>
                  <th className="p-3 w-32">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {receivingLines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-3">
                      <span className="font-bold block text-slate-800 dark:text-slate-200">
                        {line.product.name_en}
                      </span>
                      <span className="text-[10px] text-slate-400">SKU: {line.product.sku}</span>
                    </td>
                    <td className="p-3 text-center">{line.orderedQty}</td>
                    <td className="p-3 text-center text-slate-400">{line.previouslyReceivedQty}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.receivedQtyNow}
                        onChange={(e) => updateLine(idx, 'receivedQtyNow', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-center bg-white dark:bg-slate-800 font-bold"
                      />
                    </td>
                    <td className="p-3">
                      {line.product.track_batches === 1 ? (
                        <input
                          type="text"
                          value={line.batchNumber}
                          onChange={(e) => updateLine(idx, 'batchNumber', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 font-medium"
                          required
                        />
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="p-3">
                      {line.product.track_expiry === 1 ? (
                        <input
                          type="date"
                          lang="en-GB"
                          value={line.expiryDate}
                          onChange={(e) => updateLine(idx, 'expiryDate', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 font-medium"
                          required
                        />
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/purchasing/orders')}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            size="lg"
            className="flex items-center space-x-2"
          >
            <Truck className="h-4 w-4" />
            <span>Confirm Goods Receipt ✓</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
