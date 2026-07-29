import React, { useState } from 'react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { CreditCard, Banknote, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  onConfirm: (
    payments: {
      paymentMethod: 'Cash' | 'Card' | 'Digital Wallet' | 'Store Credit';
      amount: number;
      referenceNumber?: string;
    }[],
    tendered: number,
  ) => void;
}

export const POSPaymentModal: React.FC<Props> = ({ isOpen, onClose, grandTotal, onConfirm }) => {
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Card' | 'Split'>('Cash');
  const [cashTendered, setCashTendered] = useState(grandTotal);
  const [cardAmount, setCardAmount] = useState(0);
  const [cardRef, setCardRef] = useState('');

  if (!isOpen) return null;

  const changeAmount = Math.max(
    0,
    Math.round(
      (cashTendered - (paymentMode === 'Split' ? grandTotal - cardAmount : grandTotal)) * 100,
    ) / 100,
  );

  const handlePay = () => {
    if (paymentMode === 'Cash') {
      onConfirm([{ paymentMethod: 'Cash', amount: grandTotal }], cashTendered);
    } else if (paymentMode === 'Card') {
      onConfirm(
        [{ paymentMethod: 'Card', amount: grandTotal, referenceNumber: cardRef }],
        grandTotal,
      );
    } else {
      const cashPart = Math.round((grandTotal - cardAmount) * 100) / 100;
      onConfirm(
        [
          { paymentMethod: 'Cash', amount: cashPart },
          { paymentMethod: 'Card', amount: cardAmount, referenceNumber: cardRef },
        ],
        cashTendered + cardAmount,
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Checkout Payment
            </h2>
            <p className="text-xs text-slate-500">
              Select payment method and calculate change due.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Total Amount Due:
          </span>
          <span className="text-2xl font-black text-emerald-400">${grandTotal.toFixed(2)}</span>
        </div>

        {/* Payment Method Selector */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMode('Cash')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition-all ${
              paymentMode === 'Cash'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Banknote className="h-5 w-5 mb-1" />
            <span>Cash (F2)</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMode('Card')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition-all ${
              paymentMode === 'Card'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <CreditCard className="h-5 w-5 mb-1" />
            <span>Card (F3)</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMode('Split')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition-all ${
              paymentMode === 'Split'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <ShieldAlert className="h-5 w-5 mb-1" />
            <span>Split Payment</span>
          </button>
        </div>

        {/* Dynamic Payment Fields */}
        <Card className="space-y-4">
          {paymentMode === 'Cash' && (
            <div className="space-y-3">
              <Input
                label="Cash Tendered ($)"
                type="number"
                step="0.01"
                value={cashTendered}
                onChange={(e) => setCashTendered(Number(e.target.value))}
                autoFocus
              />
              <div className="flex justify-between items-center pt-2 text-xs font-bold">
                <span className="text-slate-500">Change Due:</span>
                <span className="text-lg font-black text-sky-600">${changeAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {paymentMode === 'Card' && (
            <div className="space-y-3">
              <Input
                label="Card Authorization / Ref #"
                value={cardRef}
                onChange={(e) => setCardRef(e.target.value)}
                placeholder="e.g. TXN-99482"
                autoFocus
              />
            </div>
          )}

          {paymentMode === 'Split' && (
            <div className="space-y-3">
              <Input
                label="Card Amount ($)"
                type="number"
                step="0.01"
                value={cardAmount}
                onChange={(e) => setCardAmount(Number(e.target.value))}
              />
              <Input
                label="Card Ref #"
                value={cardRef}
                onChange={(e) => setCardRef(e.target.value)}
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Remaining Cash Part:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  ${Math.max(0, grandTotal - cardAmount).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </Card>

        <div className="flex space-x-3 pt-2">
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel (ESC)
          </Button>
          <Button
            onClick={handlePay}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Complete Sale ✓</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
