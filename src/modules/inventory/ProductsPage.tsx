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
      header: 'Product Details',
      render: (p) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">{p.name_en}</span>
          <span className="text-[10px] text-slate-500">
            {p.name_ar} • SKU: {p.sku}
          </span>
        </div>
      ),
    },
    {
      key: 'primary_barcode',
      header: 'Barcode',
      render: (p) =>
        p.primary_barcode ? (
          <span className="font-mono text-xs">{p.primary_barcode}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'selling_price',
      header: 'Selling Price',
      render: (p) => (
        <span className="font-bold text-slate-800 dark:text-slate-200">
          ${p.selling_price.toFixed(2)}
        </span>
      ),
    },
    ...(canViewCost
      ? [
          {
            key: 'purchase_cost' as keyof ProductEntity,
            header: 'Purchase Cost',
            render: (p: ProductEntity) => (
              <span className="text-slate-500 font-mono text-xs">
                ${p.purchase_cost.toFixed(2)}
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
            placeholder="Search by name, SKU, or barcode..."
          />
        </div>

        <Table columns={columns} data={products} keyExtractor={(p) => p.id} />
      </Card>
    </div>
  );
};
