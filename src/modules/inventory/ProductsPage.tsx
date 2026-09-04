import React, { useEffect, useState } from 'react';
import { useProductStore } from '@stores/useProductStore';
import { useAuthStore } from '@stores/useAuthStore';
import { Table, Column } from '@components/ui/Table';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { SearchBox } from '@components/ui/SearchBox';
import { Card } from '@components/ui/Card';
import { ProductEntity } from '@shared/types';
import { Plus, Package, Archive, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@renderer/utils/currency';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { products, loadProducts, archiveProduct } = useProductStore();
  const { user, permissions } = useAuthStore();
  const [search, setSearch] = useState('');

  const canViewCost =
    permissions.includes('products.view_cost') || permissions.includes('system.all');
  const canManageProducts =
    permissions.includes('products.create') || permissions.includes('system.all');

  useEffect(() => {
    loadProducts(search);
  }, [loadProducts, search]);

  const columns: Column<ProductEntity>[] = [
    {
      key: 'name_en',
      header: 'Product Name',
      render: (p) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">{p.name_en}</span>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            {p.name_ar && <span>{p.name_ar}</span>}
            {p.name_ar && <span>•</span>}
            <span className="font-mono">SKU: {p.sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'quantity_on_hand' as keyof ProductEntity,
      header: 'Stock On Hand',
      render: (p: ProductEntity) => {
        const qty = p.quantity_on_hand ?? 0;
        const threshold =
          p.reorder_level && p.reorder_level > 0
            ? p.reorder_level
            : p.min_stock && p.min_stock > 0
              ? p.min_stock
              : 100;
        const isZero = qty <= 0;
        const isLow = qty < threshold;
        const unit = p.unit_symbol || '';

        return (
          <div className="flex flex-col space-y-0.5">
            <div className="flex items-center space-x-1 font-bold">
              <span
                className={`text-sm ${
                  isZero || isLow
                    ? 'text-rose-600 dark:text-rose-400 font-black'
                    : 'text-slate-900 dark:text-slate-100 font-bold'
                }`}
              >
                {qty}
              </span>
              {unit && <span className="text-xs text-slate-400 font-normal">{unit}</span>}
            </div>
            {isZero ? (
              <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 px-1.5 py-0.5 rounded w-fit">
                Out of Stock
              </span>
            ) : isLow ? (
              <span className="inline-flex items-center text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 px-1.5 py-0.5 rounded w-fit">
                ⚠️ Restock (&lt; {threshold})
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'selling_price',
      header: 'Selling Price (FCFA)',
      render: (p) => (
        <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
          {formatCurrency(p.selling_price)}
        </span>
      ),
    },
    ...(canViewCost
      ? [
          {
            key: 'purchase_cost' as keyof ProductEntity,
            header: 'Purchase Cost (FCFA)',
            render: (p: ProductEntity) => (
              <span className="text-slate-500 font-mono text-xs">
                {formatCurrency(p.purchase_cost)}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'is_active',
      header: 'Status',
      render: (p) => (
        <Badge variant={p.is_active ? 'success' : 'danger'}>
          {p.is_active ? 'Active' : 'Archived'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div className="flex items-center space-x-2">
          {canManageProducts && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/inventory/products/edit/${p.id}`)}
                title="Edit Product"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => user && archiveProduct(p.id, user.id)}
                title="Archive Product"
              >
                <Archive className="h-3.5 w-3.5 text-rose-500" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-sky-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Product Management
            </h1>
            <p className="text-xs text-slate-500">
              Manage product master records, barcodes, prices, units, and stock tracking settings.
            </p>
          </div>
        </div>

        {canManageProducts && (
          <Button
            onClick={() => navigate('/inventory/products/new')}
            size="md"
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        )}
      </div>

      <Card>
        <div className="mb-4 max-w-xs">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search products by name..."
          />
        </div>

        <Table columns={columns} data={products} keyExtractor={(p) => p.id} />
      </Card>
    </div>
  );
};
