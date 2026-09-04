import React, { useEffect, useState } from 'react';
import { useProductStore } from '@stores/useProductStore';
import { Table, Column } from '@components/ui/Table';
import { Button } from '@components/ui/Button';
import { Dialog } from '@components/ui/Dialog';
import { Input } from '@components/ui/Input';
import { Card } from '@components/ui/Card';
import { Alert } from '@components/ui/Alert';
import { CategoryEntity } from '@shared/types';
import { FolderTree, Plus, Trash2 } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const { categories, loadMetadata } = useProductStore();
  const [isOpen, setIsOpen] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleDelete = async (id: string) => {
    try {
      if (window.api?.deleteCategory) {
        const res = await window.api.deleteCategory(id);
        if (res.success) {
          loadMetadata();
        } else {
          alert(res.error?.message || 'Cannot delete category');
        }
      }
    } catch (err) {
      alert((err as Error).message);
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
          onClick={() => handleDelete(c.id)}
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
    </div>
  );
};
