import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchasingStore } from '@stores/usePurchasingStore';
import { useProductStore } from '@stores/useProductStore';
import { useAuthStore } from '@stores/useAuthStore';
import { ProductEntity } from '@shared/types';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { Store, Plus, Trash2 } from 'lucide-react';

interface DirectLine {
  product: ProductEntity;
  qty: number;
  unitCost: number;
  batchNumber: string;
  expiryDate: string;
}

export const DirectPurchasePage: React.FC = () => {
  const navigate = useNavigate();
  const { confirmReceipt, isLoading, error } = usePurchasingStore();
  const { suppliers, products, loadMetadata, loadProducts } = useProductStore();
  const { user } = useAuthStore();

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [productQuery, setProductQuery] = useState('');
  const [lines, setLines] = useState<DirectLine[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
  }, [suppliers, supplierId]);

  useEffect(() => {
    if (productQuery.length > 1) {
      loadProducts(productQuery);
    }
  }, [productQuery, loadProducts]);

  const addProduct = (p: ProductEntity) => {
    setLines([
      ...lines,
      {
        product: p,
        qty: 1,
        unitCost: p.purchase_cost || 0,
        batchNumber: `DIR-${Date.now().toString().slice(-4)}`,
        expiryDate: '',
      },
    ]);
    setProductQuery('');
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const updateLine = (index: number, key: keyof DirectLine, val: unknown) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [key]: val };
    setLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);

    if (lines.length === 0) {
      alert('Please add at least one product for direct purchase');
      return;
    }

    const payload = {
      supplierId,
      supplierInvoiceNumber: invoiceNumber || undefined,
      receiptDate,
      items: lines.map((l) => ({
        productId: l.product.id,
        unitId: l.product.base_unit_id,
        receivedQty: l.qty,
        acceptedQty: l.qty,
        rejectedQty: 0,
        unitCost: l.unitCost,
        discount: 0,
        taxRate: 0,
        batchNumber: l.product.track_batches ? l.batchNumber : undefined,
        expiryDate: l.product.track_expiry ? l.expiryDate : undefined,
      })),
    };

    const ok = await confirmReceipt(payload, user?.id);
    if (ok) {
      setSuccessMsg('Direct purchase confirmed! Stock balance and costs updated.');
      setTimeout(() => navigate('/purchasing/orders'), 1200);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-3">
        <Store className="h-6 w-6 text-emerald-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Direct Store Purchase
          </h1>
          <p className="text-xs text-slate-500">
            Record immediate over-the-counter purchases without prior purchase order.
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="1. Direct Purchase Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Supplier *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Vendor Invoice #"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
            <Input
              label="Purchase Date *"
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              required
            />
          </div>
        </Card>

        <Card title="2. Products Purchased">
          <div className="space-y-4">
            <div className="relative">
              <Input
                label="Search Product (EN, AR, SKU, Barcode)"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Type to search product catalog..."
              />
              {productQuery && products.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-800 flex justify-between text-xs"
                    >
                      <span className="font-bold">{p.name_en}</span>
                      <Plus className="h-4 w-4 text-emerald-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 w-24">Qty</th>
                    <th className="p-3 w-28">Cost ($)</th>
                    <th className="p-3 w-28">Batch #</th>
                    <th className="p-3 w-32">Expiry Date</th>
                    <th className="p-3 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {lines.map((l, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-bold">{l.product.name_en}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          value={l.qty}
                          onChange={(e) => updateLine(idx, 'qty', Number(e.target.value))}
                          className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-center bg-white dark:bg-slate-800"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          value={l.unitCost}
                          onChange={(e) => updateLine(idx, 'unitCost', Number(e.target.value))}
                          className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-center bg-white dark:bg-slate-800"
                        />
                      </td>
                      <td className="p-3">
                        {l.product.track_batches === 1 ? (
                          <input
                            type="text"
                            value={l.batchNumber}
                            onChange={(e) => updateLine(idx, 'batchNumber', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                          />
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="p-3">
                        {l.product.track_expiry === 1 ? (
                          <input
                            type="date"
                            value={l.expiryDate}
                            onChange={(e) => updateLine(idx, 'expiryDate', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                          />
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="text-rose-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={() => navigate('/purchasing/orders')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} size="lg">
            Confirm Direct Purchase ✓
          </Button>
        </div>
      </form>
    </div>
  );
};
