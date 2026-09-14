import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { usePOSStore } from '@stores/usePOSStore';
import { useProductStore } from '@stores/useProductStore';
import { useAuthStore } from '@stores/useAuthStore';
import { useLanguageStore } from '@stores/useLanguageStore';
import { useZoomStore } from '@stores/useZoomStore';
import { SalesOrderEntity, ProductEntity } from '@shared/types';
import { Button } from '@components/ui/Button';
import { POSPaymentModal } from './POSPaymentModal';
import { POSHoldResumeModal } from './POSHoldResumeModal';
import { POSHoldSaveModal } from './POSHoldSaveModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { formatCurrency } from '../../renderer/utils/currency';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  PlayCircle,
  CreditCard,
  RotateCcw,
  Fish,
  Tag,
  Package,
} from 'lucide-react';

// Default Fish Products for instant store catalog (Prices in FCFA)
const DEFAULT_FISH_PRODUCTS: Partial<ProductEntity>[] = [
  {
    id: 'fish-salmon',
    sku: 'FISH-001',
    name_en: 'Fresh Salmon (سالمون طازج)',
    name_ar: 'سالمون طازج',
    selling_price: 6500,
    allow_decimal_qty: 1,
    base_unit_id: 'Kg',
    category_id: 'fresh',
  },
  {
    id: 'fish-seabream',
    sku: 'FISH-002',
    name_en: 'Sea Bream (دنيس طازج)',
    name_ar: 'سمك دنيس طازج',
    selling_price: 4500,
    allow_decimal_qty: 1,
    base_unit_id: 'Kg',
    category_id: 'fresh',
  },
  {
    id: 'fish-seabass',
    sku: 'FISH-003',
    name_en: 'Sea Bass (قاروص طازج)',
    name_ar: 'سمك قاروص طازج',
    selling_price: 5000,
    allow_decimal_qty: 1,
    base_unit_id: 'Kg',
    category_id: 'fresh',
  },
  {
    id: 'fish-shrimp-jumbo',
    sku: 'FISH-004',
    name_en: 'Jumbo Shrimp (روبيان جامبو)',
    name_ar: 'روبيان جامبو طازج',
    selling_price: 8500,
    allow_decimal_qty: 1,
    base_unit_id: 'Kg',
    category_id: 'shrimp',
  },
  {
    id: 'fish-calamari',
    sku: 'FISH-005',
    name_en: 'Fresh Calamari (حبار طازج)',
    name_ar: 'حبار طازج',
    selling_price: 4000,
    allow_decimal_qty: 1,
    base_unit_id: 'Kg',
    category_id: 'shrimp',
  },
  {
    id: 'fish-hamour',
    sku: 'FISH-006',
    name_en: 'Fresh Hamour (هامور بلدي)',
    name_ar: 'هامور بلدي',
    selling_price: 6000,
    allow_decimal_qty: 1,
    base_unit_id: 'Kg',
    category_id: 'fresh',
  },
  {
    id: 'fish-fillet',
    sku: 'FISH-007',
    name_en: 'White Fish Fillet (فيليه أبيض)',
    name_ar: 'فيليه سمك أبيض',
    selling_price: 4500,
    allow_decimal_qty: 1,
    base_unit_id: 'Kg',
    category_id: 'fillet',
  },
  {
    id: 'fish-tuna-steak',
    sku: 'FISH-008',
    name_en: 'Tuna Steak (قطع تونة طازجة)',
    name_ar: 'قطع تونة طازجة',
    selling_price: 5500,
    allow_decimal_qty: 1,
    base_unit_id: 'Kg',
    category_id: 'fillet',
  },
  {
    id: 'fish-spices',
    sku: 'EXTRA-001',
    name_en: 'Fish Seasoning & Spices (بهارات سمك خاصة)',
    name_ar: 'بهارات وتتبيلة سمك',
    selling_price: 1000,
    allow_decimal_qty: 0,
    base_unit_id: 'Piece',
    category_id: 'extras',
  },
];

export const POSTerminalPage: React.FC = () => {
  const {
    cart,
    orderDiscount,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    setOrderDiscount,
    setAmountTendered,
    checkout,
    holdCurrentSale,
    resumeSale,
    isLoading,
  } = usePOSStore();

  const { products, categories: dbCategories, loadProducts, loadMetadata } = useProductStore();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const { zoom, zoomIn, zoomOut, resetZoom } = useZoomStore();

  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showHoldSaveModal, setShowHoldSaveModal] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<SalesOrderEntity | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts('');
    loadMetadata();

    const handleFocus = () => {
      loadProducts('');
      loadMetadata();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadProducts, loadMetadata]);

  useEffect(() => {
    if (productSearch.length > 1) {
      loadProducts(productSearch);
    }
  }, [productSearch, loadProducts]);

  const handleHoldSale = useCallback(() => {
    if (cart.length === 0) {
      alert(language === 'ar' ? 'السلة فارغة! أضف أصنافاً أولاً للتعليق.' : 'Cart is empty! Add items first to hold.');
      return;
    }
    setShowHoldSaveModal(true);
  }, [cart.length, language]);

  const handleHoldSaveConfirm = async (refName: string) => {
    const success = await holdCurrentSale(refName, user?.id);
    if (success) {
      setShowHoldSaveModal(false);
    }
  };

  // Keyboard Shortcuts (F4 = Hold, F5 = Resume, F2 = Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        handleHoldSale();
      } else if (e.key === 'F5') {
        e.preventDefault();
        setShowHoldModal(true);
      } else if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleHoldSale]);

  const categories = useMemo(() => {
    const hasDbCategories = dbCategories && dbCategories.length > 0;
    const allChip = {
      id: 'all',
      labelEn: hasDbCategories ? '🏷️ All Products' : '🐟 All Seafood',
      labelAr: hasDbCategories ? '🏷️ جميع الأصناف' : '🐟 جميع المأكولات',
      labelFr: hasDbCategories ? '🏷️ Tous les produits' : '🐟 Tous les poissons',
    };

    if (hasDbCategories) {
      const dynamicList = dbCategories.map((c) => ({
        id: c.id,
        labelEn: c.name_en,
        labelAr: c.name_ar || c.name_en,
        labelFr: c.name_en || c.name_ar,
      }));
      return [allChip, ...dynamicList];
    }

    return [
      allChip,
      { id: 'fresh', labelEn: 'Fresh Fish', labelAr: 'أسماك طازجة', labelFr: 'Poisson Frais' },
      { id: 'fillet', labelEn: 'Fillets & Cuts', labelAr: 'فيليه وقطع', labelFr: 'Filets & Tranches' },
      { id: 'shrimp', labelEn: 'Shrimp & Shellfish', labelAr: 'روبيان وقشريات', labelFr: 'Crevettes & Crustacés' },
      { id: 'extras', labelEn: 'Spices & Extras', labelAr: 'توابل وملحقات', labelFr: 'Épices & Extras' },
    ];
  }, [dbCategories]);

  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.some((c) => c.id === selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  const selectedCatObj = categories.find((c) => c.id === selectedCategory);

  // Combine DB products with default Fish products if DB is empty
  const displayProducts: ProductEntity[] = (
    products.length > 0 ? products : (DEFAULT_FISH_PRODUCTS as ProductEntity[])
  ).filter((p) => {
    const matchesSearch =
      !productSearch ||
      (p.name_en && p.name_en.toLowerCase().includes(productSearch.toLowerCase())) ||
      (p.name_ar && p.name_ar.includes(productSearch)) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' ||
      p.category_id === selectedCategory ||
      p.subcategory_id === selectedCategory ||
      (selectedCatObj && (
        (p.category_id && p.category_id.toLowerCase() === selectedCatObj.labelEn.toLowerCase()) ||
        (p.category_id && p.category_id.toLowerCase() === selectedCatObj.labelAr.toLowerCase())
      )) ||
      (selectedCategory === 'fresh' && (p.name_en?.toLowerCase().includes('fish') || p.name_en?.toLowerCase().includes('sea') || p.name_en?.toLowerCase().includes('salmon'))) ||
      (selectedCategory === 'shrimp' && (p.name_en?.toLowerCase().includes('shrimp') || p.name_en?.toLowerCase().includes('calamari'))) ||
      (selectedCategory === 'fillet' && (p.name_en?.toLowerCase().includes('fillet') || p.name_en?.toLowerCase().includes('steak'))) ||
      (selectedCategory === 'extras' && (p.name_en?.toLowerCase().includes('spice') || p.name_en?.toLowerCase().includes('extra')));

    return matchesSearch && matchesCategory;
  });

  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    cart.forEach((item) => {
      const lineSub = Math.round(item.quantity * item.unitPrice * 100) / 100;
      const lineDisc = Math.round(item.discount * 100) / 100;
      const taxable = Math.max(0, lineSub - lineDisc);
      const tax = Math.round(taxable * (item.taxRate / 100) * 100) / 100;

      subtotal += lineSub;
      taxTotal += tax;
    });

    const grandTotal = Math.round((subtotal - orderDiscount + taxTotal) * 100) / 100;
    return { subtotal, taxTotal, grandTotal };
  };

  const totals = calculateTotals();

  const handlePaymentConfirm = async (
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
  ) => {
    setAmountTendered(tendered);
    const sale = await checkout(payments, user?.id, borrowDetails);
    if (sale) {
      setShowPaymentModal(false);
      setLastCompletedSale(sale);
    } else {
      const err = usePOSStore.getState().error;
      if (err) {
        alert(language === 'ar' ? `خطأ أثناء الدفع: ${err}` : `Payment error: ${err}`);
      }
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col md:flex-row gap-3 bg-slate-50 text-slate-900 font-sans overflow-hidden select-none">
      {/* LEFT PANEL: Live Fish Catalog Grid & Category Filter */}
      <div className="flex-1 flex flex-col min-w-0 space-y-3">
        {/* Search Bar & Quick Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="flex items-center space-x-2 rtl:space-x-reverse bg-white border border-slate-200 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 shadow-sm px-3.5 py-2 rounded-2xl transition-all">
              <Search className="h-4 w-4 text-sky-600 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder={
                  language === 'ar'
                    ? 'بحث سريع بالاسم أو الكود (سالمون، حمص، روبيان)...'
                    : language === 'fr'
                    ? 'Recherche rapide par nom ou code (Saumon, Homos, etc.)...'
                    : 'Quick search by name or code (Salmon, Homos, Shrimp)...'
                }
                className="w-full bg-transparent text-xs sm:text-sm focus:outline-none text-slate-900 placeholder-slate-400"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Zoom on POS Screen */}
          <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-2xl px-2 py-1 shadow-sm space-x-0.5 rtl:space-x-reverse text-xs select-none">
            <span className="text-[11px] font-semibold text-slate-400 px-1">Zoom:</span>
            <button
              onClick={zoomOut}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="Zoom - (Ctrl -)"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="px-1.5 py-0.5 font-mono font-bold text-sky-600 hover:bg-sky-50 rounded-lg text-xs transition-colors"
              title="Reset 100% (Ctrl 0)"
            >
              {zoom}%
            </button>
            <button
              onClick={zoomIn}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="Zoom + (Ctrl +)"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Category Chips Bar */}
        <div className="flex space-x-2 rtl:space-x-reverse overflow-x-auto pb-1 select-none scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-sky-600 text-white shadow-sm border border-sky-600'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 shadow-sm'
              }`}
            >
              {language === 'ar'
                ? cat.labelAr
                : language === 'fr'
                ? cat.labelFr || cat.labelEn
                : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Product Catalog Cards Grid */}
        {displayProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200 rounded-3xl">
            <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl mb-3">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              {language === 'ar'
                ? 'لا توجد منتجات في هذا التصنيف أو البحث'
                : language === 'fr'
                ? 'Aucun produit trouvé dans cette catégorie ou recherche'
                : 'No products found in this category or search'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'ar'
                ? 'يمكنك إضافة أصناف جديدة وتعيين هذا القسم لها من إدارة المخزون'
                : language === 'fr'
                ? 'Vous pouvez ajouter de nouveaux articles et leur attribuer cette catégorie'
                : 'You can add new items and assign this category in Inventory'}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 pr-1">
            {displayProducts.map((p) => {
              const isFish =
                p.name_en?.toLowerCase().includes('fish') ||
                p.name_en?.toLowerCase().includes('salmon') ||
                p.name_en?.toLowerCase().includes('shrimp') ||
                p.name_en?.toLowerCase().includes('calamari') ||
                p.name_en?.toLowerCase().includes('seabass') ||
                p.name_en?.toLowerCase().includes('bream') ||
                p.name_ar?.includes('سمك') ||
                p.name_ar?.includes('سالمون') ||
                p.name_ar?.includes('روبيان') ||
                p.category_id === 'fresh' ||
                p.category_id === 'shrimp' ||
                p.category_id === 'fillet';

              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p, 1.0)}
                  className="group relative bg-white hover:bg-sky-50/40 border border-slate-200 hover:border-sky-400 p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between space-y-2.5 select-none active:scale-[0.98] shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="rounded-xl bg-sky-50 p-2 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-xs">
                        {isFish ? <Fish className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold font-mono">
                        {p.base_unit_id === 'Kg'
                          ? language === 'ar'
                            ? 'بالكيلو'
                            : '/Kg'
                          : language === 'ar'
                          ? 'بالقطعة'
                          : '/Pc'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 leading-snug">
                      {language === 'ar' ? p.name_ar || p.name_en : p.name_en}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {language === 'ar' ? 'السعر:' : 'Price:'}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-emerald-600 font-mono tracking-tight">
                      {formatCurrency(p.selling_price || 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Shopping Cart & Direct Checkout */}
      <div className="w-full md:w-[320px] lg:w-[350px] xl:w-[384px] bg-white border border-slate-200 rounded-3xl flex flex-col min-w-0 shadow-sm overflow-hidden">
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="p-1.5 rounded-lg bg-sky-100 text-sky-600">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <h2 className="font-bold text-sm text-slate-900">
              {language === 'ar' ? `سلة المبيعات (${cart.length})` : `Cart (${cart.length})`}
            </h2>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center space-x-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{language === 'ar' ? 'مسح' : 'Clear'}</span>
            </button>
          )}
        </div>

        {/* Cart Line Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.map((item, idx) => {
            const lineSub = item.quantity * item.unitPrice - item.discount;
            return (
              <div
                key={idx}
                className="p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs transition-colors"
              >
                <div className="flex justify-between items-center font-bold gap-1.5">
                  <span className="flex-1 min-w-0 truncate text-slate-900 font-bold">
                    {language === 'ar' ? (item.product.name_ar || item.product.name_en) : item.product.name_en}
                  </span>
                  <span className="text-emerald-600 font-mono text-xs sm:text-sm font-bold shrink-0">
                    {formatCurrency(lineSub)}
                  </span>
                </div>

                {/* Weight & Quantity Controls */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  <div className="flex items-center space-x-0.5 rtl:space-x-reverse bg-white rounded-xl p-0.5 border border-slate-200 shadow-xs">
                    <button
                      onClick={() =>
                        updateCartItem(idx, 'quantity', Math.max(0.05, Math.round((item.quantity - 0.25) * 100) / 100))
                      }
                      className="p-1 hover:text-sky-600 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      title="-0.25 Kg"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="0.05"
                        min="0.01"
                        value={item.quantity}
                        onChange={(e) => updateCartItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-11 text-center bg-transparent font-bold font-mono focus:outline-none text-slate-900 text-[11px]"
                      />
                      <span className="text-[9px] text-slate-500 font-semibold pr-0.5 rtl:pr-0 rtl:pl-0.5">
                        {item.product.base_unit_id === 'Kg' ? (language === 'ar' ? 'كجم' : 'Kg') : (language === 'ar' ? 'قطعة' : 'Pc')}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        updateCartItem(idx, 'quantity', Math.round((item.quantity + 0.25) * 100) / 100)
                      }
                      className="p-1 hover:text-sky-600 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      title="+0.25 Kg"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Price per Unit (FCFA) */}
                  <div
                    className="flex items-center space-x-0.5 rtl:space-x-reverse bg-white rounded-xl px-1.5 py-1 border border-slate-200 hover:border-emerald-500 transition-colors shadow-xs"
                    title={language === 'ar' ? 'تعديل السعر للوحدة' : 'Editable unit price'}
                  >
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateCartItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      className="w-12 text-center bg-transparent font-bold font-mono focus:outline-none text-emerald-600 text-[11px]"
                    />
                    <span className="text-[9px] text-slate-400 font-mono">F</span>
                  </div>

                  {/* Line Item Discount */}
                  <div
                    className="flex items-center space-x-0.5 rtl:space-x-reverse bg-white rounded-xl px-1.5 py-1 border border-slate-200 hover:border-amber-500 transition-colors shadow-xs"
                    title={language === 'ar' ? 'خصم الصنف (FCFA)' : 'Item discount (FCFA)'}
                  >
                    <Tag className="h-3 w-3 text-amber-500 shrink-0" />
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.discount}
                      onChange={(e) =>
                        updateCartItem(idx, 'discount', Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      placeholder="0"
                      className="w-10 text-center bg-transparent font-bold font-mono focus:outline-none text-amber-600 text-[11px]"
                    />
                  </div>

                  <button
                    onClick={() => removeFromCart(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Quick Weight Adjust Chips */}
                <div className="flex space-x-1.5 rtl:space-x-reverse pt-1 text-[10px]">
                  {[0.5, 1.0, 1.5, 2.0].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => updateCartItem(idx, 'quantity', preset)}
                      className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-mono hover:text-slate-900 transition-colors shadow-xs"
                    >
                      {preset} {language === 'ar' ? 'كجم' : 'Kg'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
              <div className="p-4 rounded-3xl bg-slate-100 border border-slate-200 mb-3">
                <Fish className="h-10 w-10 text-sky-400" />
              </div>
              <p className="text-xs font-semibold text-slate-500">
                {language === 'ar'
                  ? 'اختر صنف سمك من القائمة للبدء'
                  : 'Select seafood from catalog to start sale'}
              </p>
            </div>
          )}
        </div>

        {/* Cart Totals & Checkout Button */}
        <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50/80">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
              <span className="font-mono font-bold text-slate-800">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>{language === 'ar' ? 'خصم الفاتورة (FCFA):' : 'Order Discount (FCFA):'}</span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={orderDiscount}
                  onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 px-1.5 py-0.5 text-right bg-white border border-slate-300 rounded text-xs text-amber-600 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400">FCFA</span>
              </div>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>{language === 'ar' ? 'الإجمالي الكلي:' : 'Grand Total:'}</span>
              <span className="font-mono text-xl font-black text-emerald-600">{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="outline"
              disabled={cart.length === 0}
              onClick={handleHoldSale}
              className="text-xs border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl"
            >
              <PauseCircle className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
              <span>{language === 'ar' ? 'تعليق البيع' : 'Hold Sale'}</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowHoldModal(true)}
              className="text-xs border-sky-300 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl"
            >
              <PlayCircle className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
              <span>{language === 'ar' ? 'استرجاع معلق' : 'Resume'}</span>
            </Button>
          </div>

          <Button
            size="lg"
            disabled={cart.length === 0 || isLoading}
            onClick={() => setShowPaymentModal(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center space-x-2 rtl:space-x-reverse shadow-md shadow-emerald-600/20 py-3.5 text-sm rounded-2xl transition-all active:scale-[0.99]"
          >
            <CreditCard className="h-5 w-5" />
            <span>{language === 'ar' ? 'إتمام الدفع والفاتورة →' : 'Pay Cash & Print Receipt →'}</span>
          </Button>
        </div>
      </div>

      {/* Payment Modal */}
      <POSPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        grandTotal={totals.grandTotal}
        onConfirm={handlePaymentConfirm}
      />

      {/* Hold / Resume Modals */}
      <POSHoldResumeModal
        isOpen={showHoldModal}
        onClose={() => setShowHoldModal(false)}
        onSelect={(id) => resumeSale(id)}
      />

      <POSHoldSaveModal
        isOpen={showHoldSaveModal}
        onClose={() => setShowHoldSaveModal(false)}
        onConfirm={handleHoldSaveConfirm}
      />

      {/* Thermal Receipt Preview (Zero QR code) */}
      <ThermalReceiptModal
        isOpen={Boolean(lastCompletedSale)}
        onClose={() => setLastCompletedSale(null)}
        sale={lastCompletedSale}
        businessName={language === 'ar' ? 'متجر زَبَد للأسماك الطازجة' : 'Zabad Fresh Seafood'}
        businessAddress={language === 'ar' ? 'سوق السمك المركزي' : 'Seafood Harbor Market'}
      />
    </div>
  );
};
export default POSTerminalPage;


