import React, { useState, useEffect } from 'react';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useLanguageStore } from '@stores/useLanguageStore';
import { Printer, CheckCircle2, Info, FileText, Tag, PackageCheck } from 'lucide-react';
import { ThermalReceiptModal } from '../../pos/ThermalReceiptModal';
import { SalesOrderEntity, SalesOrderItemEntity } from '@shared/types';

export const PrinterSettings: React.FC = () => {
  const { language } = useLanguageStore();

  const [defaultReceiptMode, setDefaultReceiptMode] = useState<'with-prices' | 'without-prices'>(
    () => {
      try {
        const saved = localStorage.getItem('khalil_receipt_print_mode');
        if (saved === 'with-prices' || saved === 'without-prices') return saved;
      } catch {
        // ignore
      }
      return 'with-prices';
    },
  );

  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(() => {
    try {
      const saved = localStorage.getItem('khalil_receipt_paper_width');
      if (saved === '58mm' || saved === '80mm') return saved;
    } catch {
      // ignore
    }
    return '58mm';
  });

  const [businessName, setBusinessName] = useState('متجر علي خليل');
  const [businessAddress, setBusinessAddress] = useState('السوق المركزي');
  const [taxNumber, setTaxNumber] = useState('VAT-300998811');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  useEffect(() => {
    if (window.api?.getSectionSettings) {
      window.api.getSectionSettings('receipt').then((res) => {
        if (res.success && res.data) {
          if (res.data.businessName) setBusinessName(res.data.businessName);
          if (res.data.businessAddress) setBusinessAddress(res.data.businessAddress);
          if (res.data.taxNumber) setTaxNumber(res.data.taxNumber);
          if (res.data.defaultReceiptMode === 'with-prices' || res.data.defaultReceiptMode === 'without-prices') {
            setDefaultReceiptMode(res.data.defaultReceiptMode);
          }
          if (res.data.paperWidth === '58mm' || res.data.paperWidth === '80mm') {
            setPaperWidth(res.data.paperWidth);
          }
        }
      });
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    try {
      localStorage.setItem('khalil_receipt_print_mode', defaultReceiptMode);
      localStorage.setItem('khalil_receipt_paper_width', paperWidth);

      if (window.api?.updateSectionSettings) {
        await window.api.updateSectionSettings('receipt', {
          businessName,
          businessAddress,
          taxNumber,
          defaultReceiptMode,
          paperWidth,
        });
      }
      setSuccessMsg(
        language === 'ar'
          ? 'تم حفظ إعدادات الطابعة والإيصال بنجاح ✓'
          : 'Printer & receipt settings saved successfully ✓',
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      // ignore
    }
  };

  const sampleTestSale: SalesOrderEntity & {
    items: Array<SalesOrderItemEntity & { name_ar?: string; name_en?: string }>;
  } = {
    id: 'test-sale-1',
    invoice_number: 'INV-TEST-0001',
    customer_id: undefined,
    customer_name: language === 'ar' ? 'زبون تجريبي (تجربة طابعة)' : 'Test Customer (Printer Test)',
    subtotal: 7500,
    item_discount: 0,
    order_discount: 0,
    tax_total: 0,
    grand_total: 7500,
    paid_amount: 7500,
    change_amount: 0,
    payment_status: 'Paid',
    payment_method: 'Cash',
    created_at: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        sale_id: 'test-sale-1',
        product_id: 'prod-salmon',
        unit_id: 'unit-kg',
        name_ar: 'فيليه سلمون نرويجي طازج',
        name_en: 'Fresh Salmon Fillet',
        quantity: 2,
        unit_price: 3000,
        cost_price: 2000,
        discount: 0,
        tax_rate: 0,
        tax_amount: 0,
        line_total: 6000,
        selling_mode: 'piece',
        piece_weight: 1.5,
        pieces_per_pack: 1,
        unit_weight: 1.5,
        total_weight: 3.0,
      },
      {
        id: 'item-2',
        sale_id: 'test-sale-1',
        product_id: 'prod-shrimp',
        unit_id: 'unit-carton',
        name_ar: 'روبيان جامبو طازج (كرتون)',
        name_en: 'Jumbo Shrimp (Pack)',
        quantity: 1,
        unit_price: 1500,
        cost_price: 1000,
        discount: 0,
        tax_rate: 0,
        tax_amount: 0,
        line_total: 1500,
        selling_mode: 'pack',
        piece_weight: 0.25,
        pieces_per_pack: 6,
        unit_weight: 1.5,
        total_weight: 1.5,
      },
    ],
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2 rtl:space-x-reverse">
          <Printer className="h-5 w-5 text-sky-600" />
          <span>{language === 'ar' ? 'طابعة الإيصالات الحرارية (Thermal Printer)' : 'Thermal Receipt Printers'}</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'ar'
            ? 'ضبط إعدادات الطباعة الحرارية ونموذج الإيصالات وتجربة الطابعة'
            : 'Configure thermal printing mode, paper widths, receipt headers, and test your physical printer.'}
        </p>
      </div>

      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Info Card: Direct Windows Spooler Printing */}
      <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 p-4 rounded-xl flex items-start space-x-3 rtl:space-x-reverse">
        <Info className="h-5 w-5 text-sky-600 mt-0.5 shrink-0" />
        <div className="text-xs leading-relaxed text-sky-950 dark:text-sky-200">
          <p className="font-bold mb-1">
            {language === 'ar'
              ? 'كيف تعمل الطباعة الحرارية في نظام خليل؟'
              : 'How thermal printing works in Khalil POS:'}
          </p>
          <p>
            {language === 'ar'
              ? 'تعتمد المنظومة على نظام إدارة الطابعات القياسي لويندوز (Windows Print Spooler). أي طابعة حرارية (58 مم أو 80 مم) مثل Xprinter و Epson و Rongta و Bixolon يتم تعريفها في ويندوز عبر USB أو الشبكة أو البلوتوث تعمل تلقائياً مع النظام بدون الحاجة لأي تعريفات معقدة.'
              : 'Khalil POS prints directly via the standard Windows Print Spooler. Any standard 58mm or 80mm thermal receipt printer (e.g. Xprinter, Epson, Rongta, Bixolon) connected via USB, Network LAN, or Bluetooth works seamlessly.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Default Receipt Print Mode */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {language === 'ar' ? '1. نوع الإيصال الافتراضي عند إتمام البيع' : '1. Default Receipt Mode at POS Checkout'}
          </h4>
          <p className="text-xs text-slate-500">
            {language === 'ar'
              ? 'اختر النمط الافتراضي الذي ترغب أن يفتح به الإيصال (يمكنك أيضاً التبديل بينهما بنقرة واحدة داخل شاشة الإيصال):'
              : 'Choose the default layout opened after completing a sale (you can also switch anytime in the receipt popup):'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <label
              className={`p-3.5 border rounded-xl cursor-pointer flex items-start space-x-3 rtl:space-x-reverse transition-all ${
                defaultReceiptMode === 'with-prices'
                  ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 ring-1 ring-sky-500'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                type="radio"
                name="defaultReceiptMode"
                value="with-prices"
                checked={defaultReceiptMode === 'with-prices'}
                onChange={() => setDefaultReceiptMode('with-prices')}
                className="mt-1"
              />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5 rtl:space-x-reverse">
                  <Tag className="h-3.5 w-3.5 text-sky-600" />
                  <span>{language === 'ar' ? 'مع الأسعار (إيصال مالي للزبون)' : 'With Prices (Financial Receipt)'}</span>
                </span>
                <p className="text-slate-500 leading-normal">
                  {language === 'ar'
                    ? 'يتضمن تفاصيل الأصناف، الكميات، أسعار الوحدات، المجموع الكلي، وطريقة السداد.'
                    : 'Shows items, quantities, unit prices, line totals, and grand total.'}
                </p>
              </div>
            </label>

            <label
              className={`p-3.5 border rounded-xl cursor-pointer flex items-start space-x-3 rtl:space-x-reverse transition-all ${
                defaultReceiptMode === 'without-prices'
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                type="radio"
                name="defaultReceiptMode"
                value="without-prices"
                checked={defaultReceiptMode === 'without-prices'}
                onChange={() => setDefaultReceiptMode('without-prices')}
                className="mt-1"
              />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5 rtl:space-x-reverse">
                  <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{language === 'ar' ? 'بدون أسعار (إشعار تسليم واستلام)' : 'Without Prices (Delivery Slip)'}</span>
                </span>
                <p className="text-slate-500 leading-normal">
                  {language === 'ar'
                    ? 'يركز فقط على الكميات والكراتين والأوزان بالكيلوغرام لتسليم السائقين بدون إظهار مبالغ مالية.'
                    : 'Shows quantities, carton counts, and weights for delivery without showing prices.'}
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Section 2: Paper Size */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {language === 'ar' ? '2. مقاس ورق الطابعة الحرارية' : '2. Thermal Paper Width'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaperWidth('58mm')}
              className={`p-3 border rounded-xl text-left rtl:text-right transition-all flex items-center justify-between ${
                paperWidth === '58mm'
                  ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 ring-1 ring-sky-500'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {language === 'ar' ? '58 مم (الحجم القياسي الشائع)' : '58mm (Standard Compact)'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {language === 'ar' ? 'طابعات الفواتير الصغيرة الأكثر انتشاراً' : 'Most common for small POS receipt rolls'}
                </p>
              </div>
              {paperWidth === '58mm' && <CheckCircle2 className="h-4 w-4 text-sky-600" />}
            </button>

            <button
              type="button"
              onClick={() => setPaperWidth('80mm')}
              className={`p-3 border rounded-xl text-left rtl:text-right transition-all flex items-center justify-between ${
                paperWidth === '80mm'
                  ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 ring-1 ring-sky-500'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {language === 'ar' ? '80 مم (الحجم العريض)' : '80mm (Wide Format)'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {language === 'ar' ? 'طابعات الكاشير الكبيرة' : 'Wide desktop receipt printers'}
                </p>
              </div>
              {paperWidth === '80mm' && <CheckCircle2 className="h-4 w-4 text-sky-600" />}
            </button>
          </div>
        </div>

        {/* Section 3: Header & Business Info on Receipts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {language === 'ar' ? '3. ترويسة الإيصال ومعلومات المتجر' : '3. Receipt Header Information'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={language === 'ar' ? 'اسم المتجر في ترويسة الإيصال' : 'Store Header Name'}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="متجر علي خليل"
            />
            <Input
              label={language === 'ar' ? 'عنوان المتجر / الفرع' : 'Store Address'}
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="السوق المركزي"
            />
            <Input
              label={language === 'ar' ? 'الرقم الضريبي أو السجل التجاري' : 'Tax / VAT Registration #'}
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              placeholder="VAT-300998811"
            />
          </div>
        </div>

        {/* Save and Test Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsTestModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rtl:space-x-reverse border-sky-300 text-sky-700 hover:bg-sky-50 font-bold"
          >
            <Printer className="h-4 w-4 text-sky-600" />
            <span>{language === 'ar' ? 'تجربة الطباعة الحرارية (إيصال تجريبي) 🖨️' : 'Test Thermal Print (Sample Slip)'}</span>
          </Button>

          <Button type="submit" className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold px-6">
            {language === 'ar' ? 'حفظ إعدادات الطابعة' : 'Save Printer Settings'}
          </Button>
        </div>
      </form>

      {/* Guide Card: How to set default printer in Windows */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-xs space-y-2 text-slate-700 dark:text-slate-300">
        <p className="font-bold flex items-center space-x-1.5 rtl:space-x-reverse text-slate-900 dark:text-slate-100">
          <FileText className="h-4 w-4 text-slate-500" />
          <span>{language === 'ar' ? 'خطوات سريعة لإعداد الطابعة في ويندوز:' : 'Quick Steps to Configure Printer in Windows:'}</span>
        </p>
        <ol className="list-decimal list-inside space-y-1 leading-relaxed text-slate-600 dark:text-slate-400">
          <li>{language === 'ar' ? 'صل الطابعة الحرارية بجهاز اللابتوب عبر كابل USB وتأكد من تشغيلها وتركيب بكرة الورق.' : 'Connect your thermal printer to the laptop via USB and ensure power and paper roll are inserted.'}</li>
          <li>{language === 'ar' ? 'قم بتثبيت تعريف الطابعة (Driver) المرفق معها من الشركة المصنعة (مثل Xprinter أو POS-58).' : 'Install the manufacturer printer driver (e.g. Xprinter, POS-58).'}</li>
          <li>{language === 'ar' ? 'افتح إعدادات ويندوز > الطابعات والماسحات الضوئية (Printers & Scanners) وحدد طابعتك كطابعة افتراضية (Set as Default).' : 'Open Windows Settings > Printers & Scanners and set your thermal printer as default.'}</li>
          <li>{language === 'ar' ? 'اضغط على زر "تجربة الطباعة الحرارية" أعلاه للتأكد من خروج الإيصال بشكل صحيح.' : 'Click "Test Thermal Print" above to verify output.'}</li>
        </ol>
      </div>

      {/* Sample Thermal Receipt Preview Modal for testing */}
      <ThermalReceiptModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        sale={sampleTestSale}
        businessName={businessName}
        businessAddress={businessAddress}
        taxNumber={taxNumber}
      />
    </div>
  );
};

export default PrinterSettings;
