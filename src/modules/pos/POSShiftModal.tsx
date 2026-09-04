import React, { useState } from 'react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Store, DollarSign } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (openingCash: number) => void;
}

export const POSShiftModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const [openingCash, setOpeningCash] = useState(100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <Store className="h-5 w-5 text-sky-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Open Register Shift
          </h2>
        </div>

        <Card className="space-y-3">
          <Input
            label="Opening Float Cash (FCFA)"
            type="number"
            step="any"
            value={openingCash}
            onChange={(e) => setOpeningCash(Number(e.target.value))}
            autoFocus
          />
        </Card>

        <div className="flex space-x-3 pt-2">
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(openingCash)}
            className="w-full flex items-center justify-center space-x-2"
          >
            <DollarSign className="h-4 w-4" />
            <span>Open Register</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
