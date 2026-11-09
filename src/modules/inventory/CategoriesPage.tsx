import React, { useEffect, useState } from 'react';
import { useProductStore } from '@stores/useProductStore';
import { useLanguageStore } from '@stores/useLanguageStore';
import { Table, Column } from '@components/ui/Table';
import { Button } from '@components/ui/Button';
import { Dialog } from '@components/ui/Dialog';
import { Input } from '@components/ui/Input';
import { Card } from '@components/ui/Card';
import { Alert } from '@components/ui/Alert';
import { AdminPasswordConfirmModal } from '@components/auth/AdminPasswordConfirmModal';
import { CategoryEntity } from '@shared/types';
import { FolderTree, Plus, Trash2 } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const { categories, loadMetadata } = useProductStore();
  const { language } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryToForceDelete, setCategoryToForceDelete] = useState<CategoryEntity | null>(null);
  const [isForceDeleting, setIsForceDeleting] = useState(false);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (window.api?.createCategory) {
        const res = await window.api.createCategory({
          nameEn,
          nameAr: nameAr || nameEn,
          isActive: true,
          displayOrder: 0,
        });
        if (res.success) {
          setIsOpen(false);
          setNameEn('');
          setNameAr('');
          loadMetadata();
        } else {
          setError(res.error?.message || 'Failed creating category');
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (category: CategoryEntity, force = false): Promise<boolean> => {
    try {
      if (window.api?.deleteCategory) {
        const res = await window.api.deleteCategory(category.id, force);
        if (res.success) {
          await loadMetadata();
          return true;
        } else {
          const msg = res.error?.message || '';
          if (!force && msg.toLowerCase().includes('contains') && msg.toLowerCase().includes('product')) {
            setCategoryToForceDelete(category);
            return false;
          } else {
            alert(msg || 'Cannot delete category');
            return false;
          }
        }
      }
      return false;
    } catch (err) {
      alert((err as Error).message);
      return false;
    }
  };

  const columns: Column<CategoryEntity>[] = [
    {
      key: 'name_en',
      header: 'Category Name',
      render: (c) => (
        <span className="font-bold text-slate-800 dark:text-slate-200">{c.name_en}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(c)}
          title="Delete Category"
        >
          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FolderTree className="h-6 w-6 text-sky-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Product Categories
            </h1>
            <p className="text-xs text-slate-500">
              Manage fish and product categories (e.g. Fresh Fish, Fillets, Shrimp & Shellfish).
            </p>
          </div>
        </div>

        <Button onClick={() => setIsOpen(true)} size="md" className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-500 font-bold">
          <Plus className="h-4 w-4" />
          <span>New Category</span>
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={categories} keyExtractor={(c) => c.id} />
      </Card>

      <Dialog isOpen={isOpen} title="Create Category" onClose={() => setIsOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <Input
            label="Category Name *"
            placeholder="e.g. Fresh Fish, Fillets, Shrimp..."
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            required
            autoFocus
          />
          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="bg-sky-600 hover:bg-sky-500 font-bold">
              Save Category
            </Button>
          </div>
        </form>
      </Dialog>

      <AdminPasswordConfirmModal
        isOpen={Boolean(categoryToForceDelete)}
        title={
          language === 'ar'
            ? 'حذف القسم وجميع منتجاته'
            : language === 'fr'
            ? 'Supprimer la catégorie et ses articles'
            : 'Delete Category & Its Products'
        }
        message={
          language === 'ar'
            ? `يحتوي القسم "${categoryToForceDelete?.name_en}" على منتجات نشطة. هل تريد حذف القسم وجميع المنتجات الموجودة بداخله؟`
            : language === 'fr'
            ? `La catégorie "${categoryToForceDelete?.name_en}" contient des articles actifs. Voulez-vous la supprimer ainsi que tous ses articles ?`
            : `The category "${categoryToForceDelete?.name_en}" contains active products. Do you want to delete this category along with all its products?`
        }
        warningText={
          language === 'ar'
            ? 'سيؤدي هذا الإجراء إلى حذف جميع المنتجات المرتبطة بهذا القسم من المخزون ونقطة البيع.'
            : language === 'fr'
            ? 'Cette action supprimera tous les articles de cette catégorie du stock et de la caisse.'
            : 'This action will remove all products inside this category from inventory and POS.'
        }
        confirmLabel={
          language === 'ar' ? 'نعم، حذف الكل' : language === 'fr' ? 'Oui, tout supprimer' : 'Delete All'
        }
        isLoading={isForceDeleting}
        onClose={() => !isForceDeleting && setCategoryToForceDelete(null)}
        onConfirm={async () => {
          if (!categoryToForceDelete) return;
          setIsForceDeleting(true);
          const ok = await handleDelete(categoryToForceDelete, true);
          setIsForceDeleting(false);
          if (ok) {
            setCategoryToForceDelete(null);
          } else {
            throw new Error('Failed to delete category and products');
          }
        }}
      />
    </div>
  );
};
