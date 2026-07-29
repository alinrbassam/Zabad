import React, { useEffect, useState } from 'react';
import { usePurchasingStore } from '@stores/usePurchasingStore';
import { useProductStore } from '@stores/useProductStore';
import { useAuthStore } from '@stores/useAuthStore';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { Undo2 } from 'lucide-react';

export const PurchaseReturnsPage: React.FC = () => {
  const { createReturn, isLoading, error } = usePurchasingStore();
  const { suppliers, products, loadMetadata, loadProducts } = useProductStore();
  const { user } = useAuthStore();

  const [supplierId, setSupplierId] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('Damaged');
  const [productQuery, setProductQuery] = useState('');
  const [productId, setProductId] = useState('');
  const [returnedQty, setReturnedQty] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);

    if (!productId) {
      alert('Please select a product to return');
      return;
    }

    const payload = {
      supplierId,
      returnDate,
      reason,
      items: [
        {
          productId,
          unitId: 'u-1',
          returnedQty,
          unitCost,
          reason,
          stockDisposition: 'Remove from sellable stock',
        },
      ],
    };

    const ok = await createReturn(payload, user?.id);
    if (ok) {
      setSuccessMsg('Supplier Return completed! Inventory ledger updated with reversal movement.');
      setProductId('');
      setProductQuery('');
      setReturnedQty(1);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3">
        <Undo2 className="h-6 w-6 text-rose-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Supplier Purchase Returns
          </h1>
          <p className="text-xs text-slate-500">
            Return damaged, expired, or incorrect goods to suppliers with stock ledger reversal.
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <Card title="Process Supplier Return">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              label="Return Date *"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
            />

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Return Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              >
                <option value="Damaged">Damaged Stock</option>
                <option value="Expired">Expired Stock</option>
                <option value="Wrong Product">Wrong Product Delivered</option>
                <option value="Quality Issue">Quality Issue</option>
                <option value="Supplier Recall">Supplier Recall</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <Input
              label="Select Product to Return *"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Search product by name or SKU..."
            />
            {productQuery && products.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setProductId(p.id);
                      setUnitCost(p.purchase_cost || 0);
                      setProductQuery(`${p.name_en} (${p.sku})`);
                    }}
                    className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <span className="font-bold">{p.name_en}</span> - SKU: {p.sku}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Returned Quantity *"
              type="number"
              step="0.01"
              value={returnedQty}
              onChange={(e) => setReturnedQty(Number(e.target.value))}
              required
            />
            <Input
              label="Unit Cost ($) *"
              type="number"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              required
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" isLoading={isLoading} className="flex items-center space-x-2">
              <Undo2 className="h-4 w-4" />
              <span>Complete Return Transaction →</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
