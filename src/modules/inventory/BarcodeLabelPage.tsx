import React, { useEffect, useState } from 'react';
import { useProductStore } from '@stores/useProductStore';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ProductEntity } from '@shared/types';
import { Barcode, Printer } from 'lucide-react';

export const BarcodeLabelPage: React.FC = () => {
  const { products, loadProducts } = useProductStore();
  const [selectedProduct, setSelectedProduct] = useState<ProductEntity | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [labelSize, setLabelSize] = useState('50x25');

  useEffect(() => {
    loadProducts('');
  }, [loadProducts]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3">
        <Barcode className="h-6 w-6 text-sky-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Barcode Label Preparation
          </h1>
          <p className="text-xs text-slate-500">
            Design, preview, and print thermal barcode labels for store shelf products.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Label Specifications">
          <div className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Product
              </label>
              <select
                onChange={(e) =>
                  setSelectedProduct(products.find((p) => p.id === e.target.value) || null)
                }
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="">Choose product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name_en} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Quantity of Labels"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Label Size / Format
              </label>
              <select
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value)}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="50x25">50mm x 25mm Thermal Label</option>
                <option value="38x25">38mm x 25mm Small Sticker</option>
                <option value="A4-30">A4 Sheet (30 labels/page)</option>
              </select>
            </div>

            <Button
              onClick={() =>
                alert(`Printing ${quantity} barcode labels (${labelSize}) to thermal printer`)
              }
              disabled={!selectedProduct}
              className="w-full flex items-center justify-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print Barcode Labels ({quantity})</span>
            </Button>
          </div>
        </Card>

        <Card title="Live Thermal Label Preview">
          {selectedProduct ? (
            <div className="border border-dashed border-slate-400 dark:border-slate-600 p-6 rounded-xl bg-white text-slate-900 text-center space-y-2 max-w-xs mx-auto shadow-sm">
              <span className="font-extrabold text-sm block tracking-tight">
                {selectedProduct.name_en}
              </span>
              <span className="text-[10px] text-slate-500 block">{selectedProduct.name_ar}</span>

              {/* Barcode visual simulation */}
              <div className="bg-slate-900 text-white font-mono text-xs py-2 my-2 tracking-widest rounded">
                ||| | |||| | || | |||
              </div>

              <span className="font-mono text-xs font-bold block">
                {selectedProduct.primary_barcode || selectedProduct.sku}
              </span>
              <span className="text-base font-black text-slate-900 block">
                ${selectedProduct.selling_price.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Select a product from the left panel to preview thermal barcode layout.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
