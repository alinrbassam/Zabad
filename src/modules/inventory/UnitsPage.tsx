import React, { useEffect, useState } from 'react';
import { useProductStore } from '@stores/useProductStore';
import { Table, Column } from '@components/ui/Table';
import { Button } from '@components/ui/Button';
import { Dialog } from '@components/ui/Dialog';
import { Input } from '@components/ui/Input';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { UnitEntity } from '@shared/types';
import { Scale, Plus } from 'lucide-react';

export const UnitsPage: React.FC = () => {
  const { units, loadMetadata } = useProductStore();
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [symbol, setSymbol] = useState('');
  const [category, setCategory] = useState<UnitEntity['unit_category']>('Count');
  const [allowDecimals, setAllowDecimals] = useState(false);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (window.api?.createUnit) {
      await window.api.createUnit({
        code,
        nameEn,
        nameAr,
        symbol,
        unitCategory: category,
        allowDecimals,
        decimalPrecision: allowDecimals ? 2 : 0,
        isActive: true,
      });
      setIsOpen(false);
      setCode('');
      setNameEn('');
      setNameAr('');
      setSymbol('');
      loadMetadata();
    }
  };

  const columns: Column<UnitEntity>[] = [
    {
      key: 'name_en',
      header: 'Unit Name',
      render: (u) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 block">{u.name_en}</span>
          <span className="text-[10px] text-slate-500">
            {u.name_ar} • Symbol: {u.symbol}
          </span>
        </div>
      ),
    },
    {
      key: 'unit_category',
      header: 'Category',
      render: (u) => <Badge variant="info">{u.unit_category}</Badge>,
    },
    {
      key: 'allow_decimals',
      header: 'Decimals',
      render: (u) =>
        u.allow_decimals ? (
          <Badge variant="success">Allowed ({u.decimal_precision})</Badge>
        ) : (
          <span className="text-slate-400">Integer Only</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Scale className="h-6 w-6 text-sky-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Units of Measurement
            </h1>
            <p className="text-xs text-slate-500">
              Configure retail count, weight, volume, length, and packaging units.
            </p>
          </div>
        </div>

        <Button onClick={() => setIsOpen(true)} size="md" className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Unit</span>
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={units} keyExtractor={(u) => u.id} />
      </Card>

      <Dialog isOpen={isOpen} title="Create Unit" onClose={() => setIsOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unit Code *"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <Input
              label="Symbol *"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Unit Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as UnitEntity['unit_category'])}
              className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
            >
              <option value="Count">Count (Piece, Box)</option>
              <option value="Weight">Weight (Kg, Gram)</option>
              <option value="Volume">Volume (Liter, ml)</option>
              <option value="Length">Length (Meter, cm)</option>
              <option value="Packaging">Packaging (Carton, Pack)</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={allowDecimals}
              onChange={(e) => setAllowDecimals(e.target.checked)}
              className="rounded border-slate-300 text-sky-600"
            />
            <span>Allow Decimal Fractional Quantities (e.g. 1.75 kg)</span>
          </label>

          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Unit</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
