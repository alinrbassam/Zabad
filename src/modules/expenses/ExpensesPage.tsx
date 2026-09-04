import React, { useState, useEffect, useMemo } from 'react';
import { useExpenseStore } from '../../renderer/stores/useExpenseStore';
import { useLanguageStore } from '../../renderer/stores/useLanguageStore';
import { ExpenseCategory } from '@shared/types';
import { formatCurrency } from '../../renderer/utils/currency';
import { Button } from '@components/ui/Button';
import {
  Receipt,
  Plus,
  Trash2,
  Zap,
  Droplet,
  Snowflake,
  Home,
  Users,
  Truck,
  Wrench,
  FileText,
  Calendar,
  X,
  TrendingDown,
} from 'lucide-react';

const CATEGORY_META: Record<
  ExpenseCategory,
  { labelAr: string; labelEn: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  Electricity: {
    labelAr: 'كهرباء',
    labelEn: 'Electricity',
    icon: Zap,
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  Water: {
    labelAr: 'مياه',
    labelEn: 'Water',
    icon: Droplet,
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  'Ice & Cooling': {
    labelAr: 'ثلج وتبريد',
    labelEn: 'Ice & Cooling',
    icon: Snowflake,
    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
  Rent: {
    labelAr: 'إيجار المحل',
    labelEn: 'Rent',
    icon: Home,
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  },
  Salaries: {
    labelAr: 'رواتب وأجور',
    labelEn: 'Salaries',
    icon: Users,
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  Transport: {
    labelAr: 'نقل وشحن أسماك',
    labelEn: 'Transport & Shipping',
    icon: Truck,
    color: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  },
  Maintenance: {
    labelAr: 'صيانة ومعدات',
    labelEn: 'Maintenance',
    icon: Wrench,
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  },
  Other: {
    labelAr: 'نثريات ومصاريف أخرى',
    labelEn: 'Other',
    icon: FileText,
    color: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  },
};

export const ExpensesPage: React.FC = () => {
  const { language } = useLanguageStore();
  const { expenses, loadExpenses, createExpense, deleteExpense, loadSummary } =
    useExpenseStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Electricity');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadExpenses();
    loadSummary();
  }, [loadExpenses, loadSummary]);

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

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedCategory === 'all') return true;
      return e.category === selectedCategory;
    });
  }, [expenses, selectedCategory]);

  // Specific high-impact totals for Fish Stores: Ice, Electricity, Water
  const kpiMetrics = useMemo(() => {
    let iceTotal = 0;
    let elecTotal = 0;
    let waterTotal = 0;
    let otherTotal = 0;
    let overall = 0;

    expenses.forEach((e) => {
      overall += e.amount || 0;
      if (e.category === 'Ice & Cooling') iceTotal += e.amount;
      else if (e.category === 'Electricity') elecTotal += e.amount;
      else if (e.category === 'Water') waterTotal += e.amount;
      else otherTotal += e.amount;
    });

    return { overall, iceTotal, elecTotal, waterTotal, otherTotal };
  }, [expenses]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formAmount) || 0;
    if (amount <= 0) {
      alert(language === 'ar' ? 'يرجى إدخال مبلغ صحيح للمصروف' : 'Please enter a valid expense amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await createExpense({
        category: formCategory,
        title: formDescription.trim() || formCategory,
        amount,
        expenseDate: formDate,
        notes: formDescription.trim() || undefined,
        paymentMethod: formPaymentMethod as any,
      });

      if (success) {
        setIsAddModalOpen(false);
        setFormAmount('');
        setFormDescription('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmMsg =
      language === 'ar'
        ? 'هل أنت متأكد من حذف هذا المصروف؟'
        : 'Are you sure you want to delete this expense record?';
    if (confirm(confirmMsg)) {
      await deleteExpense(id);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Receipt className="h-6 w-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              {language === 'ar' ? 'المصاريف التشغيلية للمحل' : 'Store Operational Expenses'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            {language === 'ar'
              ? 'توثيق مصاريف الكهرباء، المياه، قوالب الثلج، النقل، والصيانة لخصمها من صافي الأرباح'
              : 'Log store electricity, water, ice cooling, transport, and maintenance costs for P&L'}
          </p>
        </div>

        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button
            onClick={() => {
              loadExpenses();
              loadSummary();
            }}
            variant="outline"
            className="border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            {language === 'ar' ? 'تحديث ⟳' : 'Refresh ⟳'}
          </Button>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-400 hover:to-pink-500 text-white font-black shadow-lg shadow-rose-950/50 flex items-center space-x-1.5 rtl:space-x-reverse"
          >
            <Plus className="h-4 w-4" />
            <span>{language === 'ar' ? 'إضافة مصروف جديد +' : 'Add Expense +'}</span>
          </Button>
        </div>
      </div>

      {/* High-Impact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Overall Expenses */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 via-[#0F172A] to-slate-900 border border-rose-500/30 shadow-lg">
          <div className="flex justify-between items-center text-rose-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'ar' ? 'إجمالي المصاريف' : 'Total Expenses'}
            </span>
            <TrendingDown className="h-5 w-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
            {formatCurrency(kpiMetrics.overall)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'ar' ? 'تخصم تلقائياً من الأرباح' : 'Deducted from net profit'}
          </p>
        </div>

        {/* Ice & Cooling */}
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-cyan-500/30 shadow-lg">
          <div className="flex justify-between items-center text-cyan-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'ar' ? 'الثلج والتبريد' : 'Ice & Cooling'}
            </span>
            <Snowflake className="h-5 w-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
            {formatCurrency(kpiMetrics.iceTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'ar' ? 'حفظ الأسماك الطازجة' : 'Fresh fish preservation'}
          </p>
        </div>

        {/* Electricity */}
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-amber-500/30 shadow-lg">
          <div className="flex justify-between items-center text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'ar' ? 'الكهرباء والطاقة' : 'Electricity & Power'}
            </span>
            <Zap className="h-5 w-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
            {formatCurrency(kpiMetrics.elecTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'ar' ? 'غرف التبريد والإنارة' : 'Freezers & lighting'}
          </p>
        </div>

        {/* Water */}
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-blue-500/30 shadow-lg">
          <div className="flex justify-between items-center text-blue-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'ar' ? 'المياه والغسيل' : 'Water Supply'}
            </span>
            <Droplet className="h-5 w-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-blue-300">
            {formatCurrency(kpiMetrics.waterTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'ar' ? 'تنظيف الأسماك والمحل' : 'Fish cleaning & sanitization'}
          </p>
        </div>
      </div>

      {/* Filter Category Chips Bar */}
      <div className="flex items-center space-x-2 rtl:space-x-reverse overflow-x-auto pb-2 select-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-950/50'
              : 'bg-[#0F172A] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          {language === 'ar' ? 'جميع المصاريف' : 'All Expenses'}
        </button>

        {(Object.keys(CATEGORY_META) as ExpenseCategory[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                isSelected
                  ? 'bg-slate-800 border-rose-500 text-rose-300 shadow-md'
                  : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{language === 'ar' ? meta.labelAr : meta.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Expenses Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="p-3.5">{language === 'ar' ? 'البند والتصنيف' : 'Category'}</th>
                <th className="p-3.5">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th className="p-3.5">{language === 'ar' ? 'البيان والتفاصيل' : 'Description'}</th>
                <th className="p-3.5">{language === 'ar' ? 'طريقة الدفع' : 'Payment'}</th>
                <th className="p-3.5 font-mono">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                <th className="p-3.5 text-center">{language === 'ar' ? 'حذف' : 'Delete'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredExpenses.map((item) => {
                const meta = CATEGORY_META[item.category as ExpenseCategory] || CATEGORY_META.Other;
                const Icon = meta.icon;

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1 rounded-full text-xs font-extrabold border ${meta.color}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{language === 'ar' ? meta.labelAr : meta.labelEn}</span>
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {formatDate(item.expense_date)}
                    </td>
                    <td className="p-3.5 text-slate-200">
                      {item.title || item.notes || (language === 'ar' ? 'بدون بيان' : 'No description')}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {item.payment_method || 'Cash'}
                    </td>
                    <td className="p-3.5 font-mono font-black text-sm text-rose-400">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors"
                        title={language === 'ar' ? 'حذف المصروف' : 'Delete'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold">
                      {language === 'ar' ? 'لا توجد مصاريف مسجلة في هذا التصنيف' : 'No expenses recorded in this category'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {language === 'ar' ? 'تسجيل مصروف تشغيلي جديد' : 'Log Operating Expense'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'ar' ? 'إدخال تكاليف التشغيل لحساب صافي الربح' : 'Record store running costs for P&L'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'ar' ? 'تصنيف المصروف:' : 'Expense Category:'}
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2.5 bg-[#0B1120] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
                >
                  {(Object.keys(CATEGORY_META) as ExpenseCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {language === 'ar' ? CATEGORY_META[cat].labelAr : CATEGORY_META[cat].labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'ar' ? 'المبلغ (FCFA):' : 'Amount (FCFA):'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-3.5 py-2.5 bg-[#0B1120] border border-slate-700 rounded-xl text-lg font-black font-mono text-white focus:outline-none focus:border-rose-500"
                    autoFocus
                    required
                  />
                  <span className="absolute right-3 rtl:right-auto rtl:left-3 top-3 text-xs text-rose-400 font-bold">
                    FCFA
                  </span>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'ar' ? 'تاريخ المصروف:' : 'Expense Date:'}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 rtl:left-auto rtl:right-2.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input
                    type="date"
                    lang="en-GB"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full pl-8 rtl:pl-2 rtl:pr-8 pr-2 py-2 bg-[#0B1120] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'ar' ? 'البيان / الملاحظات:' : 'Description / Memo:'}
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={
                    language === 'ar'
                      ? 'مثال: فاتورة كهرباء شهر سبتمبر، أو شراء 5 قوالب ثلج'
                      : 'e.g. September electricity bill or 5 ice blocks purchase'
                  }
                  className="w-full px-3 py-2 bg-[#0B1120] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'ar' ? 'طريقة الدفع:' : 'Paid From:'}
                </label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B1120] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Cash">{language === 'ar' ? 'نقداً من الصندوق (Cash)' : 'Cash from Drawer'}</option>
                  <option value="Bank Transfer">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                  <option value="Card">{language === 'ar' ? 'بطاقة بنكية' : 'Card'}</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex space-x-2 rtl:space-x-reverse pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full border-slate-800 text-slate-300 hover:bg-slate-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black shadow-lg shadow-rose-950/50"
                >
                  {isSubmitting
                    ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ المصروف ✓' : 'Save Expense ✓')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
