import React, { useState, useEffect } from 'react';
import { Button } from '@components/ui/Button';
import { useLanguageStore } from '../../renderer/stores/useLanguageStore';
import { formatCurrency } from '../../renderer/utils/currency';
import {
  Banknote,
  CheckCircle2,
  Clock,
  UserCheck,
  Calendar,
  Phone,
  User,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  onConfirm: (
    payments: {
      paymentMethod: 'Cash' | 'Card' | 'Digital Wallet' | 'Store Credit' | 'Borrow' | 'Credit' | string;
      amount: number;
      referenceNumber?: string;
    }[],
    tendered: number,
    borrowDetails?: {
      customerName: string;
      customerPhone?: string;
      dueDate?: string;
      notes?: string;
    },
  ) => void;
}

export const POSPaymentModal: React.FC<Props> = ({ isOpen, onClose, grandTotal, onConfirm }) => {
  const { language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<'cash' | 'borrow'>('cash');

  // Cash state
  const [cashTendered, setCashTendered] = useState<string>(Math.round(grandTotal).toString());

  // Borrow / Credit state
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [downPayment, setDownPayment] = useState<string>('0');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('cash');
      setCashTendered(Math.round(grandTotal).toString());
      setBorrowerName('');
      setBorrowerPhone('');
      setDownPayment('0');
      setDueDate('');
      setNotes('');
      setValidationError(null);
    }
  }, [isOpen, grandTotal]);

  // Keyboard shortcut to confirm on Enter or close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Cash calculation
  const parsedTendered = parseFloat(cashTendered) || 0;
  const changeAmount = Math.max(0, Math.round(parsedTendered - grandTotal));

  // Borrow calculation
  const parsedDownPayment = Math.max(0, parseFloat(downPayment) || 0);
  const remainingDebt = Math.max(0, Math.round(grandTotal - parsedDownPayment));

  const handlePayCash = () => {
    if (parsedTendered < grandTotal) return;
    onConfirm([{ paymentMethod: 'Cash', amount: grandTotal }], parsedTendered);
  };

  const handleConfirmBorrow = () => {
    if (!borrowerName.trim()) {
      setValidationError(
        language === 'ar'
          ? 'يرجى إدخال اسم المستدين / العميل للمتابعة'
          : 'Please enter borrower name to continue',
      );
      return;
    }

    if (parsedDownPayment > grandTotal) {
      setValidationError(
        language === 'ar'
          ? 'المبلغ المدفوع مقدماً لا يمكن أن يتجاوز الإجمالي'
          : 'Down payment cannot exceed grand total',
      );
      return;
    }

    const payments: {
      paymentMethod: string;
      amount: number;
    }[] = [];

    if (parsedDownPayment > 0) {
      payments.push({
        paymentMethod: 'Cash',
        amount: parsedDownPayment,
      });
    }

    if (remainingDebt > 0 || parsedDownPayment === 0) {
      payments.push({
        paymentMethod: 'Borrow',
        amount: remainingDebt,
      });
    }

    onConfirm(payments, parsedDownPayment, {
      customerName: borrowerName.trim(),
      customerPhone: borrowerPhone.trim() || undefined,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const quickBills = [
    { label: language === 'ar' ? 'المبلغ بالضبط' : 'Exact', value: Math.round(grandTotal) },
    { label: '1,000 FCFA', value: 1000 },
    { label: '2,000 FCFA', value: 2000 },
    { label: '5,000 FCFA', value: 5000 },
    { label: '10,000 FCFA', value: 10000 },
    { label: '20,000 FCFA', value: 20000 },
    { label: '50,000 FCFA', value: 50000 },
  ].filter((b) => b.value >= grandTotal || b.label.includes('Exact') || b.label.includes('بالضبط'));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-900 max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className={`p-2.5 rounded-2xl border ${
              activeTab === 'cash' 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              {activeTab === 'cash' ? <Banknote className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {language === 'ar' ? 'إتمام المعاملة المالية' : 'Complete Transaction'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ar' ? 'اختر طريقة الدفع (نقداً أو آجل / دين)' : 'Select payment type (Cash or On-Credit / Borrow)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-base p-1"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher: Cash vs Borrow */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 border border-slate-200 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('cash');
              setValidationError(null);
            }}
            className={`flex items-center justify-center space-x-2 rtl:space-x-reverse py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'cash'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Banknote className="h-4 w-4" />
            <span>{language === 'ar' ? 'الدفع نقداً (Cash)' : 'Cash Payment'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('borrow');
              setValidationError(null);
            }}
            className={`flex items-center justify-center space-x-2 rtl:space-x-reverse py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'borrow'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>{language === 'ar' ? 'دين / آجل (Borrow)' : 'Borrow / On-Credit'}</span>
          </button>
        </div>

        {/* Total Amount Due Banner */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center">
          <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
            {language === 'ar' ? 'المبلغ الإجمالي المطلوب:' : 'Total Amount Due:'}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tracking-tight">
            {formatCurrency(grandTotal)}
          </div>
        </div>

        {/* CASH PAYMENT TAB */}
        {activeTab === 'cash' && (
          <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'ar' ? 'المبلغ المستلم من العميل (FCFA):' : 'Cash Received from Customer (FCFA):'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-2xl font-black text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-xs"
                  autoFocus
                />
                <span className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-3.5 text-xs text-emerald-600 font-bold">
                  FCFA
                </span>
              </div>
            </div>

            {/* Quick Bill Preset Buttons */}
            <div>
              <span className="text-[11px] text-slate-500 font-medium block mb-1.5">
                {language === 'ar' ? 'فئات نقدية سريعة:' : 'Quick Cash Presets:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {quickBills.map((b, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCashTendered(b.value.toString())}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 hover:border-sky-500/50 rounded-xl text-xs font-bold text-slate-700 font-mono transition-all active:scale-95 shadow-xs"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Change Due Calculation */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-semibold">
                {language === 'ar' ? 'المتبقي للعميل (الفكة):' : 'Change Due to Customer:'}
              </span>
              <span className="text-xl font-black text-emerald-600 font-mono">
                {formatCurrency(changeAmount)}
              </span>
            </div>
          </div>
        )}

        {/* BORROW / ON CREDIT TAB */}
        {activeTab === 'borrow' && (
          <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 rtl:space-x-reverse text-xs text-amber-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                {language === 'ar'
                  ? 'تسجيل البضاعة كدين في ذمة العميل بدون استلام المبلغ أو بدفعة جزئية مقدمة.'
                  : 'Record goods taken on credit without immediate payment or with partial down payment.'}
              </span>
            </div>

            {validationError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600">
                {validationError}
              </div>
            )}

            {/* Borrower Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                <span className="text-rose-500 mr-1 rtl:mr-0 rtl:ml-1">*</span>
                {language === 'ar' ? 'اسم المستدين / العميل:' : 'Borrower / Customer Name:'}
              </label>
              <div className="relative">
                <User className="absolute left-3 rtl:left-auto rtl:right-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={borrowerName}
                  onChange={(e) => {
                    setBorrowerName(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder={language === 'ar' ? 'مثال: محمد علي / مطعم البحر' : 'e.g. John Doe / Ocean Rest'}
                  className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  autoFocus
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'رقم الهاتف (اختياري):' : 'Phone Number (optional):'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                  placeholder="06 XX XX XX XX"
                  className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>
            </div>

            {/* Down Payment & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'دفعة مقدمة (إن وجدت):' : 'Down Payment (if any):'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                  <span className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-2.5 text-[10px] text-slate-400 font-bold">
                    FCFA
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'تاريخ السداد المتوقع:' : 'Expected Due Date:'}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 rtl:left-auto rtl:right-2.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    lang="en-GB"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-8 rtl:pl-2 rtl:pr-8 pr-2 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'ملاحظات / سبب الاستدانة:' : 'Notes / Remarks:'}
              </label>
              <div className="relative">
                <FileText className="absolute left-3 rtl:left-auto rtl:right-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'ملاحظة إضافية...' : 'Additional note...'}
                  className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>
            </div>

            {/* Debt Breakdown summary */}
            <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>{language === 'ar' ? 'المدفوع نقداً الآن:' : 'Paid Cash Now:'}</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatCurrency(parsedDownPayment)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-amber-700 text-sm">
                <span>{language === 'ar' ? 'المتبقي كدين في الذمة:' : 'Remaining Debt Balance:'}</span>
                <span className="font-mono text-base font-black text-amber-700">
                  {formatCurrency(remainingDebt)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 rtl:space-x-reverse pt-1">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 py-3 text-xs font-bold rounded-2xl"
          >
            {language === 'ar' ? 'إلغاء (ESC)' : 'Cancel (ESC)'}
          </Button>

          {activeTab === 'cash' ? (
            <Button
              onClick={handlePayCash}
              disabled={parsedTendered < grandTotal}
              className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 py-3 text-sm rounded-2xl transition-all active:scale-[0.99]"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>{language === 'ar' ? 'تأكيد الدفع وطباعة الفاتورة ✓' : 'Complete Cash Sale ✓'}</span>
            </Button>
          ) : (
            <Button
              onClick={handleConfirmBorrow}
              className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 py-3 text-sm rounded-2xl transition-all active:scale-[0.99]"
            >
              <UserCheck className="h-5 w-5 text-white" />
              <span>{language === 'ar' ? 'تأكيد تسجيل الدين وإخراج البضاعة ✓' : 'Confirm Debt & Issue Receipt ✓'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
export default POSPaymentModal;
