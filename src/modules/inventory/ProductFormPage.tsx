import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductSchema, ProductInput } from '@shared/validation';
import { useProductStore } from '@stores/useProductStore';
import { useAuthStore } from '@stores/useAuthStore';
import { ProductEntity } from '@shared/types';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Alert } from '@components/ui/Alert';

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories, brands, units, loadMetadata, createProduct, isLoading, error } =
    useProductStore();
  const { user } = useAuthStore();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      nameEn: '',
      nameAr: '',
      productType: 'Standard stock item',
      categoryId: '',
      baseUnitId: '',
      purchaseCost: 0,
      sellingPrice: 0,
      minSellingPrice: 0,
      wholesalePrice: 0,
      taxRate: 0,
      allowDecimalQty: false,
      qtyPrecision: 0,
      trackInventory: true,
      minStock: 5,
      maxStock: 100,
      reorderLevel: 10,
      defaultReorderQty: 20,
      trackBatches: false,
      trackExpiry: false,
      isActive: true,
      openingStockQty: 0,
    },
  });

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    if (categories.length > 0) setValue('categoryId', categories[0].id);
    if (units.length > 0) setValue('baseUnitId', units[0].id);
  }, [categories, units, setValue]);

  useEffect(() => {
    if (id && window.api?.getProductById) {
      window.api.getProductById(id).then((res) => {
        if (res.success && res.data) {
          const p = res.data as ProductEntity;
          setValue('sku', p.sku);
          setValue('primaryBarcode', p.primary_barcode || '');
          setValue('nameEn', p.name_en);
          setValue('nameAr', p.name_ar);
          setValue('categoryId', p.category_id);
          setValue('baseUnitId', p.base_unit_id);
          setValue('purchaseCost', p.purchase_cost);
          setValue('sellingPrice', p.selling_price);
          setValue('minSellingPrice', p.min_selling_price);
          setValue('trackInventory', p.track_inventory === 1);
          setValue('trackBatches', p.track_batches === 1);
          setValue('trackExpiry', p.track_expiry === 1);
        }
      });
    }
  }, [id, setValue]);

  const onSubmit = async (data: ProductInput) => {
    setSuccessMsg(null);
    const ok = await createProduct(data, user?.id);
    if (ok) {
      setSuccessMsg('Product saved successfully!');
      setTimeout(() => navigate('/inventory/products'), 1000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {id ? 'Edit Product' : 'Create New Product'}
          </h1>
          <p className="text-xs text-slate-500">
            Configure product specifications, pricing, units, and stock tracking.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/inventory/products')}>
          Cancel
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Identification */}
        <Card title="1. Product Identification">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="SKU Code *" {...register('sku')} error={errors.sku?.message} />
            <Input
              label="Primary Barcode"
              {...register('primaryBarcode')}
              error={errors.primaryBarcode?.message}
            />
            <Input
              label="English Product Name *"
              {...register('nameEn')}
              error={errors.nameEn?.message}
            />
            <Input
              label="Arabic Product Name *"
              {...register('nameAr')}
              error={errors.nameAr?.message}
            />
          </div>
        </Card>

        {/* Section 2: Classification & Units */}
        <Card title="2. Classification & Units">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category *
              </label>
              <select
                {...register('categoryId')}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en} ({c.name_ar})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Brand
              </label>
              <select
                {...register('brandId')}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="">None</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Base Unit *
              </label>
              <select
                {...register('baseUnitId')}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name_en} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Section 3: Pricing & Tax */}
        <Card title="3. Pricing & Costs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Purchase Cost ($)"
              type="number"
              step="0.01"
              {...register('purchaseCost', { valueAsNumber: true })}
              error={errors.purchaseCost?.message}
            />
            <Input
              label="Selling Price ($) *"
              type="number"
              step="0.01"
              {...register('sellingPrice', { valueAsNumber: true })}
              error={errors.sellingPrice?.message}
            />
            <Input
              label="Min Selling Price ($)"
              type="number"
              step="0.01"
              {...register('minSellingPrice', { valueAsNumber: true })}
            />
          </div>
        </Card>

        {/* Section 4: Inventory & Tracking */}
        <Card title="4. Inventory Tracking & Opening Stock">
          <div className="space-y-4">
            <div className="flex space-x-6 text-xs font-medium text-slate-700 dark:text-slate-300">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('trackInventory')}
                  className="rounded border-slate-300 text-sky-600"
                />
                <span>Track Stock Balance</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('trackBatches')}
                  className="rounded border-slate-300 text-sky-600"
                />
                <span>Enable Batch Tracking</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('trackExpiry')}
                  className="rounded border-slate-300 text-sky-600"
                />
                <span>Enable Expiry Date Tracking</span>
              </label>
            </div>

            {!id && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Input
                  label="Initial Opening Stock Qty"
                  type="number"
                  {...register('openingStockQty', { valueAsNumber: true })}
                />

                {watch('trackBatches') && (
                  <Input label="Opening Batch #" {...register('openingBatchNumber')} />
                )}

                {watch('trackExpiry') && (
                  <Input label="Expiry Date" type="date" {...register('openingExpiryDate')} />
                )}
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/inventory/products')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} size="lg">
            Save Product ✓
          </Button>
        </div>
      </form>
    </div>
  );
};
