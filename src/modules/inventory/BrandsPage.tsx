import React, { useEffect, useState } from 'react';
import { useProductStore } from '@stores/useProductStore';
import { Table, Column } from '@components/ui/Table';
import { Button } from '@components/ui/Button';
import { Dialog } from '@components/ui/Dialog';
import { Input } from '@components/ui/Input';
import { Card } from '@components/ui/Card';
import { BrandEntity } from '@shared/types';
import { Tag, Plus } from 'lucide-react';

export const BrandsPage: React.FC = () => {
  const { brands, loadMetadata } = useProductStore();
  const [isOpen, setIsOpen] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (window.api?.createBrand) {
      await window.api.createBrand({ nameEn, nameAr, countryOfOrigin: country, isActive: true });
      setIsOpen(false);
      setNameEn('');
      setNameAr('');
      setCountry('');
      loadMetadata();
    }
  };

  const columns: Column<BrandEntity>[] = [
    {
      key: 'name_en',
      header: 'English Name',
      render: (b) => (
        <span className="font-bold text-slate-800 dark:text-slate-200">{b.name_en}</span>
      ),
    },
    {
      key: 'name_ar',
      header: 'Arabic Name',
      render: (b) => <span className="text-slate-600 dark:text-slate-400">{b.name_ar}</span>,
    },
    {
      key: 'country_of_origin',
      header: 'Country of Origin',
      render: (b) => <span className="text-slate-500 text-xs">{b.country_of_origin || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Tag className="h-6 w-6 text-sky-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Brand Management
            </h1>
            <p className="text-xs text-slate-500">Manage manufacturers, brands, and origins.</p>
          </div>
        </div>

        <Button onClick={() => setIsOpen(true)} size="md" className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Brand</span>
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={brands} keyExtractor={(b) => b.id} />
      </Card>

      <Dialog isOpen={isOpen} title="Create Brand" onClose={() => setIsOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="English Name *"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            required
          />
          <Input
            label="Arabic Name *"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            required
          />
          <Input
            label="Country of Origin"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Brand</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
