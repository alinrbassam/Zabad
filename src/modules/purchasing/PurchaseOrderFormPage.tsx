import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchasingStore } from '@stores/usePurchasingStore';
import { useProductStore } from '@stores/useProductStore';
import { useAuthStore } from '@stores/useAuthStore';
import { ProductEntity } from '@shared/types';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Alert } from '@components/ui/Alert';
import { Trash2, Plus, ShoppingCart } from 'lucide-react';

interface POLineItem {
  product: ProductEntity;
  orderedQty: number;
  unitCost: number;
  discount: number;
  taxRate: number;
  purchasingUnitId: string;
}

export const PurchaseOrderFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { createOrder, isLoading, error } = usePurchasingStore();
  const { suppliers, products, loadMetadata, loadProducts } = useProductStore();
  const { user } = useAuthStore();

  const [supplierId, setSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState('');
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [notes, setNotes] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [lineItems, setLineItems] = useState<POLineItem[]>([]);

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

  const addProductToOrder = (prod: ProductEntity) => {
    const existing = lineItems.find((l) => l.product.id === prod.id);
    if (existing) {
      setLineItems(
        lineItems.map((l) =>
          l.product.id === prod.id ? { ...l, orderedQty: l.orderedQty + 1 } : l,
        ),
      );
    } else {
      setLineItems([
        ...lineItems,
        {
          product: prod,
          orderedQty: 1,
          unitCost: prod.purchase_cost || 0,
          discount: 0,
          taxRate: prod.tax_rate || 0,
          purchasingUnitId: prod.base_unit_id,
        },
      ]);
    }
    setProductQuery('');
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const updateLineItem = (index: number, key: keyof POLineItem, val: unknown) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [key]: val };
    setLineItems(updated);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let itemDiscountTotal = 0;
    let taxTotal = 0;

    lineItems.forEach((item) => {
      const lineSub = Math.round(item.orderedQty * item.unitCost * 100) / 100;
      const lineDisc = Math.round(item.discount * 100) / 100;
      const taxable = Math.max(0, lineSub - lineDisc);
      const tax = Math.round(taxable * (item.taxRate / 100) * 100) / 100;

      subtotal += lineSub;
      itemDiscountTotal += lineDisc;
      taxTotal += tax;
    });

    const grandTotal =
      Math.round(
        (subtotal -
          itemDiscountTotal -
          orderDiscount +
          taxTotal +
          shippingCost +
          additionalCharges) *
          100,
      ) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      itemDiscountTotal: Math.round(itemDiscountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      grandTotal,
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      alert('Please add at least one product line item');
      return;
    }

    const payload = {
      supplierId,
      orderDate,
      expectedDeliveryDate: expectedDate || undefined,
      currency: 'USD',
      taxMode: 'exclusive' as const,
      discountMode: 'amount' as const,
      orderDiscount,
      shippingCost,
      additionalCharges,
      notes,
      items: lineItems.map((l) => ({
        productId: l.product.id,
        purchasingUnitId: l.purchasingUnitId,
        conversionRatio: 1,
        orderedQty: l.orderedQty,
        unitCost: l.unitCost,
        discount: l.discount,
        taxRate: l.taxRate,
      })),
    };

    const ok = await createOrder(payload, user?.id);
    if (ok) {
      navigate('/purchasing/orders');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Create Purchase Order
          </h1>
          <p className="text-xs text-slate-500">
            Draft new inventory procurement order for vendor delivery.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/purchasing/orders')}>
          Cancel
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="1. Header Information">
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
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Order Date *"
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              required
            />
            <Input
              label="Expected Delivery Date"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>
        </Card>

        <Card title="2. Add Products to Order">
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
                      onClick={() => addProductToOrder(p)}
                      className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-800 flex justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {p.name_en}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          SKU: {p.sku} • Cost: ${p.purchase_cost}
                        </span>
                      </div>
                      <Plus className="h-4 w-4 text-sky-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 w-28">Ordered Qty</th>
                    <th className="p-3 w-28">Unit Cost ($)</th>
                    <th className="p-3 w-24">Tax Rate (%)</th>
                    <th className="p-3 w-28">Line Total</th>
                    <th className="p-3 w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {lineItems.map((item, idx) => {
                    const lineSub = Math.round(item.orderedQty * item.unitCost * 100) / 100;
                    const tax = Math.round(lineSub * (item.taxRate / 100) * 100) / 100;
                    const lineTot = Math.round((lineSub + tax) * 100) / 100;

                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="p-3 font-medium">
                          <span className="font-bold block">{item.product.name_en}</span>
                          <span className="text-[10px] text-slate-400">{item.product.sku}</span>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.01"
                            value={item.orderedQty}
                            onChange={(e) =>
                              updateLineItem(idx, 'orderedQty', Number(e.target.value))
                            }
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-center bg-white dark:bg-slate-800"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) =>
                              updateLineItem(idx, 'unitCost', Number(e.target.value))
                            }
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-center bg-white dark:bg-slate-800"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={item.taxRate}
                            onChange={(e) => updateLineItem(idx, 'taxRate', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-center bg-white dark:bg-slate-800"
                          />
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                          ${lineTot}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeLineItem(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {lineItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No product lines added yet. Search and select products above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Totals Summary */}
        <Card title="3. Charges & Grand Total">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Order Overall Discount ($)"
                type="number"
                value={orderDiscount}
                onChange={(e) => setOrderDiscount(Number(e.target.value))}
              />
              <Input
                label="Shipping & Freight ($)"
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(Number(e.target.value))}
              />
              <Input
                label="Additional Handling Charges ($)"
                type="number"
                value={additionalCharges}
                onChange={(e) => setAdditionalCharges(Number(e.target.value))}
              />
              <Input label="Order Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Items Subtotal:</span>
                <span className="font-bold">${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tax Subtotal:</span>
                <span className="font-bold">${totals.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shipping & Charges:</span>
                <span className="font-bold">${(shippingCost + additionalCharges).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-base font-black text-sky-600">
                <span>Grand Total:</span>
                <span>${totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
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
            <ShoppingCart className="h-4 w-4" />
            <span>Save Purchase Order ✓</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
