import React, { useEffect } from 'react';
import { usePOSStore } from '@stores/usePOSStore';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Clock, Play } from 'lucide-react';
import { formatDateTime } from '@utils/date';
import { formatCurrency } from '../../renderer/utils/currency';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export const POSHoldResumeModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
  const { suspendedSales, loadSuspendedSales } = usePOSStore();

  useEffect(() => {
    if (isOpen) {
      loadSuspendedSales();
    }
  }, [isOpen, loadSuspendedSales]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Held Suspended Sales
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {suspendedSales.map((sale) => (
            <Card
              key={sale.id}
              className="p-4 flex items-center justify-between border-slate-200 dark:border-slate-800"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  {sale.reference_name}
                </span>
                <span className="text-[10px] text-slate-400">
                  {formatDateTime(sale.created_at)} • Total: {formatCurrency(sale.grand_total)}
                </span>
                {sale.notes && (
                  <p className="text-[10px] text-slate-500 italic mt-0.5">{sale.notes}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onSelect(sale.id);
                    onClose();
                  }}
                  className="flex items-center space-x-1"
                >
                  <Play className="h-3 w-3" />
                  <span>Resume</span>
                </Button>
              </div>
            </Card>
          ))}

          {suspendedSales.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No held sales currently suspended.
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close (ESC)
          </Button>
        </div>
      </div>
    </div>
  );
};
