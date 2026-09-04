import React, { useState, useEffect, useMemo } from 'react';
import { usePOSStore } from '@stores/usePOSStore';
import { useLanguageStore } from '@stores/useLanguageStore';
import { SalesOrderEntity } from '@shared/types';
import { formatCurrency } from '../../renderer/utils/currency';
import { Button } from '@components/ui/Button';
import {
  Search,
  HandCoins,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  User,
  ArrowDownLeft,
  X,
} from 'lucide-react';

export const DebtsPage: React.FC = () => {
  const { language } = useLanguageStore();
  const { debts, loadDebts, settleDebt } = usePOSStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [selectedDebt, setSelectedDebt] = useState<SalesOrderEntity | null>(null);

  // Settlement modal state
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [repayMethod, setRepayMethod] = useState<'Cash' | 'Card' | 'Digital Wallet'>('Cash');
  const [repayNotes, setRepayNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  // Format date helper DD-MM-YYYY
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '-';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return '-';
    }
  };

  const filteredDebts = useMemo(() => {
    return debts.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.customer_name && item.customer_name.toLowerCase().includes(q)) ||
        (item.customer_phone && item.customer_phone.includes(q)) ||
        (item.invoice_number && item.invoice_number.toLowerCase().includes(q));

      const remaining = Math.max(0, (item.grand_total || 0) - (item.paid_amount || 0));

      let matchesFilter = true;
      if (filterStatus === 'unpaid') {
        matchesFilter = (item.paid_amount || 0) === 0 && remaining > 0;
      } else if (filterStatus === 'partial') {
        matchesFilter = (item.paid_amount || 0) > 0 && remaining > 0;
      } else if (filterStatus === 'paid') {
        matchesFilter = remaining === 0 || item.payment_status === 'Paid';
      }

      return matchesSearch && matchesFilter;
    });
  }, [debts, searchQuery, filterStatus]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalOutstanding = 0;
    let unpaidCount = 0;
    let partialCount = 0;
    let settledCount = 0;

    debts.forEach((d) => {
      const remaining = Math.max(0, (d.grand_total || 0) - (d.paid_amount || 0));
      if (remaining > 0) {
        totalOutstanding += remaining;
        if ((d.paid_amount || 0) > 0) {
          partialCount++;
        } else {
          unpaidCount++;
        }
      } else {
        settledCount++;
      }
    });

    return { totalOutstanding, unpaidCount, partialCount, settledCount, totalCount: debts.length };
  }, [debts]);

  const handleOpenSettleModal = (debt: SalesOrderEntity) => {
    const remaining = Math.max(0, (debt.grand_total || 0) - (debt.paid_amount || 0));
    setSelectedDebt(debt);
    const initialAmount =
      remaining % 1 === 0 ? remaining.toString() : (Math.round(remaining * 100) / 100).toString();
    setRepayAmount(initialAmount);
    setRepayMethod('Cash');
    setRepayNotes('');
  };

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;

    let amount = parseFloat(repayAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'ar' ? 'يرجى إدخال مبلغ سداد صحيح' : 'Please enter a valid repayment amount');
      return;
    }

    const remaining = Math.max(0, (selectedDebt.grand_total || 0) - (selectedDebt.paid_amount || 0));

    // If user pays remaining debt or slightly more due to rounding (e.g. 11 for 10.5), clamp to remaining to close out the debt
    if (amount >= remaining || Math.abs(amount - remaining) <= 0.5) {
      amount = remaining;
    }

    setIsSubmitting(true);
    try {
      const success = await settleDebt(selectedDebt.id, amount, repayMethod, repayNotes.trim() || undefined);
      if (success) {
        setSelectedDebt(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <HandCoins className="h-6 w-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              {language === 'ar' ? 'سجل الديون والذمم المدينة' : 'Customer Debts & Credit Receivables'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            {language === 'ar'
              ? 'متابعة وتوثيق ديون الزبائن، والمدفوعات المتأخرة، وإجراءات السداد'
              : 'Track customer credit, outstanding balances, and record debt settlements'}
          </p>
        </div>

        <Button
          onClick={() => loadDebts()}
          variant="outline"
          className="border-slate-800 text-slate-300 hover:bg-slate-800"
        >
          {language === 'ar' ? 'تحديث البيانات ⟳' : 'Refresh Data ⟳'}
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding Debt */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 via-[#0F172A] to-slate-900 border border-rose-500/30 shadow-lg">
          <div className="flex justify-between items-center text-rose-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'ar' ? 'إجمالي الديون في الذمة' : 'Total Outstanding Debt'}
            </span>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
            {formatCurrency(metrics.totalOutstanding)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'ar' ? 'مبالغ مستحقة لم يتم تحصيلها بعد' : 'Uncollected credit amount'}
          </p>
        </div>

        {/* Unpaid Invoices */}
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-amber-500/30 shadow-lg">
          <div className="flex justify-between items-center text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'ar' ? 'ديون غير مسددة كلياً' : 'Unpaid Invoices'}
            </span>
            <Clock className="h-5 w-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
            {metrics.unpaidCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'ar' ? 'فواتير بدون أي دفعة' : 'Invoices with 0 payment'}
          </p>
        </div>

        {/* Partially Paid */}
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-sky-500/30 shadow-lg">
          <div className="flex justify-between items-center text-sky-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'ar' ? 'مسددة جزئياً' : 'Partially Paid'}
            </span>
            <ArrowDownLeft className="h-5 w-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-sky-300">
            {metrics.partialCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'ar' ? 'تم دفع جزء من المبلغ' : 'Partially paid invoices'}
          </p>
        </div>

        {/* Fully Settled */}
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-emerald-500/30 shadow-lg">
          <div className="flex justify-between items-center text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'ar' ? 'ديون تمت تسويتها' : 'Fully Settled'}
            </span>
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {metrics.settledCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'ar' ? 'تم تحصيلها بالكامل' : '100% Repaid'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-[#0F172A] p-3.5 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'ar'
                ? 'بحث باسم المستدين، الهاتف، رقم الفاتورة...'
                : 'Search borrower, phone, invoice #...'
            }
            className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-[#0B1120] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex space-x-1.5 rtl:space-x-reverse w-full md:w-auto overflow-x-auto">
          {[
            { id: 'all', labelAr: 'الكل', labelEn: 'All' },
            { id: 'unpaid', labelAr: 'غير مسدد', labelEn: 'Unpaid' },
            { id: 'partial', labelAr: 'مسدد جزئياً', labelEn: 'Partial' },
            { id: 'paid', labelAr: 'مسدد بالكامل', labelEn: 'Settled' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterStatus(item.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === item.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {language === 'ar' ? item.labelAr : item.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Debts Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="p-3.5">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
                <th className="p-3.5">{language === 'ar' ? 'العميل / المستدين' : 'Customer / Borrower'}</th>
                <th className="p-3.5">{language === 'ar' ? 'تاريخ المعاملة' : 'Date Borrowed'}</th>
                <th className="p-3.5">{language === 'ar' ? 'تاريخ السداد المتوقع' : 'Due Date'}</th>
                <th className="p-3.5">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                <th className="p-3.5">{language === 'ar' ? 'المدفوع' : 'Paid'}</th>
                <th className="p-3.5">{language === 'ar' ? 'المتبقي (الدين)' : 'Remaining'}</th>
                <th className="p-3.5">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredDebts.map((item) => {
                const remaining = Math.max(0, (item.grand_total || 0) - (item.paid_amount || 0));
                const isPaid = remaining === 0 || item.payment_status === 'Paid';
                const isPartial = (item.paid_amount || 0) > 0 && remaining > 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-300">
                      {item.invoice_number || item.id.substring(0, 8)}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-white flex items-center space-x-1 rtl:space-x-reverse">
                        <User className="h-3.5 w-3.5 text-amber-400" />
                        <span>{item.customer_name || (language === 'ar' ? 'عميل غير مسجل' : 'Unnamed Customer')}</span>
                      </div>
                      {item.customer_phone && (
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 rtl:space-x-reverse mt-0.5">
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span className="font-mono">{item.customer_phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="p-3.5 font-mono">
                      {item.due_date ? (
                        <span className="text-amber-400 font-semibold">{formatDate(item.due_date)}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-200">
                      {formatCurrency(item.grand_total)}
                    </td>
                    <td className="p-3.5 font-mono text-emerald-400">
                      {formatCurrency(item.paid_amount || 0)}
                    </td>
                    <td className="p-3.5 font-mono font-black text-sm">
                      <span className={remaining > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                        {formatCurrency(remaining)}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {isPaid ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{language === 'ar' ? 'مسدد' : 'Settled'}</span>
                        </span>
                      ) : isPartial ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-sky-500/10 text-sky-400 border border-sky-500/30 inline-flex items-center space-x-1">
                          <ArrowDownLeft className="h-3 w-3" />
                          <span>{language === 'ar' ? 'جزئي' : 'Partial'}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/30 inline-flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{language === 'ar' ? 'دين مستحق' : 'Unpaid'}</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {!isPaid && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenSettleModal(item)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-xl shadow-md shadow-amber-950/50"
                        >
                          {language === 'ar' ? 'تسديد دفعة' : 'Settle'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredDebts.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <HandCoins className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold">
                      {language === 'ar' ? 'لا توجد ديون مسجلة مطابقة للبحث' : 'No debt records match your query'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Debt Modal */}
      {selectedDebt && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <HandCoins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {language === 'ar' ? 'تسديد / دفع من الدين' : 'Settle / Repay Debt'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedDebt.customer_name} ({selectedDebt.invoice_number})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDebt(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Debt details banner */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{language === 'ar' ? 'إجمالي الفاتورة الأصلية:' : 'Original Total:'}</span>
                <span className="font-mono text-slate-200">{formatCurrency(selectedDebt.grand_total)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{language === 'ar' ? 'المدفوع سابقاً:' : 'Already Paid:'}</span>
                <span className="font-mono text-emerald-400">{formatCurrency(selectedDebt.paid_amount || 0)}</span>
              </div>
              <div className="flex justify-between font-black text-rose-400 pt-1 border-t border-slate-800 text-sm">
                <span>{language === 'ar' ? 'المتبقي كدين حالياً:' : 'Current Remaining Debt:'}</span>
                <span className="font-mono">
                  {formatCurrency(Math.max(0, (selectedDebt.grand_total || 0) - (selectedDebt.paid_amount || 0)))}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-4">
              {/* Repay Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'ar' ? 'مبلغ السداد الحالي (FCFA):' : 'Repayment Amount (FCFA):'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0B1120] border border-slate-700 rounded-xl text-lg font-black font-mono text-white focus:outline-none focus:border-amber-500"
                    autoFocus
                    required
                  />
                  <span className="absolute right-3 rtl:right-auto rtl:left-3 top-3 text-xs text-amber-400 font-bold">
                    FCFA
                  </span>
                </div>
                {/* Quick Full Settle Button */}
                <div className="flex justify-between items-center mt-1.5 px-0.5">
                  <span className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'المتبقي بالضبط:' : 'Exact remaining:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const remaining = Math.max(0, (selectedDebt.grand_total || 0) - (selectedDebt.paid_amount || 0));
                      const val = remaining % 1 === 0 ? remaining.toString() : (Math.round(remaining * 100) / 100).toString();
                      setRepayAmount(val);
                    }}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 underline"
                  >
                    {formatCurrency(Math.max(0, (selectedDebt.grand_total || 0) - (selectedDebt.paid_amount || 0)))}
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'ar' ? 'طريقة الاستلام:' : 'Payment Method:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash', 'Card', 'Digital Wallet'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setRepayMethod(method)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        repayMethod === method
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {method === 'Cash'
                        ? (language === 'ar' ? 'كاش نقداً' : 'Cash')
                        : method === 'Card'
                        ? (language === 'ar' ? 'بطاقة' : 'Card')
                        : (language === 'ar' ? 'محفظة' : 'Wallet')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'ar' ? 'ملاحظة السداد (اختياري):' : 'Notes (optional):'}
                </label>
                <input
                  type="text"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'سداد جزء من الدين عن طريق...' : 'Repayment notes...'}
                  className="w-full px-3 py-2 bg-[#0B1120] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-2 rtl:space-x-reverse pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedDebt(null)}
                  className="w-full border-slate-800 text-slate-300 hover:bg-slate-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-950/50"
                >
                  {isSubmitting
                    ? (language === 'ar' ? 'جارٍ السداد...' : 'Processing...')
                    : (language === 'ar' ? 'تأكيد استلام المبلغ ✓' : 'Confirm Repayment ✓')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtsPage;
