import React, { useEffect, useState, useMemo } from 'react';
import { useLanguageStore } from '../../renderer/stores/useLanguageStore';
import { Button } from '@components/ui/Button';
import { Printer, RefreshCw, Calendar, FileText } from 'lucide-react';
import { formatCurrency } from '../../renderer/utils/currency';
import { SalesOrderEntity, ExpenseEntity } from '@shared/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyClosingReportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { language } = useLanguageStore();
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [sales, setSales] = useState<SalesOrderEntity[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (window.api?.getSalesList) {
        const salesRes = await window.api.getSalesList('');
        if (salesRes?.success && Array.isArray(salesRes.data)) {
          setSales(salesRes.data);
        }
      }
      if (window.api?.getExpenses) {
        const expRes = await window.api.getExpenses({
          startDate: selectedDate,
          endDate: selectedDate,
        });
        if (expRes?.success && Array.isArray(expRes.data)) {
          setExpenses(expRes.data);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, selectedDate]);

  const summary = useMemo(() => {
    const daySales = sales.filter((s) => s.created_at && s.created_at.slice(0, 10) === selectedDate);

    const validSales = daySales.filter(
      (s) => s.payment_status !== 'Cancelled' && s.payment_status !== 'Refunded',
    );
    const refundedSales = daySales.filter((s) => s.payment_status === 'Refunded');

    const completedCount = validSales.length;
    const refundedCount = refundedSales.length;
    const refundedTotal = refundedSales.reduce((acc, s) => acc + (Number(s.grand_total) || 0), 0);

    const grossRevenue = validSales.reduce((acc, s) => acc + (Number(s.grand_total) || 0), 0);

    let cashSales = 0;
    let mobileMoneySales = 0;
    let creditSales = 0;
    let totalDiscounts = 0;

    for (const s of validSales) {
      const total = Number(s.grand_total) || 0;
      const paid = s.paid_amount !== undefined ? Number(s.paid_amount) : total;
      const method = (s.payment_method || 'Cash').toLowerCase();
      totalDiscounts += (Number(s.item_discount) || 0) + (Number(s.order_discount) || 0);

      if (method === 'borrow' || method === 'credit' || s.payment_status === 'Unpaid' || s.payment_status === 'Partially paid') {
        const unpaidPortion = Math.max(0, total - paid);
        creditSales += unpaidPortion;
        if (paid > 0) {
          cashSales += paid;
        }
      } else if (method.includes('momo') || method.includes('om') || method.includes('orange')) {
        mobileMoneySales += total;
      } else {
        cashSales += total;
      }
    }

    const dayExpenses = expenses.filter(
      (e) =>
        (e.expense_date && e.expense_date.slice(0, 10) === selectedDate) ||
        (e.created_at && e.created_at.slice(0, 10) === selectedDate),
    );
    const totalExpenses = dayExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const cashExpenses = dayExpenses
      .filter((e) => !e.payment_method || e.payment_method.toLowerCase() === 'cash')
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    const expectedCashInDrawer = cashSales - cashExpenses;
    const netRevenueAfterExpenses = grossRevenue - totalExpenses;

    return {
      completedCount,
      refundedCount,
      refundedTotal,
      grossRevenue,
      cashSales,
      mobileMoneySales,
      creditSales,
      totalDiscounts,
      totalExpenses,
      cashExpenses,
      expectedCashInDrawer,
      netRevenueAfterExpenses,
    };
  }, [sales, expenses, selectedDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        {/* Top Modal Controls */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <FileText className="h-4 w-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {language === 'ar'
                ? 'تقرير إغلاق الصندوق اليومي (Z-Report)'
                : 'Daily Closing Report (Z-Report)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm px-1"
          >
            ✕
          </button>
        </div>

        {/* Date Picker & Refresh */}
        <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">
              {language === 'ar' ? 'تاريخ التقرير:' : 'Report Date:'}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800"
            />
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>

        {/* 58mm Thermal Z-Report Printable Area */}
        <div
          id="thermal-receipt"
          className="p-4 bg-white text-black font-mono text-[11px] leading-tight border border-slate-300 shadow-inner rounded-lg space-y-2.5 max-h-[60vh] overflow-y-auto"
        >
          {/* Store Header */}
          <div className="text-center space-y-0.5">
            <h3 className="font-black text-sm tracking-tight">متجر علي خليل</h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
              {language === 'ar' ? 'تقرير إغلاق اليومية (Z-REPORT)' : 'DAILY CLOSING Z-REPORT'}
            </p>
            <p className="text-[10px] text-slate-500">
              {language === 'ar' ? 'التاريخ:' : 'Date:'} {selectedDate} •{' '}
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="border-b border-dashed border-slate-800 my-1.5" />
          </div>

          {/* 1. Orders Summary */}
          <div className="space-y-1">
            <p className="font-black text-[10px] uppercase text-slate-500">
              {language === 'ar' ? '1. ملخص الفواتير والمبيعات' : '1. ORDERS & SALES SUMMARY'}
            </p>
            <div className="flex justify-between">
              <span>{language === 'ar' ? 'عدد الفواتير المكتملة:' : 'Completed Orders:'}</span>
              <span className="font-bold">{summary.completedCount}</span>
            </div>
            <div className="flex justify-between">
              <span>{language === 'ar' ? 'الفواتير المسترجعة:' : 'Refunded Orders:'}</span>
              <span className="font-bold text-rose-600">
                {summary.refundedCount} ({formatCurrency(summary.refundedTotal)})
              </span>
            </div>
            {summary.totalDiscounts > 0 && (
              <div className="flex justify-between">
                <span>{language === 'ar' ? 'إجمالي الخصومات:' : 'Total Discounts:'}</span>
                <span className="font-bold">-{formatCurrency(summary.totalDiscounts)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-[12px] pt-1 border-t border-slate-200">
              <span>{language === 'ar' ? 'إجمالي المبيعات الفعلية:' : 'Total Gross Sales:'}</span>
              <span>{formatCurrency(summary.grossRevenue)}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-800 my-1.5" />

          {/* 2. Payment Breakdown */}
          <div className="space-y-1">
            <p className="font-black text-[10px] uppercase text-slate-500">
              {language === 'ar' ? '2. تفصيل طرق الدفع' : '2. PAYMENT BREAKDOWN'}
            </p>
            <div className="flex justify-between">
              <span>{language === 'ar' ? 'مبيعات نقدية (Cash):' : 'Cash Sales:'}</span>
              <span className="font-bold text-emerald-700">{formatCurrency(summary.cashSales)}</span>
            </div>
            <div className="flex justify-between">
              <span>{language === 'ar' ? 'موبايل موني (OM / MOMO):' : 'OM / MOMO Sales:'}</span>
              <span className="font-bold">{formatCurrency(summary.mobileMoneySales)}</span>
            </div>
            <div className="flex justify-between">
              <span>{language === 'ar' ? 'مبيعات آجلة / ديون جديدة:' : 'New Customer Debts:'}</span>
              <span className="font-bold text-amber-700">{formatCurrency(summary.creditSales)}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-800 my-1.5" />

          {/* 3. Expenses */}
          <div className="space-y-1">
            <p className="font-black text-[10px] uppercase text-slate-500">
              {language === 'ar' ? '3. المصاريف التشغيلية اليوم' : '3. STORE EXPENSES'}
            </p>
            <div className="flex justify-between">
              <span>{language === 'ar' ? 'إجمالي مصاريف اليوم:' : 'Total Expenses Today:'}</span>
              <span className="font-bold text-rose-600">-{formatCurrency(summary.totalExpenses)}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-800 my-1.5" />

          {/* 4. Cash Drawer Reconciliation Box */}
          <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-300 space-y-1.5">
            <div className="flex justify-between font-black text-[12px] text-slate-900">
              <span>{language === 'ar' ? 'النقد المتوقع بالصندوق:' : 'Expected Cash in Drawer:'}</span>
              <span>{formatCurrency(summary.expectedCashInDrawer)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 border-t border-slate-200 pt-1">
              <span>{language === 'ar' ? 'صافي اليوم بعد المصاريف:' : 'Net Revenue (After Expenses):'}</span>
              <span className="font-bold">{formatCurrency(summary.netRevenueAfterExpenses)}</span>
            </div>
          </div>

          <div className="text-center text-[9px] pt-2 text-slate-500">
            <p>{language === 'ar' ? 'نهاية تقرير الإغلاق اليومي' : '--- END OF CLOSING REPORT ---'}</p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex space-x-2 rtl:space-x-reverse pt-1">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
          <Button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <Printer className="h-4 w-4" />
            <span>{language === 'ar' ? 'طباعة التقرير (58mm)' : 'Print Report (58mm)'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DailyClosingReportModal;
