import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { useLanguageStore } from '../../renderer/stores/useLanguageStore';
import { formatCurrency } from '../../renderer/utils/currency';
import { formatDateTime } from '../../renderer/utils/date';
import { SalesOrderEntity, SalesOrderItemEntity } from '../../shared/types';
import { POSRefundInput } from '../../shared/validation';
import {
  Undo2,
  AlertCircle,
  Banknote,
  CreditCard,
  PackageCheck,
  Minus,
  Plus,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: SalesOrderEntity | null;
  onConfirmRefund: (payload: POSRefundInput) => Promise<boolean>;
}

interface ItemRefundState {
  saleItemId: string;
  productId: string;
  batchId?: string | null;
  name: string;
  originalQty: number;
  previouslyRefundedQty: number;
  availableQty: number;
  returnQty: number;
  unitPrice: number;
  sellingMode?: string;
  unitLabel: string;
  selected: boolean;
}

export const RefundModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sale,
  onConfirmRefund,
}) => {
  const { language } = useLanguageStore();

  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<ItemRefundState[]>([]);
  const [refundMethod, setRefundMethod] = useState<string>('Cash');
  const [selectedReasonPreset, setSelectedReasonPreset] = useState<string>('Customer Return');
  const [customReason, setCustomReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load sale items and calculate refundable balance when modal opens
  useEffect(() => {
    if (!isOpen || !sale) {
      setItems([]);
      setErrorMessage(null);
      setIsSubmitting(false);
      return;
    }

    setRefundMethod(sale.payment_method || 'Cash');
    setSelectedReasonPreset('Customer Return');
    setCustomReason('');
    setErrorMessage(null);

    const fetchSaleDetails = async () => {
      setIsLoadingItems(true);
      try {
        let loadedItems: SalesOrderItemEntity[] = [];
        if (window.api?.getSaleById) {
          const res = await window.api.getSaleById(sale.id);
          if (res?.success && res.data && Array.isArray(res.data.items)) {
            loadedItems = res.data.items;
          }
        }

        // If items were empty or couldn't be loaded from DB, fallback to placeholder
        if (loadedItems.length === 0) {
          loadedItems = [
            {
              id: 'item-default',
              sale_id: sale.id,
              product_id: 'default',
              unit_id: 'default-unit',
              quantity: 1,
              unit_price: sale.grand_total,
              cost_price: 0,
              discount: 0,
              tax_rate: 0,
              tax_amount: 0,
              line_total: sale.grand_total,
              name_en: 'Sale Item',
              name_ar: 'صنف الفاتورة',
              previously_refunded_qty: 0,
            },
          ];
        }

        const mapped: ItemRefundState[] = loadedItems.map((it, idx) => {
          const originalQty = Number(it.quantity) || 1;
          const prevRefunded = Number(it.previously_refunded_qty) || 0;
          const availableQty = Math.max(0, originalQty - prevRefunded);
          const effectivePrice = originalQty > 0 ? it.line_total / originalQty : (it.unit_price || 0);

          const itemName =
            language === 'ar'
              ? it.name_ar || it.name_en || `صنف #${idx + 1}`
              : it.name_en || it.name_ar || `Item #${idx + 1}`;

          const unitLabel =
            language === 'ar'
              ? it.unit_name_ar || it.unit_symbol || 'قطعة'
              : it.unit_symbol || it.unit_name_en || 'pcs';

          return {
            saleItemId: it.id,
            productId: it.product_id,
            batchId: it.batch_id || null,
            name: itemName,
            originalQty,
            previouslyRefundedQty: prevRefunded,
            availableQty,
            returnQty: availableQty > 0 ? 1 : 0,
            unitPrice: effectivePrice,
            sellingMode: it.selling_mode,
            unitLabel,
            // If only 1 item in total exists and is available, preselect it; otherwise leave unselected so cashier picks
            selected: loadedItems.length === 1 && availableQty > 0,
          };
        });

        setItems(mapped);
      } catch (err) {
        setErrorMessage((err as Error).message);
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchSaleDetails();
  }, [isOpen, sale, language]);

  // Calculations
  const selectedItems = useMemo(() => items.filter((i) => i.selected && i.returnQty > 0), [items]);

  const totalRefundAmount = useMemo(() => {
    const sum = selectedItems.reduce((acc, i) => acc + i.returnQty * i.unitPrice, 0);
    return Math.round(sum * 100) / 100;
  }, [selectedItems]);

  const totalSelectedUnits = useMemo(() => {
    return selectedItems.reduce((acc, i) => acc + i.returnQty, 0);
  }, [selectedItems]);

  // Determine if this refund will fully refund the remaining items
  const isForecastFullyRefunded = useMemo(() => {
    if (items.length === 0) return true;
    for (const it of items) {
      if (it.availableQty <= 0) continue;
      const isSelected = it.selected;
      if (!isSelected) return false;
      if (it.returnQty < it.availableQty) return false;
    }
    return true;
  }, [items]);

  const handleToggleSelect = (saleItemId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.saleItemId !== saleItemId) return it;
        if (it.availableQty <= 0) return it;
        const nextSelected = !it.selected;
        return {
          ...it,
          selected: nextSelected,
          returnQty: nextSelected ? (it.returnQty > 0 ? it.returnQty : 1) : it.returnQty,
        };
      })
    );
  };

  const handleQuantityChange = (saleItemId: string, newQty: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.saleItemId !== saleItemId) return it;
        const clamped = Math.max(1, Math.min(newQty, it.availableQty));
        return {
          ...it,
          returnQty: clamped,
          selected: true,
        };
      })
    );
  };

  const handleSelectAllAvailable = () => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        selected: it.availableQty > 0,
        returnQty: it.availableQty > 0 ? it.availableQty : 0,
      }))
    );
  };

  const handleDeselectAll = () => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        selected: false,
      }))
    );
  };

  const handleSubmitRefund = async () => {
    if (!sale) return;
    if (selectedItems.length === 0) {
      setErrorMessage(
        language === 'ar'
          ? 'يرجى تحديد صنف واحد على الأقل للاسترجاع وتحديد الكمية المطلوبة.'
          : 'Please select at least one item to refund and specify the returned quantity.'
      );
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const finalReason = customReason.trim()
      ? `${selectedReasonPreset}: ${customReason.trim()}`
      : selectedReasonPreset;

    const payload: POSRefundInput = {
      saleId: sale.id,
      reason: finalReason,
      refundMethod,
      items: selectedItems.map((i) => ({
        saleItemId: i.saleItemId,
        productId: i.productId,
        batchId: i.batchId || undefined,
        returnedQty: i.returnQty,
        refundAmount: Math.round(i.returnQty * i.unitPrice * 100) / 100,
      })),
    };

    try {
      const ok = await onConfirmRefund(payload);
      if (ok) {
        onClose();
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
              <Undo2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  {language === 'ar' ? 'استرجاع أصناف الفاتورة' : 'Refund Invoice Items'}
                </h2>
                <Badge variant="neutral" className="font-mono text-xs">
                  {sale.invoice_number}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'ar'
                  ? `الزبون: ${sale.customer_name || 'زبون عام'} | التاريخ: ${formatDateTime(sale.created_at)}`
                  : `Customer: ${sale.customer_name || 'Walk-in'} | Date: ${formatDateTime(sale.created_at)}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex-shrink-0">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Items Checklist Table (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-[160px] pr-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'اختر الأصناف المراد استرجاعها وحدد الكمية:' : 'Select items to refund and returned quantities:'}
            </span>
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs">
              <button
                type="button"
                onClick={handleSelectAllAvailable}
                className="text-sky-600 dark:text-sky-400 hover:underline font-semibold"
              >
                {language === 'ar' ? 'تحديد الكل المتاح' : 'Select All Available'}
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-slate-500 hover:underline"
              >
                {language === 'ar' ? 'إلغاء التحديد' : 'Deselect All'}
              </button>
            </div>
          </div>

          {isLoadingItems ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <RotateCcw className="h-5 w-5 animate-spin mx-auto mb-2 text-sky-600" />
              {language === 'ar' ? 'جارٍ تحميل أصناف الفاتورة...' : 'Loading invoice items...'}
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              {language === 'ar' ? 'لا توجد أصناف قابلة للاسترجاع في هذه الفاتورة.' : 'No refundable items found for this invoice.'}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((it) => {
                const isFullyReturnedAlready = it.availableQty <= 0;
                return (
                  <div
                    key={it.saleItemId}
                    className={`p-3 rounded-2xl border transition-all ${
                      isFullyReturnedAlready
                        ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                        : it.selected
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-sm'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Checkbox & Item Info */}
                      <div className="flex items-start space-x-3 rtl:space-x-reverse flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={it.selected}
                          disabled={isFullyReturnedAlready || isSubmitting}
                          onChange={() => handleToggleSelect(it.saleItemId)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 disabled:cursor-not-allowed cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {it.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>
                              {language === 'ar' ? 'تم شراء:' : 'Sold:'}{' '}
                              <strong className="font-mono text-slate-700 dark:text-slate-300">
                                {it.originalQty}
                              </strong>
                            </span>
                            {it.previouslyRefundedQty > 0 && (
                              <span className="text-rose-600 dark:text-rose-400">
                                ({language === 'ar' ? 'مسترجع سابقاً:' : 'Prev refunded:'} {it.previouslyRefundedQty})
                              </span>
                            )}
                            <span>•</span>
                            <span>
                              {language === 'ar' ? 'المتاح للاسترجاع:' : 'Available:'}{' '}
                              <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                                {it.availableQty}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="font-mono">{formatCurrency(it.unitPrice)}/{it.unitLabel}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper & Line Refund Total */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {isFullyReturnedAlready ? (
                          <Badge variant="neutral" className="text-[10px]">
                            {language === 'ar' ? 'تم استرجاعه بالكامل' : 'Fully Returned'}
                          </Badge>
                        ) : (
                          <div className="flex items-center space-x-1.5 rtl:space-x-reverse bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              disabled={!it.selected || it.returnQty <= 1 || isSubmitting}
                              onClick={() => handleQuantityChange(it.saleItemId, it.returnQty - 1)}
                              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Decrease"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={it.availableQty}
                              value={it.selected ? it.returnQty : 0}
                              disabled={!it.selected || isSubmitting}
                              onChange={(e) =>
                                handleQuantityChange(it.saleItemId, parseInt(e.target.value, 10) || 1)
                              }
                              className="w-12 text-center text-xs font-black font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-0.5 disabled:opacity-40"
                            />
                            <button
                              type="button"
                              disabled={!it.selected || it.returnQty >= it.availableQty || isSubmitting}
                              onClick={() => handleQuantityChange(it.saleItemId, it.returnQty + 1)}
                              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Increase"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        {it.selected && (
                          <span className="text-xs font-black font-mono text-rose-600 dark:text-rose-400">
                            -{formatCurrency(it.returnQty * it.unitPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Refund Method & Reason (Collapsible / Compact) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
          {/* Refund Method */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 rtl:space-x-reverse">
              <Banknote className="h-3.5 w-3.5 text-slate-500" />
              <span>{language === 'ar' ? 'طريقة الاسترجاع المالي:' : 'Refund Payment Method:'}</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {[
                { key: 'Cash', label: language === 'ar' ? 'نقداً' : 'Cash', icon: Banknote },
                { key: 'Card', label: language === 'ar' ? 'بطاقة' : 'Card', icon: CreditCard },
                { key: 'Borrow', label: language === 'ar' ? 'ذمة / دين' : 'Borrow Credit', icon: FileText },
              ].map((m) => {
                const Icon = m.icon;
                const isChosen = refundMethod === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setRefundMethod(m.key)}
                    className={`flex items-center justify-center space-x-1 rtl:space-x-reverse py-1.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                      isChosen
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-700 dark:text-rose-300'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Refund Reason */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 rtl:space-x-reverse">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>{language === 'ar' ? 'سبب الاسترجاع:' : 'Refund Reason:'}</span>
            </label>
            <select
              value={selectedReasonPreset}
              onChange={(e) => setSelectedReasonPreset(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="Customer Return">{language === 'ar' ? 'إرجاع من الزبون (غير مرغوب)' : 'Customer Return'}</option>
              <option value="Defective / Damaged">{language === 'ar' ? 'منتج تالف / معيب' : 'Defective / Damaged'}</option>
              <option value="Wrong Item Sold">{language === 'ar' ? 'صنف خاطئ تم بيعه' : 'Wrong Item Sold'}</option>
              <option value="Expired Item">{language === 'ar' ? 'منتهي الصلاحية' : 'Expired Item'}</option>
              <option value="Other">{language === 'ar' ? 'سبب آخر...' : 'Other'}</option>
            </select>
          </div>
        </div>

        {/* Optional Custom Reason Details */}
        {selectedReasonPreset === 'Other' && (
          <input
            type="text"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder={language === 'ar' ? 'اكتب تفاصيل سبب الاسترجاع...' : 'Specify refund reason...'}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        )}

        {/* Restock notice */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex-shrink-0">
          <PackageCheck className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>
            {language === 'ar'
              ? 'سيتم إعادة الأصناف المحددة تلقائياً إلى رصيد المخزون في النظام.'
              : 'Selected items will be automatically restocked into store inventory.'}
          </span>
        </div>

        {/* Summary & Action Buttons */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">
                {language === 'ar' ? 'الأصناف المحددة:' : 'Selected items:'}{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  {selectedItems.length} {language === 'ar' ? 'صنف' : 'item(s)'} ({totalSelectedUnits}{' '}
                  {language === 'ar' ? 'وحدة' : 'units'})
                </strong>
              </p>
              <p className="text-[11px] text-slate-400">
                {isForecastFullyRefunded
                  ? language === 'ar'
                    ? '⚡ سيتم تصنيف الفاتورة كـ "مسترجع بالكامل"'
                    : '⚡ Invoice will be marked as "Fully Refunded"'
                  : language === 'ar'
                    ? '⚡ سيتم تصنيف الفاتورة كـ "مسترجع جزئياً" ويمكن استرجاع باقي الأصناف لاحقاً'
                    : '⚡ Invoice will be marked as "Partially Refunded" (remaining items can be refunded later)'}
              </p>
            </div>

            <div className="text-right rtl:text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {language === 'ar' ? 'إجمالي مبلغ الاسترجاع' : 'Total Refund Amount'}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                {formatCurrency(totalRefundAmount)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-1">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs px-4"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              disabled={selectedItems.length === 0 || totalRefundAmount <= 0 || isSubmitting}
              onClick={handleSubmitRefund}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 flex items-center space-x-1.5 rtl:space-x-reverse shadow-md"
            >
              {isSubmitting ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  <span>{language === 'ar' ? 'جارٍ الاسترجاع...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <Undo2 className="h-4 w-4" />
                  <span>
                    {language === 'ar'
                      ? `تأكيد الاسترجاع (${formatCurrency(totalRefundAmount)})`
                      : `Confirm Refund (${formatCurrency(totalRefundAmount)})`}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
