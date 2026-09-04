import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchasingStore } from '@stores/usePurchasingStore';
import { useProductStore } from '@stores/useProductStore';
import { useAuthStore } from '@stores/useAuthStore';
import { ProductEntity } from '@shared/types';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { DatePicker } from '@components/ui/DatePicker';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { Dialog } from '@components/ui/Dialog';
import { Store, Plus, Trash2, PlusCircle } from 'lucide-react';

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
  const { suppliers, products, categories, units, loadMetadata, loadProducts, createProduct } =
    useProductStore();
  const { user } = useAuthStore();

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [productQuery, setProductQuery] = useState('');
  const [lines, setLines] = useState<DirectLine[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick-Add Product Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newProductNameEn, setNewProductNameEn] = useState('');
  const [newProductNameAr, setNewProductNameAr] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('');
  const [newProductCost, setNewProductCost] = useState<number | string>(0);
  const [newProductPrice, setNewProductPrice] = useState<number | string>(0);
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductQty, setNewProductQty] = useState<number | string>(1);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  useEffect(() => {
    loadMetadata();
    loadProducts();
  }, [loadMetadata, loadProducts]);

  useEffect(() => {
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
  }, [suppliers, supplierId]);

  const openQuickAdd = (prefillName?: string) => {
    setNewProductNameEn(prefillName || productQuery || '');
    setNewProductNameAr('');
    setNewProductCategory(categories[0]?.id || '');
    setNewProductUnit(units[0]?.id || '');
    setNewProductCost(0);
    setNewProductPrice(0);
    setNewProductSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`);
    setNewProductQty(1);
    setQuickAddError(null);
    setIsQuickAddOpen(true);
  };

  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductNameEn.trim()) {
      setQuickAddError('Product name is required');
      return;
    }

    const catId = newProductCategory || categories[0]?.id;
    const unitId = newProductUnit || units[0]?.id;
    if (!catId || !unitId) {
      setQuickAddError('Category and Unit are required. Please ensure database is seeded.');
      return;
    }

    const cost = Number(newProductCost) || 0;
    const price = Number(newProductPrice) || cost;
    const qty = Number(newProductQty) > 0 ? Number(newProductQty) : 1;

    setIsCreatingProduct(true);
    setQuickAddError(null);

    const payload = {
      sku: newProductSku.trim() || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      nameEn: newProductNameEn.trim(),
      nameAr: newProductNameAr.trim() || newProductNameEn.trim(),
      categoryId: catId,
      baseUnitId: unitId,
      productType: 'Weighted product' as const,
      allowDecimalQty: true,
      qtyPrecision: 2,
      purchaseCost: cost,
      avgCost: cost,
      lastPurchaseCost: cost,
      sellingPrice: price,
      minSellingPrice: 0,
      wholesalePrice: 0,
      taxRate: 0,
      pricesIncludeTax: false,
      isTaxExempt: false,
      allowDiscount: true,
      trackInventory: true,
      minStock: 0,
      maxStock: 1000,
      reorderLevel: 100,
      defaultReorderQty: 20,
      allowNegativeStock: false,
      trackBatches: false,
      trackExpiry: false,
      trackSerials: false,
      shelfLifeDays: 0,
      isActive: true,
      isFeatured: false,
      openingStockQty: 0,
    };

    const created = await createProduct(payload, user?.id);
    setIsCreatingProduct(false);

    if (created) {
      setLines((prev) => [
        ...prev,
        {
          product: created,
          qty,
          unitCost: cost,
          batchNumber: `DIR-${Date.now().toString().slice(-4)}`,
          expiryDate: '',
        },
      ]);
      setIsQuickAddOpen(false);
      setProductQuery('');
      setSuccessMsg(`Product "${created.name_en}" created and added to direct purchase!`);
    } else {
      setQuickAddError('Failed to create product. Please verify SKU or name is not duplicate.');
    }
  };

  const addProduct = (p: ProductEntity) => {
    const existingIndex = lines.findIndex((l) => l.product.id === p.id);
    if (existingIndex >= 0) {
      const updated = [...lines];
      updated[existingIndex].qty += 1;
      setLines(updated);
    } else {
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
    }
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
            <DatePicker
              label="Purchase Date *"
              value={receiptDate}
              onChange={setReceiptDate}
              required
            />
          </div>
        </Card>

        <Card title="2. Products Purchased">
          <div className="space-y-4">
            {/* Direct Dropdown + Quick Search + Add New Product */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Dropdown Selector */}
              <div className="md:col-span-5 flex flex-col space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Item from Product Catalog (Dropdown)
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      openQuickAdd();
                      return;
                    }
                    const selected = products.find((p) => p.id === e.target.value);
                    if (selected) addProduct(selected);
                  }}
                  className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium cursor-pointer"
                >
                  <option value="">-- Choose Existing Product from Catalog --</option>
                  <option value="__add_new__" className="font-bold text-emerald-600 dark:text-emerald-400">
                    ➕ + Add New / Unlisted Item...
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_en} {p.name_ar ? `(${p.name_ar})` : ''} - SKU: {p.sku} [Stock: {p.quantity_on_hand ?? 0} {p.unit_symbol || ''}]
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400">
                  Select existing product or choose &quot;+ Add New / Unlisted Item&quot;
                </span>
              </div>

              {/* Quick Search */}
              <div className="md:col-span-4 relative flex flex-col space-y-1">
                <Input
                  label="Or Search Product (Name, SKU, Barcode)"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Type to filter product catalog..."
                />
                {productQuery && (
                  <div className="absolute z-20 top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                    <div
                      onClick={() => openQuickAdd(productQuery)}
                      className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-medium"
                    >
                      <div className="flex items-center space-x-2">
                        <PlusCircle className="h-4 w-4 text-emerald-600" />
                        <span>Add &quot;{productQuery}&quot; as New Product</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-200 dark:bg-emerald-800 px-1.5 py-0.5 rounded">
                        New Item
                      </span>
                    </div>
                    {products
                      .filter(
                        (p) =>
                          p.name_en.toLowerCase().includes(productQuery.toLowerCase()) ||
                          (p.name_ar && p.name_ar.includes(productQuery)) ||
                          p.sku.toLowerCase().includes(productQuery.toLowerCase()),
                      )
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => addProduct(p)}
                          className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-bold">{p.name_en}</span>
                            {p.name_ar && <span className="text-slate-400 ml-1">({p.name_ar})</span>}
                            <span className="text-slate-400 text-[10px] ml-2 font-mono">[{p.sku}]</span>
                            <span className="ml-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                              [Stock: {p.quantity_on_hand ?? 0} {p.unit_symbol || ''}]
                            </span>
                          </div>
                          <Plus className="h-4 w-4 text-emerald-600" />
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Dedicated + New Product Button */}
              <div className="md:col-span-3 flex flex-col justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openQuickAdd()}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-semibold"
                >
                  <PlusCircle className="h-4 w-4 text-emerald-600" />
                  <span>+ Add New Product</span>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 w-24">Qty</th>
                    <th className="p-3 w-28">Cost (FCFA)</th>
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
                          step="any"
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
                            lang="en-GB"
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

      {/* Quick-Add Product Modal */}
      <Dialog
        isOpen={isQuickAddOpen}
        title="Add New / Unlisted Product to Catalog"
        onClose={() => setIsQuickAddOpen(false)}
      >
        <form onSubmit={handleQuickAddProduct} className="space-y-4">
          {quickAddError && <Alert variant="danger">{quickAddError}</Alert>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Product Name (EN) *"
              value={newProductNameEn}
              onChange={(e) => setNewProductNameEn(e.target.value)}
              placeholder="e.g., Salmon Trout"
              required
              autoFocus
            />
            <Input
              label="Product Name (AR)"
              value={newProductNameAr}
              onChange={(e) => setNewProductNameAr(e.target.value)}
              placeholder="e.g., سمك سلمون"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category *
              </label>
              <select
                value={newProductCategory || categories[0]?.id || ''}
                onChange={(e) => setNewProductCategory(e.target.value)}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en} {c.name_ar ? `(${c.name_ar})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Base Unit *
              </label>
              <select
                value={newProductUnit || units[0]?.id || ''}
                onChange={(e) => setNewProductUnit(e.target.value)}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                required
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name_en} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Purchase Cost (FCFA) *"
              type="number"
              step="any"
              value={newProductCost}
              onChange={(e) => setNewProductCost(e.target.value)}
              required
            />
            <Input
              label="Selling Price (FCFA) *"
              type="number"
              step="any"
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(e.target.value)}
              required
            />
            <Input
              label="Initial Qty to Add *"
              type="number"
              step="0.01"
              value={newProductQty}
              onChange={(e) => setNewProductQty(e.target.value)}
              required
            />
          </div>

          <Input
            label="SKU / Item Code"
            value={newProductSku}
            onChange={(e) => setNewProductSku(e.target.value)}
            placeholder="Auto-generated if left as is"
          />

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQuickAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isCreatingProduct}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save &amp; Add to Purchase ✓
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
