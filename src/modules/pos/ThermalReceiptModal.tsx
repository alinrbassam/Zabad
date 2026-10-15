import React from 'react';
import { SalesOrderEntity, SalesOrderItemEntity } from '@shared/types';
import { useLanguageStore } from '../../renderer/stores/useLanguageStore';
import { Button } from '@components/ui/Button';
import { Printer } from 'lucide-react';
import { formatDateTime } from '@utils/date';
import { formatCurrency } from '../../renderer/utils/currency';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: (SalesOrderEntity & { items?: SalesOrderItemEntity[] }) | null;
  businessName?: string;
  businessAddress?: string;
  taxNumber?: string;
}

export const ThermalReceiptModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sale,
  businessName,
  businessAddress,
  taxNumber = 'VAT-300998811',
}) => {
  const { language } = useLanguageStore();

  if (!isOpen || !sale) return null;

  const defaultStoreName = language === 'ar' ? 'متجر علي خليل' : 'Ali Khalil Store';
  const defaultAddress = language === 'ar' ? 'السوق المركزي' : 'Central Market';

  const storeTitle = businessName || defaultStoreName;
  const storeAddr = businessAddress || defaultAddress;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            {language === 'ar' ? 'معاينة إيصال الدفع الحراري (58 مم)' : 'Thermal Receipt Preview (58mm)'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>

        {/* 58mm Thermal Receipt Visual Preview */}
        <div
          id="thermal-receipt"
          className="p-4 bg-white text-black font-mono text-[11px] leading-tight border border-slate-300 shadow-inner rounded-lg space-y-2.5"
        >
          {/* Header */}
          <div className="text-center space-y-0.5">
            <h3 className="font-black text-sm tracking-tight">{storeTitle}</h3>
            <p className="text-[10px] text-slate-600">{storeAddr}</p>
            <p className="text-[10px] text-slate-600">VAT #: {taxNumber}</p>
            <div className="border-b border-dashed border-slate-800 my-1" />
          </div>

          {/* Invoice Meta */}
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span>{language === 'ar' ? 'رقم الإيصال:' : 'Receipt #:'}</span>
              <span className="font-bold">{sale.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span>{language === 'ar' ? 'التاريخ والوقت:' : 'Date:'}</span>
              <span>{formatDateTime(sale.created_at || new Date())}</span>
            </div>
            <div className="flex justify-between">
              <span>{language === 'ar' ? 'طريقة الدفع:' : 'Payment:'}</span>
              <span className="font-semibold">{sale.payment_method || 'Cash'}</span>
            </div>
            {sale.customer_name && (
              <div className="flex justify-between font-bold text-slate-900 bg-slate-100 p-1 rounded border border-slate-200">
                <span>
                  {sale.payment_status === 'Paid'
                    ? (language === 'ar' ? 'العميل:' : 'Customer:')
                    : (language === 'ar' ? 'العميل / المستدين:' : 'Borrower / Customer:')}
                </span>
                <span className="font-black">{sale.customer_name}</span>
              </div>
            )}
            {sale.payment_status && sale.payment_status !== 'Paid' && (
              <div className="flex justify-between font-bold text-rose-700 bg-rose-50 p-1 rounded">
                <span>{language === 'ar' ? 'حالة السداد:' : 'Payment Status:'}</span>
                <span>{sale.payment_status === 'Unpaid' ? (language === 'ar' ? 'دين غير مسدد' : 'Unpaid Debt') : (language === 'ar' ? 'مسدد جزئياً' : 'Partially Paid')}</span>
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-slate-800 my-1" />

          {/* Line items list with quantity/weight only (NO PRICES as requested) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold pb-1 border-b border-slate-300">
              <span>{language === 'ar' ? 'الصنف' : 'Item Description'}</span>
              <span className="text-right rtl:text-left">{language === 'ar' ? 'الكمية / الوزن' : 'Qty / Weight'}</span>
            </div>
            {sale.items && sale.items.length > 0 ? (
              sale.items.map((item: any, idx) => {
                const itemName = language === 'ar' 
                  ? (item.name_ar || item.name_en || item.product_id)
                  : (item.name_en || item.name_ar || item.product_id);
                const unitLabel = item.unit_name_ar || item.unit_symbol || item.unit_code || (language === 'ar' ? 'كغ' : 'kg');

                const pcWeight = Number(item.piece_weight) || Number(item.product_piece_weight) || 0;
                const pcsPerPack = Number(item.pieces_per_pack) || Number(item.product_pieces_per_pack) || 1;
                const isPieceMode = item.selling_mode === 'piece';
                const hasWeight = pcWeight > 0 || (Number(item.total_weight) || 0) > 0;
                const hasPack = pcsPerPack > 1;

                let qtyDisplay = `${item.quantity} ${unitLabel}`;
                if (hasPack) {
                  if (isPieceMode) {
                    qtyDisplay = `${item.quantity} ${language === 'ar' ? 'حبة' : 'pcs'}`;
                  } else {
                    qtyDisplay = `${item.quantity} ${unitLabel || (language === 'ar' ? 'كرتون' : 'packs')}`;
                  }
                }

                const itemTotalWeight = Number(item.total_weight) || (
                  hasWeight
                    ? (isPieceMode ? item.quantity * pcWeight : item.quantity * pcsPerPack * pcWeight)
                    : 0
                );

                return (
                  <div key={idx} className="py-1 border-b border-dashed border-slate-100">
                    <div className="flex justify-between items-center text-[11px]">
                      <div className="font-bold pr-2 rtl:pr-0 rtl:pl-2">
                        <p>
                          {itemName}
                          {hasPack && (
                            <span className="text-[9px] font-normal text-slate-500 mx-1">
                              ({isPieceMode ? (language === 'ar' ? 'بالحبة' : 'piece') : (language === 'ar' ? 'كرتون' : 'pack')})
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="font-extrabold font-mono text-[12px] whitespace-nowrap">
                        {qtyDisplay}
                      </span>
                    </div>
                    {hasWeight && itemTotalWeight > 0 && (
                      <div className="text-[10px] text-slate-600 font-mono flex items-center justify-between pt-0.5 px-0.5">
                        <span>
                          {hasPack
                            ? !isPieceMode
                              ? `${item.quantity} × (${pcsPerPack} × ${pcWeight.toFixed(2)}kg)`
                              : `${item.quantity} × ${pcWeight.toFixed(2)}kg`
                            : `${pcWeight.toFixed(2)}kg/${language === 'ar' ? 'قطعة' : 'pc'}`}
                        </span>
                        <span className="font-bold text-slate-900">
                          ⚖️ {itemTotalWeight.toFixed(2)} {language === 'ar' ? 'كجم' : 'kg'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-1 text-[11px] text-center text-slate-500">
                {language === 'ar' ? 'أصناف مأكولات بحرية' : 'Fresh Seafood Items'}
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-slate-800 my-1.5" />

          {/* Items Summary (Item Count & Total Units) */}
          {(() => {
            const totalOrderWeight = sale.items
              ? sale.items.reduce((sum: number, it: any) => {
                  const lineTotalW = Number(it.total_weight) || 0;
                  if (lineTotalW > 0) return sum + lineTotalW;
                  const pw = Number(it.piece_weight) || Number(it.product_piece_weight) || 0;
                  const ppp = Number(it.pieces_per_pack) || Number(it.product_pieces_per_pack) || 1;
                  const isPiece = it.selling_mode === 'piece';
                  const calcW = pw > 0 ? (isPiece ? it.quantity * pw : it.quantity * ppp * pw) : 0;
                  return sum + calcW;
                }, 0)
              : 0;

            return (
              <div className="space-y-1 text-[10px] bg-slate-50 p-2 rounded border border-slate-200">
                <div className="flex justify-between font-bold">
                  <span>{language === 'ar' ? 'إجمالي عدد الأصناف:' : 'Total Item Types:'}</span>
                  <span className="font-mono">{sale.items ? sale.items.length : 0}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>{language === 'ar' ? 'إجمالي الكميات:' : 'Total Units:'}</span>
                  <span className="font-mono">
                    {sale.items
                      ? sale.items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0)
                      : 0}
                  </span>
                </div>
                {totalOrderWeight > 0 && (
                  <div className="flex justify-between font-black text-slate-900 bg-sky-50/90 p-1.5 rounded border border-sky-200">
                    <span>{language === 'ar' ? '⚖️ إجمالي الوزن الفعلي:' : '⚖️ Total Order Weight:'}</span>
                    <span className="font-mono font-black">{totalOrderWeight.toFixed(2)} {language === 'ar' ? 'كجم' : 'kg'}</span>
                  </div>
                )}
                {sale.order_discount !== undefined && sale.order_discount > 0 && (
                  <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
                    <span>{language === 'ar' ? 'خصم الفاتورة:' : 'Order Discount:'}</span>
                    <span className="font-mono text-amber-800">-{formatCurrency(sale.order_discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-[12px] pt-1 border-t border-slate-300">
                  <span>{language === 'ar' ? 'المبلغ الإجمالي المطلوب:' : 'Grand Total:'}</span>
                  <span className="font-mono">{formatCurrency(sale.grand_total)}</span>
                </div>
                {sale.paid_amount !== undefined && sale.paid_amount < sale.grand_total && (
                  <div className="flex justify-between font-black text-rose-700 pt-0.5">
                    <span>{language === 'ar' ? 'المتبقي في الذمة (دين):' : 'Remaining Debt:'}</span>
                    <span className="font-mono">{formatCurrency(Math.max(0, sale.grand_total - (sale.paid_amount || 0)))}</span>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="border-b border-dashed border-slate-800 my-1.5" />

          {/* Clean Footer */}
          <div className="text-center text-[9px] pt-1 text-slate-700 leading-tight space-y-0.5">
            <p className="font-bold">{language === 'ar' ? 'شكراً لزيارتكم! بالهناء والشفاء ✨' : 'Thank you for shopping with us! ✨'}</p>
            <p>{language === 'ar' ? 'متجر خليل' : 'Khalil Store'}</p>
          </div>
        </div>

        <div className="flex space-x-2 rtl:space-x-reverse pt-2">
          <Button variant="outline" onClick={onClose} className="w-full border-slate-300 text-slate-700 hover:bg-slate-100">
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
          <Button
            onClick={handlePrint}
            className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <Printer className="h-4 w-4" />
            <span>{language === 'ar' ? 'طباعة الإيصال' : 'Print Receipt'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ThermalReceiptModal;

