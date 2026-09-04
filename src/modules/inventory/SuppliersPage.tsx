import React, { useEffect, useState } from 'react';
import { useProductStore } from '@stores/useProductStore';
import { Table, Column } from '@components/ui/Table';
import { Button } from '@components/ui/Button';
import { Dialog } from '@components/ui/Dialog';
import { Input } from '@components/ui/Input';
import { Card } from '@components/ui/Card';
import { SupplierEntity } from '@shared/types';
import { Truck, Plus } from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const { suppliers, loadMetadata } = useProductStore();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contact, setContact] = useState('');

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (window.api?.createSupplier) {
      await window.api.createSupplier({
        code: `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        phone,
        contactPerson: contact,
        isActive: true,
      });
      setIsOpen(false);
      setName('');
      setPhone('');
      setContact('');
      loadMetadata();
    }
  };

  const columns: Column<SupplierEntity>[] = [
    {
      key: 'name',
      header: 'Supplier Name',
      render: (s) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 block">{s.name}</span>
          <span className="text-[10px] text-slate-500">Code: {s.code}</span>
        </div>
      ),
    },
    {
      key: 'contact_person',
      header: 'Contact Person',
      render: (s) => (
        <span className="text-slate-600 dark:text-slate-400 text-xs">
          {s.contact_person || '—'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (s) => <span className="text-slate-500 font-mono text-xs">{s.phone || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Truck className="h-6 w-6 text-sky-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Supplier Profiles
            </h1>
            <p className="text-xs text-slate-500">
              Manage vendor contact details and supplier associations.
            </p>
          </div>
        </div>

        <Button onClick={() => setIsOpen(true)} size="md" className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Supplier</span>
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={suppliers} keyExtractor={(s) => s.id} />
      </Card>

      <Dialog isOpen={isOpen} title="Create Supplier Profile" onClose={() => setIsOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Supplier / Fisherman Name *"
            placeholder="e.g. Harbor Fisherman Abu Ahmad, Coastal Fresh Fish Co..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Phone Number"
            placeholder="e.g. +961 70 123456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Contact Person (Optional)"
            placeholder="e.g. Abu Ahmad"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-sky-600 hover:bg-sky-500 font-bold">
              Save Supplier ✓
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
