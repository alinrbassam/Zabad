import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@components/ui/Button';
import { PauseCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (referenceName: string) => void;
}

export const POSHoldSaveModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const [refName, setRefName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRefName('');
      // Slight delay to ensure modal is mounted and autoFocus works reliably
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (refName.trim()) {
      onConfirm(refName.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <PauseCircle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Hold Current Sale
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Reference Name / Identifier
            </label>
            <input
              ref={inputRef}
              type="text"
              required
              value={refName}
              onChange={(e) => setRefName(e.target.value)}
              placeholder="e.g. John, Table 4, Phone Order..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-[10px] text-slate-500">
              Give this held sale a name so you can easily identify it when resuming.
            </p>
          </div>

          <div className="flex space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!refName.trim()}
              className="w-full flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Hold Sale ✓</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
