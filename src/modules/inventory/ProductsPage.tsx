import React, { useEffect, useState, useMemo } from 'react';
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
  const { user, permissions, activeRoleMode } = useAuthStore();
  const { language } = useLanguageStore();
  const [search, setSearch] = useState('');
  const [productToDelete, setProductToDelete] = useState<ProductEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canViewCost =
    activeRoleMode === 'manager' ||
    permissions.includes('products.view_cost') ||
    permissions.includes('system.all');

  useEffect(() => {
    loadProducts(search);
  }, [loadProducts, search]);

  const stats = useMemo(() => {
    const totalTypes = products.length;
    const totalUnits = products.reduce((sum, p) => sum + (p.quantity_on_hand || 0), 0);
    const totalCost = products.reduce(
      (sum, p) => sum + (p.quantity_on_hand || 0) * (p.purchase_cost || 0),
      0,
    );
    const totalSelling = products.reduce(
      (sum, p) => sum + (p.quantity_on_hand || 0) * (p.selling_price || 0),
      0,
    );
    const potentialProfit = Math.max(0, totalSelling - totalCost);

    return {
      totalTypes,
      totalUnits: Math.round(totalUnits * 100) / 100,
      totalCost,
      totalSelling,
      potentialProfit,
    };
  }, [products]);

  const columns: Column<ProductEntity>[] = [
    {
      key: 'name_en',
      header: language === 'ar' ? 'اسم المنتج' : language === 'fr' ? 'Nom du Produit' : 'Product Name',
      render: (p) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">{p.name_en}</span>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span>{p.name_ar || p.name_en}</span>
            <span>•</span>
            <span className="font-mono">SKU: {p.sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'quantity_on_hand' as keyof ProductEntity,
      header: language === 'ar' ? 'الكمية المتوفرة' : language === 'fr' ? 'Stock Disponible' : 'Stock On Hand',
      render: (p: ProductEntity) => {
        const qty = p.quantity_on_hand ?? 0;
        const threshold =
          p.reorder_level && p.reorder_level > 0
            ? p.reorder_level
            : p.min_stock && p.min_stock > 0
              ? p.min_stock
              : 10;
        const isZero = qty <= 0;
        const isLow = qty < threshold;
        const unit = p.unit_symbol || 'pcs';

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
      header: language === 'ar' ? 'سعر البيع (FCFA)' : language === 'fr' ? 'Prix de Vente (FCFA)' : 'Selling Price (FCFA)',
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
            header: language === 'ar' ? 'سعر التكلفة (FCFA)' : language === 'fr' ? "Coût d'Achat (FCFA)" : 'Purchase Cost (FCFA)',
            render: (p: ProductEntity) => (
              <span className="text-slate-500 font-mono text-xs">
                {formatCurrency(p.purchase_cost)}
              </span>
            ),
          },
          {
            key: 'stock_cost_value' as any,
            header: language === 'ar' ? 'إجمالي قيمة المخزون (FCFA)' : language === 'fr' ? 'Valeur Totale du Stock (FCFA)' : 'Total Stock Value (FCFA)',
            render: (p: ProductEntity) => {
              const qty = p.quantity_on_hand || 0;
              const cost = p.purchase_cost || 0;
              const val = qty * cost;
              return (
                <div>
                  <span className="font-extrabold text-xs text-sky-600 dark:text-sky-400 font-mono block">
                    {formatCurrency(val)}
                  </span>
                </div>
              );
            },
          },
        ]
      : []),
    {
      key: 'is_active',
      header: language === 'ar' ? 'الحالة' : language === 'fr' ? 'Statut' : 'Status',
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/inventory/products/edit/${p.id}`)}
            title={language === 'ar' ? 'تعديل المنتج' : language === 'fr' ? 'Modifier' : 'Edit Product'}
            className="hover:bg-sky-100 dark:hover:bg-sky-950/60 text-sky-600 p-1.5 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProductToDelete(p)}
            title={language === 'ar' ? 'حذف المنتج' : language === 'fr' ? 'Supprimer' : 'Delete Product'}
            className="hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-500 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
              {language === 'ar'
                ? 'إدارة المنتجات وتقييم المخزون'
                : language === 'fr'
                ? 'Gestion des Produits & Valorisation du Stock'
                : 'Product Management & Stock Valuation'}
            </h1>
            <p className="text-xs text-slate-500">
              {language === 'ar'
                ? 'إدارة بيانات المنتجات والكميات المتوفرة وقيمة المخزون الفورية.'
                : language === 'fr'
                ? 'Gérez les produits, les quantités en stock et la valorisation en temps réel.'
                : 'Manage product records, stock quantities, and view real-time inventory valuations.'}
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate('/inventory/products/new')}
          size="md"
          className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-500 font-bold"
        >
          <Plus className="h-4 w-4" />
          <span>{language === 'ar' ? '+ إضافة منتج' : language === 'fr' ? 'Ajouter un Produit' : 'Add Product'}</span>
        </Button>
      </div>

      {/* Inventory & Stock Valuation Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Units & Products */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">
              {language === 'ar'
                ? 'إجمالي الأصناف والقطع'
                : language === 'fr'
                ? 'Total Unités en Stock'
                : 'Total Units In Stock'}
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {stats.totalUnits.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">
                {language === 'ar' ? 'وحدة' : language === 'fr' ? 'unités' : 'units'}
              </span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {stats.totalTypes}{' '}
              {language === 'ar'
                ? 'منتج مسجل'
                : language === 'fr'
                ? 'produits actifs'
                : 'active products'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Stock Cost Valuation */}
        {canViewCost && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-amber-500/20 dark:border-amber-500/30 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                {language === 'ar'
                  ? 'قيمة المخزون (سعر التكلفة)'
                  : language === 'fr'
                  ? 'Valorisation Stock (Coût)'
                  : 'Stock Valuation (Cost Value)'}
              </p>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                {formatCurrency(stats.totalCost)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg">
              💰
            </div>
          </div>
        )}

        {/* Card 3: Total Stock Selling Valuation */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {language === 'ar'
                ? 'قيمة المخزون (سعر البيع)'
                : language === 'fr'
                ? 'Valorisation Stock (Vente)'
                : 'Stock Valuation (Selling Value)'}
            </p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {formatCurrency(stats.totalSelling)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
            🏷️
          </div>
        </div>

        {/* Card 4: Potential Gross Profit */}
        {canViewCost && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                {language === 'ar'
                  ? 'الربح الإجمالي المتوقع'
                  : language === 'fr'
                  ? 'Bénéfice Brut Potentiel'
                  : 'Potential Gross Profit'}
              </p>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                {formatCurrency(stats.potentialProfit)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-lg">
              📈
            </div>
          </div>
        )}
      </div>

      <Card>
        <div className="mb-4 max-w-xs">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder={
              language === 'ar'
                ? 'بحث عن منتج بالاسم...'
                : language === 'fr'
                ? 'Rechercher un produit...'
                : 'Search products by name...'
            }
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
                  const ok = await deleteProduct(productToDelete.id, user?.id);
                  setIsDeleting(false);
                  if (ok) {
                    setProductToDelete(null);
                  } else {
                    alert(
                      language === 'ar'
                        ? 'تعذر حذف المنتج'
                        : language === 'fr'
                        ? "Impossible de supprimer l'article"
                        : 'Failed to delete product'
                    );
                  }
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
