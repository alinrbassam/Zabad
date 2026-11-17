import React, { useState } from 'react';
import { SalesOrderEntity, SalesOrderItemEntity } from '@shared/types';
import { useLanguageStore } from '../../renderer/stores/useLanguageStore';
import { Button } from '@components/ui/Button';
import { Printer, Tag, PackageCheck } from 'lucide-react';
import { formatDateTime } from '@utils/date';
import { formatCurrency } from '../../renderer/utils/currency';

type ReceiptItem = SalesOrderItemEntity & {
  name_ar?: string;
  name_en?: string;
  unit_name_ar?: string;
  unit_name_en?: string;
  unit_symbol?: string;
  unit_code?: string;
  product_piece_weight?: number;
  product_pieces_per_pack?: number;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: (SalesOrderEntity & { items?: ReceiptItem[] }) | null;
  businessName?: string;
  businessAddress?: string;
  taxNumber?: string;
}

export type ReceiptPrintMode = 'with-prices' | 'without-prices';

export const ThermalReceiptModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sale,
  businessName,
  businessAddress,
  taxNumber = 'VAT-300998811',
}) => {
  const { language } = useLanguageStore();

  const [receiptMode, setReceiptMode] = useState<ReceiptPrintMode>(() => {
    try {
      const saved = localStorage.getItem('khalil_receipt_print_mode');
      if (saved === 'with-prices' || saved === 'without-prices') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'with-prices';
  });

  if (!isOpen || !sale) return null;

  const defaultStoreName = language === 'ar' ? 'متجر علي خليل' : 'Ali Khalil Store';
  const defaultAddress = language === 'ar' ? 'السوق المركزي' : 'Central Market';

  const storeTitle = businessName || defaultStoreName;
  const storeAddr = businessAddress || defaultAddress;

  const handleModeChange = (mode: ReceiptPrintMode) => {
    setReceiptMode(mode);
    try {
      localStorage.setItem('khalil_receipt_print_mode', mode);
    } catch {
      // ignore
    }
  };

  const handlePrint = (mode?: ReceiptPrintMode) => {
    if (mode && mode !== receiptMode) {
      handleModeChange(mode);
      setTimeout(() => {
        window.print();
      }, 50);
    } else {
      window.print();
    }
  };

  const isWithPrices = receiptMode === 'with-prices';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3.5 my-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {language === 'ar' ? 'معاينة وطباعة الإيصال الحراري' : 'Thermal Receipt Preview'}
            </h2>
            <p className="text-[10px] text-slate-500">
              {language === 'ar' ? 'طابعة حرارية قياسية (58 مم / 80 مم)' : 'Standard 58mm / 80mm Thermal Paper'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">
            ✕
          </button>
        </div>

        {/* Receipt Mode Toggle Selector */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => handleModeChange('with-prices')}
            className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 rtl:space-x-reverse ${
              isWithPrices
                ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-700/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            <span>{language === 'ar' ? 'مع الأسعار' : 'With Prices'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('without-prices')}
            className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 rtl:space-x-reverse ${
              !isWithPrices
                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <PackageCheck className="h-3.5 w-3.5" />
            <span>{language === 'ar' ? 'بدون أسعار' : 'Without Prices'}</span>
          </button>
        </div>

        {/* 58mm Thermal Receipt Visual Preview (Printed target via #thermal-receipt) */}
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

          {/* Receipt Type Banner */}
          <div
            className={`text-[10px] font-bold text-center uppercase tracking-wider py-1 px-2 rounded border ${
              isWithPrices
                ? 'bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}
          >
            {isWithPrices
              ? language === 'ar'
                ? 'فاتورة مبيعات نقدية / ضريبية'
                : 'Sales Invoice / Receipt'
              : language === 'ar'
              ? 'إشعار تسليم واستلام بضاعة (أوزان وكميات)'
              : 'Delivery & Packing Slip (Weight & Qty)'}
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
            {isWithPrices && (
              <div className="flex justify-between">
                <span>{language === 'ar' ? 'طريقة الدفع:' : 'Payment:'}</span>
                <span className="font-semibold">{sale.payment_method || 'Cash'}</span>
              </div>
            )}
            {sale.customer_name && (
              <div className="flex justify-between font-bold text-slate-900 bg-slate-100 p-1 rounded border border-slate-200">
                <span>
                  {sale.payment_status === 'Paid'
                    ? language === 'ar'
                      ? 'الزبون / المستلم:'
                      : 'Customer / Receiver:'
                    : language === 'ar'
                    ? 'الزبون / المستدين:'
                    : 'Borrower / Customer:'}
                </span>
                <span className="font-black">{sale.customer_name}</span>
              </div>
            )}
            {isWithPrices && sale.payment_status && sale.payment_status !== 'Paid' && (
              <div className="flex justify-between font-bold text-rose-700 bg-rose-50 p-1 rounded">
                <span>{language === 'ar' ? 'حالة السداد:' : 'Payment Status:'}</span>
                <span>
                  {sale.payment_status === 'Unpaid'
                    ? language === 'ar'
                      ? 'دين غير مسدد'
                      : 'Unpaid Debt'
                    : language === 'ar'
                    ? 'مسدد جزئياً'
                    : 'Partially Paid'}
                </span>
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-slate-800 my-1" />

          {/* Line items list */}
          <div className="space-y-1">
            {/* Table Column Headers */}
            <div className="flex justify-between text-[11px] font-bold pb-1 border-b border-slate-300">
              <span className="flex-1">{language === 'ar' ? 'الصنف' : 'Item Description'}</span>
              <span className="text-center px-1">
                {isWithPrices ? (language === 'ar' ? 'الكمية' : 'Qty') : (language === 'ar' ? 'الكمية' : 'Qty')}
              </span>
              <span className="text-right rtl:text-left">
                {isWithPrices ? (language === 'ar' ? 'المجموع' : 'Total') : (language === 'ar' ? 'الوزن' : 'Weight')}
              </span>
            </div>

            {sale.items && sale.items.length > 0 ? (
              sale.items.map((item: ReceiptItem, idx) => {
                const itemName =
                  language === 'ar'
                    ? item.name_ar || item.name_en || item.product_id
                    : item.name_en || item.name_ar || item.product_id;
                const unitLabel =
                  language === 'ar'
                    ? item.unit_name_ar || item.unit_symbol || 'قطعة'
                    : item.unit_symbol || item.unit_code || 'pcs';

                const pcWeight = Number(item.piece_weight) || Number(item.product_piece_weight) || 0;
                const pcsPerPack =
                  Number(item.pieces_per_pack) || Number(item.product_pieces_per_pack) || 1;
                const isPieceMode = item.selling_mode === 'piece';
                const hasWeight = pcWeight > 0 || (Number(item.total_weight) || 0) > 0;
                const hasPack = pcsPerPack > 1;

                let qtyDisplay = `${item.quantity} ${unitLabel}`;
                if (hasPack) {
                  if (isPieceMode) {
                    qtyDisplay = `${item.quantity} ${language === 'ar' ? 'حبة' : 'pcs'}`;
                  } else {
                    qtyDisplay = `${item.quantity} ${language === 'ar' ? 'كرتون' : 'pack(s)'}`;
                  }
                }

                const itemTotalWeight =
                  Number(item.total_weight) ||
                  (hasWeight
                    ? isPieceMode
                      ? item.quantity * pcWeight
                      : item.quantity * pcsPerPack * pcWeight
                    : 0);

                const unitPrice = Number(item.unit_price) || 0;
                const lineTotal =
                  Number(item.line_total) || Number(item.quantity || 0) * unitPrice;

                return (
                  <div key={idx} className="py-1 border-b border-dashed border-slate-100">
                    <div className="flex justify-between items-start text-[11px]">
                      {/* Item Name & Details */}
                      <div className="font-bold pr-1.5 rtl:pr-0 rtl:pl-1.5 flex-1">
                        <p>
                          {itemName}
                          {hasPack && (
                            <span className="text-[9px] font-normal text-slate-500 mx-1">
                              (
                              {isPieceMode
                                ? language === 'ar'
                                  ? 'بالحبة'
                                  : 'piece'
                                : language === 'ar'
                                ? 'كرتون'
                                : 'pack'}
                              )
                            </span>
                          )}
                        </p>
                        {isWithPrices && (
                          <div className="text-[9.5px] text-slate-600 font-mono">
                            {qtyDisplay} × {formatCurrency(unitPrice)}
                          </div>
                        )}
                      </div>

                      {/* Qty (for without-prices) */}
                      {!isWithPrices && (
                        <span className="font-extrabold font-mono text-[11px] whitespace-nowrap px-1">
                          {qtyDisplay}
                        </span>
                      )}

                      {/* Right Column: Total Price (with-prices) or Total Weight (without-prices) */}
                      <span className="font-extrabold font-mono text-[11px] whitespace-nowrap text-slate-900">
                        {isWithPrices ? (
                          formatCurrency(lineTotal)
                        ) : hasWeight && itemTotalWeight > 0 ? (
                          `⚖️ ${itemTotalWeight.toFixed(2)} ${language === 'ar' ? 'كجم' : 'kg'}`
                        ) : (
                          '—'
                        )}
                      </span>
                    </div>

                    {/* Weight Subline if item is weighted (shown in with-prices mode as sub-info) */}
                    {isWithPrices && hasWeight && itemTotalWeight > 0 && (
                      <div className="text-[9.5px] text-slate-500 font-mono flex items-center justify-between pt-0.5">
                        <span>
                          {hasPack
                            ? !isPieceMode
                              ? `${item.quantity} × (${pcsPerPack} × ${pcWeight.toFixed(2)}kg)`
                              : `${item.quantity} × ${pcWeight.toFixed(2)}kg`
                            : `${pcWeight.toFixed(2)}kg/${language === 'ar' ? 'قطعة' : 'pc'}`}
                        </span>
                        <span className="font-semibold text-slate-700">
                          ⚖️ {itemTotalWeight.toFixed(2)} {language === 'ar' ? 'كجم' : 'kg'}
                        </span>
                      </div>
                    )}

                    {!isWithPrices && hasWeight && hasPack && (
                      <div className="text-[9px] text-slate-500 font-mono pt-0.5">
                        {!isPieceMode
                          ? `${item.quantity} × (${pcsPerPack} × ${pcWeight.toFixed(2)}kg)`
                          : `${item.quantity} × ${pcWeight.toFixed(2)}kg`}
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

          {/* Items & Weights Summary */}
          {(() => {
            const totalOrderWeight = sale.items
              ? sale.items.reduce((sum: number, it: ReceiptItem) => {
                  const lineTotalW = Number(it.total_weight) || 0;
                  if (lineTotalW > 0) return sum + lineTotalW;
                  const pw = Number(it.piece_weight) || Number(it.product_piece_weight) || 0;
                  const ppp = Number(it.pieces_per_pack) || Number(it.product_pieces_per_pack) || 1;
                  const isPiece = it.selling_mode === 'piece';
                  const calcW = pw > 0 ? (isPiece ? it.quantity * pw : it.quantity * ppp * pw) : 0;
                  return sum + calcW;
                }, 0)
              : 0;

            const totalUnits = sale.items
              ? sale.items.reduce((sum: number, it: ReceiptItem) => sum + (Number(it.quantity) || 0), 0)
              : 0;

            return (
              <div className="space-y-1 text-[10px] bg-slate-50 p-2 rounded border border-slate-200">
                <div className="flex justify-between font-bold">
                  <span>{language === 'ar' ? 'إجمالي عدد الأصناف:' : 'Total Item Types:'}</span>
                  <span className="font-mono">{sale.items ? sale.items.length : 0}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>{language === 'ar' ? 'إجمالي عدد الوحدات:' : 'Total Units Count:'}</span>
                  <span className="font-mono">{totalUnits}</span>
                </div>
                {totalOrderWeight > 0 && (
                  <div className="flex justify-between font-black text-slate-900 bg-sky-50/90 p-1.5 rounded border border-sky-200">
                    <span>{language === 'ar' ? '⚖️ إجمالي الوزن الفعلي:' : '⚖️ Total Order Weight:'}</span>
                    <span className="font-mono font-black">
                      {totalOrderWeight.toFixed(2)} {language === 'ar' ? 'كجم' : 'kg'}
                    </span>
                  </div>
                )}

                {/* Financial Totals (Only in with-prices mode) */}
                {isWithPrices && (
                  <>
                    {sale.order_discount !== undefined && sale.order_discount > 0 && (
                      <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
                        <span>{language === 'ar' ? 'خصم الفاتورة:' : 'Order Discount:'}</span>
                        <span className="font-mono text-amber-800">
                          -{formatCurrency(sale.order_discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-[12px] pt-1 border-t border-slate-300">
                      <span>{language === 'ar' ? 'المبلغ الإجمالي المطلوب:' : 'Grand Total:'}</span>
                      <span className="font-mono">{formatCurrency(sale.grand_total)}</span>
                    </div>
                    {sale.paid_amount !== undefined && sale.paid_amount < sale.grand_total && (
                      <div className="flex justify-between font-black text-rose-700 pt-0.5">
                        <span>{language === 'ar' ? 'المتبقي في الذمة (دين):' : 'Remaining Debt:'}</span>
                        <span className="font-mono">
                          {formatCurrency(Math.max(0, sale.grand_total - (sale.paid_amount || 0)))}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Delivery Verification Notice (Only in without-prices mode) */}
                {!isWithPrices && (
                  <div className="pt-2 border-t border-dashed border-slate-300 space-y-1.5 text-[9px] text-slate-600">
                    <p className="font-semibold text-center text-slate-800">
                      {language === 'ar'
                        ? 'تم تسليم واستلام البضاعة كاملة وبحالة جيدة ✓'
                        : 'Goods delivered and received in full & good condition ✓'}
                    </p>
                    <div className="flex justify-between pt-2">
                      <span>{language === 'ar' ? 'توقيع المستلم:' : 'Receiver Sign:'}</span>
                      <span>______________________</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="border-b border-dashed border-slate-800 my-1.5" />

          {/* Clean Footer */}
          <div className="text-center text-[9px] pt-1 text-slate-700 leading-tight space-y-0.5">
            <p className="font-bold">
              {language === 'ar'
                ? 'شكراً لزيارتكم! بالهناء والشفاء ✨'
                : 'Thank you for shopping with us! ✨'}
            </p>
            <p>{language === 'ar' ? 'متجر خليل' : 'Khalil Store'}</p>
          </div>
        </div>

        {/* Modal Action Buttons: Direct Print for Both Options */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={() => handlePrint('with-prices')}
              className={`flex items-center justify-center space-x-1 rtl:space-x-reverse font-bold text-xs py-2.5 ${
                isWithPrices
                  ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
              }`}
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{language === 'ar' ? 'طباعة مع الأسعار 🏷️' : 'Print with Prices'}</span>
            </Button>

            <Button
              type="button"
              onClick={() => handlePrint('without-prices')}
              className={`flex items-center justify-center space-x-1 rtl:space-x-reverse font-bold text-xs py-2.5 ${
                !isWithPrices
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
              }`}
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{language === 'ar' ? 'طباعة إشعار تسليم 📦' : 'Print Delivery Slip'}</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 py-1.5 text-xs font-semibold"
          >
            {language === 'ar' ? 'إغلاق المعاينة' : 'Close Preview'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThermalReceiptModal;
