import React, { useEffect, useState } from 'react';
import { useProductStore } from '@stores/useProductStore';
import { useAuthStore } from '@stores/useAuthStore';
import { useLanguageStore } from '@stores/useLanguageStore';
import { Table, Column } from '@components/ui/Table';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Dialog } from '@components/ui/Dialog';
import { SearchBox } from '@components/ui/SearchBox';
import { Card } from '@components/ui/Card';
import { ProductEntity } from '@shared/types';
import { Plus, Package, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@renderer/utils/currency';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { products, loadProducts, deleteProduct } = useProductStore();
  const { user, permissions } = useAuthStore();
  const { language } = useLanguageStore();
  const [search, setSearch] = useState('');
  const [productToDelete, setProductToDelete] = useState<ProductEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      render: (p) => (
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          {canManageProducts && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/inventory/products/edit/${p.id}`)}
                title={language === 'ar' ? 'تعديل المنتج' : language === 'fr' ? 'Modifier' : 'Edit Product'}
                className="hover:bg-slate-100 text-sky-600"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProductToDelete(p)}
                title={language === 'ar' ? 'حذف المنتج' : language === 'fr' ? 'Supprimer' : 'Delete Product'}
                className="hover:bg-rose-50 text-rose-500 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
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

      {/* Delete Product Confirmation Modal */}
      <Dialog
        isOpen={Boolean(productToDelete)}
        title={
          language === 'ar'
            ? 'تأكيد حذف المنتج'
            : language === 'fr'
            ? 'Confirmer la suppression'
            : 'Confirm Product Deletion'
        }
        onClose={() => !isDeleting && setProductToDelete(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {language === 'ar'
              ? `هل أنت متأكد من حذف المنتج "${productToDelete?.name_ar || productToDelete?.name_en}"؟`
              : language === 'fr'
              ? `Êtes-vous sûr de vouloir supprimer "${productToDelete?.name_en}" ?`
              : `Are you sure you want to delete "${productToDelete?.name_en}"?`}
          </p>
          <p className="text-xs text-slate-400">
            {language === 'ar'
              ? 'سيتم حذف هذا المنتج من المخزون ونقطة البيع، مما يتيح لك حذف القسم المرتبط به إن رغبت.'
              : language === 'fr'
              ? "Cet article sera retiré du stock et de la caisse, ce qui permettra de supprimer sa catégorie si vous le souhaitez."
              : 'This product will be removed from inventory and the POS terminal, allowing its category to be deleted.'}
          </p>
          <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProductToDelete(null)}
              disabled={isDeleting}
            >
              {language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isDeleting}
              onClick={async () => {
                if (productToDelete) {
                  setIsDeleting(true);
                  await deleteProduct(productToDelete.id, user?.id);
                  setIsDeleting(false);
                  setProductToDelete(null);
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {language === 'ar' ? 'نعم، حذف' : language === 'fr' ? 'Oui, supprimer' : 'Yes, Delete'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
