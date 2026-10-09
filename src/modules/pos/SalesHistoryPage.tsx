import React, { useEffect, useState } from 'react';
import { usePOSStore } from '@stores/usePOSStore';
import { useAuthStore } from '@stores/useAuthStore';
import { useLanguageStore } from '@stores/useLanguageStore';
import { Card } from '@components/ui/Card';
import { Table, Column } from '@components/ui/Table';
import { SearchBox } from '@components/ui/SearchBox';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { SalesOrderEntity } from '@shared/types';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { DailyClosingReportModal } from './DailyClosingReportModal';
import { History, Printer, Undo2, FileText } from 'lucide-react';
import { formatDateTime } from '@utils/date';
import { formatCurrency } from '../../renderer/utils/currency';

export const SalesHistoryPage: React.FC = () => {
  const { salesHistory, loadSalesHistory, selectedSale, loadSaleById, processRefund } =
    usePOSStore();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const [search, setSearch] = useState('');
  const [activeReceiptSale, setActiveReceiptSale] = useState<SalesOrderEntity | null>(null);
  const [showClosingReportModal, setShowClosingReportModal] = useState(false);

  useEffect(() => {
    loadSalesHistory(search);
  }, [search, loadSalesHistory]);

  const handleReprint = async (sale: SalesOrderEntity) => {
    await loadSaleById(sale.id);
    setActiveReceiptSale(sale);
  };

  const handleRefund = async (sale: SalesOrderEntity) => {
    const confirmed = window.confirm(
      language === 'ar'
        ? `هل تريد تأكيد استرجاع الفاتورة رقم ${sale.invoice_number}؟\nسيتم وضع علامة "مسترجع" على الفاتورة وإعادة كافة الأصناف إلى المخزون.`
        : language === 'fr'
        ? `Confirmer le remboursement de la facture ${sale.invoice_number} ?\nLe statut passera à "Remboursé" et les articles seront réintégrés en stock.`
        : `Process refund for ${sale.invoice_number}?\nThe invoice will be marked as "Refunded" and all items returned to stock.`
    );
    if (!confirmed) return;

    const ok = await processRefund(
      {
        saleId: sale.id,
        reason: 'Customer Return',
        refundMethod: sale.payment_method || 'Cash',
        items: [],
      },
      user?.id,
    );

    if (ok) {
      await loadSalesHistory(search);
      alert(
        language === 'ar'
          ? `تم استرجاع الفاتورة ${sale.invoice_number} بنجاح وإعادة المنتجات إلى المخزون.`
          : language === 'fr'
          ? `Facture ${sale.invoice_number} remboursée avec succès. Les articles ont été réintégrés au stock.`
          : `Refund processed successfully for ${sale.invoice_number}. Items have been returned to stock.`
      );
    } else {
      const storeErr = usePOSStore.getState().error;
      const detail = storeErr ? ` (${storeErr})` : '';
      alert(
        language === 'ar'
          ? `تعذر معالجة الاسترجاع${detail}.`
          : language === 'fr'
          ? `Échec du traitement du remboursement${detail}.`
          : `Failed to process refund${detail}.`
      );
    }
  };

  const columns: Column<SalesOrderEntity>[] = [
    {
      key: 'invoice_number',
      header: 'Receipt #',
      render: (s) => (
        <div>
          <span className="font-bold text-sky-600 dark:text-sky-400 font-mono">
            {s.invoice_number}
          </span>
          <br />
          <span className="text-[10px] text-slate-400">
            {formatDateTime(s.created_at)}
          </span>
        </div>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer / Borrower',
      render: (s) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {s.customer_name || 'Walk-in'}
        </span>
      ),
    },
    {
      key: 'payment_method',
      header: 'Payment Method',
      render: (s) => <Badge variant="neutral">{s.payment_method}</Badge>,
    },
    {
      key: 'grand_total',
      header: 'Grand Total',
      render: (s) => (
        <span className="font-black text-slate-900 dark:text-slate-100 font-mono">
          {formatCurrency(s.grand_total)}
        </span>
      ),
    },
    {
      key: 'payment_status',
      header: 'Status',
      render: (s) => {
        let variant: 'success' | 'danger' | 'warning' | 'neutral' = 'success';
        let label = s.payment_status;
        if (s.payment_status === 'Refunded' || s.payment_status === 'Voided') {
          variant = 'danger';
          label = language === 'ar' ? 'مسترجع' : language === 'fr' ? 'Remboursé' : 'Refunded';
        } else if (s.payment_status === 'Paid') {
          variant = 'success';
          label = language === 'ar' ? 'مدفوع' : language === 'fr' ? 'Payé' : 'Paid';
        } else if (s.payment_status === 'Unpaid') {
          variant = 'danger';
          label = language === 'ar' ? 'غير مدفوع' : language === 'fr' ? 'Impayé' : 'Unpaid';
        } else if (s.payment_status === 'Partially paid') {
          variant = 'warning';
          label = language === 'ar' ? 'مدفوع جزئياً' : language === 'fr' ? 'Partiellement payé' : 'Partially paid';
        }
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: 'id',
      header: 'Actions',
      render: (s) => (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleReprint(s)}>
            <Printer className="h-3 w-3 mr-1" />
            Receipt
          </Button>

          {s.payment_status === 'Paid' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRefund(s)}
              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200"
              title={language === 'ar' ? 'استرجاع الفاتورة' : language === 'fr' ? 'Rembourser' : 'Refund'}
            >
              <Undo2 className="h-3 w-3 mr-1" />
              {language === 'ar' ? 'استرجاع' : language === 'fr' ? 'Rembourser' : 'Refund'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <History className="h-6 w-6 text-sky-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              POS Sales History
            </h1>
            <p className="text-xs text-slate-500">
              Completed register receipts, thermal reprints, voids, and refunds.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowClosingReportModal(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center space-x-2 rtl:space-x-reverse shadow-sm"
        >
          <FileText className="h-4 w-4" />
          <span>
            {language === 'ar'
              ? 'تقرير إغلاق اليومية (Z-Report)'
              : language === 'fr'
              ? 'Rapport de Clôture (Z-Report)'
              : 'Daily Closing Report (Z-Report)'}
          </span>
        </Button>
      </div>

      <Card className="space-y-4">
        <div className="max-w-md">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search by receipt invoice number..."
          />
        </div>
        <Table columns={columns} data={salesHistory} keyExtractor={(s) => s.id} />
      </Card>

      <ThermalReceiptModal
        isOpen={Boolean(activeReceiptSale)}
        onClose={() => setActiveReceiptSale(null)}
        sale={selectedSale || activeReceiptSale}
      />

      <DailyClosingReportModal
        isOpen={showClosingReportModal}
        onClose={() => setShowClosingReportModal(false)}
      />
    </div>
  );
};
