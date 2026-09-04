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
  const { categories, units, loadMetadata, createProduct, isLoading, error } =
    useProductStore();
  const { user } = useAuthStore();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      nameEn: '',
      nameAr: '',
      productType: 'Weighted product',
      categoryId: '',
      baseUnitId: '',
      purchaseCost: 0,
      sellingPrice: 0,
      minSellingPrice: 0,
      wholesalePrice: 0,
      taxRate: 0,
      allowDecimalQty: true,
      qtyPrecision: 2,
      trackInventory: true,
      minStock: 0,
      maxStock: 1000,
      reorderLevel: 100,
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
          setValue('nameEn', p.name_en);
          setValue('nameAr', p.name_ar || p.name_en);
          setValue('categoryId', p.category_id);
          setValue('baseUnitId', p.base_unit_id);
          setValue('purchaseCost', p.purchase_cost);
          setValue('sellingPrice', p.selling_price);
          setValue('minSellingPrice', p.min_selling_price || 0);
          setValue('trackInventory', p.track_inventory === 1);
          setValue('reorderLevel', p.reorder_level ?? 100);
        }
      });
    }
  }, [id, setValue]);

  const onSubmit = async (data: ProductInput) => {
    setSuccessMsg(null);
    // Ensure nameAr mirrors nameEn if not explicitly set
    if (!data.nameAr) data.nameAr = data.nameEn;
    const ok = await createProduct(data, user?.id);
    if (ok) {
      setSuccessMsg('Product saved successfully!');
      setTimeout(() => navigate('/inventory/products'), 1000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {id ? 'Edit Product' : 'Create New Product'}
          </h1>
          <p className="text-xs text-slate-500">
            Add a new product with simple pricing and starting inventory quantity.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/inventory/products')}>
          Cancel
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Section 1: Product Name */}
        <Card title="1. Product Details">
          <Input
            label="Product Name *"
            placeholder="e.g. Fresh Salmon, Sea Bass, Jumbo Shrimp..."
            {...register('nameEn')}
            error={errors.nameEn?.message}
            autoFocus
          />
        </Card>

        {/* Section 2: Category & Unit */}
        <Card title="2. Category & Unit">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category *
              </label>
              <select
                {...register('categoryId')}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Base Unit (Sold By) *
              </label>
              <select
                {...register('baseUnitId')}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
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

        {/* Section 3: Pricing & Cost */}
        <Card title="3. Pricing (FCFA)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Purchase Cost / Cost per Unit (FCFA)"
              type="number"
              step="any"
              placeholder="0"
              {...register('purchaseCost', { valueAsNumber: true })}
              error={errors.purchaseCost?.message}
            />
            <Input
              label="Selling Price per Unit (FCFA) *"
              type="number"
              step="any"
              placeholder="0"
              {...register('sellingPrice', { valueAsNumber: true })}
              error={errors.sellingPrice?.message}
            />
          </div>
        </Card>

        {/* Section 4: Initial Stock & Restock Alert */}
        <Card title="4. Stock & Restock Alert Threshold">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Opening Stock Quantity in Store"
              type="number"
              step="any"
              placeholder="0"
              {...register('openingStockQty', { valueAsNumber: true })}
              helperText="Current quantity available in stock right now"
            />
            <Input
              label="Restock Alert Level (Default: 100)"
              type="number"
              step="any"
              placeholder="100"
              {...register('reorderLevel', { valueAsNumber: true })}
              helperText="Turns RED when stock falls below this quantity"
            />
          </div>
        </Card>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/inventory/products')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} size="lg" className="bg-sky-600 hover:bg-sky-500 font-bold">
            Save Product ✓
          </Button>
        </div>
      </form>
    </div>
  );
};

