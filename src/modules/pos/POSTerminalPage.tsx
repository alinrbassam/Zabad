import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePOSStore } from '@stores/usePOSStore';
import { useProductStore } from '@stores/useProductStore';
import { useAuthStore } from '@stores/useAuthStore';
import { SalesOrderEntity } from '@shared/types';
import { Button } from '@components/ui/Button';
import { POSPaymentModal } from './POSPaymentModal';
import { POSHoldResumeModal } from './POSHoldResumeModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import {
  Barcode,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  PlayCircle,
  CreditCard,
  RotateCcw,
} from 'lucide-react';

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

  const { products, loadProducts } = useProductStore();
  const { user } = useAuthStore();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<SalesOrderEntity | null>(null);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts('');
  }, [loadProducts]);

  useEffect(() => {
    if (productSearch.length > 1) {
      loadProducts(productSearch);
    }
  }, [productSearch, loadProducts]);

  const handleBarcodeSubmit = useCallback(
    (code: string) => {
      setBarcodeError(null);
      if (!code) return;

      const matched = products.find(
        (p) =>
          p.primary_barcode === code ||
          p.sku === code ||
          p.name_en.toLowerCase().includes(code.toLowerCase()),
      );

      if (matched) {
        addToCart(matched);
        setBarcodeInput('');
      } else {
        setBarcodeError(`Barcode "${code}" not found`);
      }
    },
    [products, addToCart],
  );

  const handleHoldSale = useCallback(async () => {
    const refName = prompt(
      'Enter a reference name for this held sale (e.g. Table 4 / Customer Name):',
    );
    if (refName) {
      await holdCurrentSale(refName, user?.id);
    }
  }, [holdCurrentSale, user?.id]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        clearCart();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) handleHoldSale();
      } else if (e.key === 'F5') {
        e.preventDefault();
        setShowHoldModal(true);
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) setShowPaymentModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, clearCart, handleHoldSale]);

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
      paymentMethod: 'Cash' | 'Card' | 'Digital Wallet' | 'Store Credit';
      amount: number;
      referenceNumber?: string;
    }[],
    tendered: number,
  ) => {
    setAmountTendered(tendered);
    const sale = await checkout(payments, user?.id);
    if (sale) {
      setShowPaymentModal(false);
      setLastCompletedSale(sale);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-4 p-2 bg-slate-900 text-white font-sans overflow-hidden">
      {/* LEFT PANEL: Barcode & Catalog */}
      <div className="flex-1 flex flex-col min-w-0 space-y-4">
        {/* Barcode & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-800 p-3 rounded-2xl border border-slate-700">
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
            <Barcode className="h-5 w-5 text-sky-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBarcodeSubmit(barcodeInput);
              }}
              placeholder="Scan Barcode (F1)..."
              className="w-full bg-transparent text-sm focus:outline-none text-white font-mono"
              autoFocus
            />
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search product name, SKU (F2)..."
              className="w-full bg-transparent text-sm focus:outline-none text-white"
            />
          </div>
        </div>

        {barcodeError && (
          <div className="p-2 bg-rose-500/20 border border-rose-500/50 rounded-xl text-xs text-rose-300 font-bold text-center">
            {barcodeError}
          </div>
        )}

        {/* Product Catalog Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pr-1">
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-sky-500/50 p-3 rounded-2xl cursor-pointer transition-all flex flex-col justify-between space-y-2 select-none group"
            >
              <div>
                <span className="text-xs font-bold text-slate-100 group-hover:text-sky-400 block truncate">
                  {p.name_en}
                </span>
                <span className="text-[10px] text-slate-400 block">SKU: {p.sku}</span>
              </div>

              <div className="flex justify-between items-end pt-1 border-t border-slate-700/50">
                <span className="text-xs text-slate-400 font-mono">
                  {p.primary_barcode || 'N/A'}
                </span>
                <span className="text-sm font-black text-emerald-400">
                  ${p.selling_price?.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: Shopping Cart & Checkout */}
      <div className="w-full md:w-96 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col min-w-0 shadow-2xl">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-sky-400" />
            <h2 className="font-bold text-sm">Cart ({cart.length})</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCart}
            className="text-xs text-rose-400 border-slate-700"
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Clear
          </Button>
        </div>

        {/* Cart Line Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.map((item, idx) => {
            const lineSub = item.quantity * item.unitPrice - item.discount;
            return (
              <div
                key={idx}
                className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-2 text-xs"
              >
                <div className="flex justify-between font-bold">
                  <span className="truncate w-40 text-slate-200">{item.product.name_en}</span>
                  <span className="text-emerald-400 font-mono">${lineSub.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <button
                      onClick={() =>
                        updateCartItem(idx, 'quantity', Math.max(0.01, item.quantity - 1))
                      }
                      className="p-1 hover:text-sky-400"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      step={item.product.allow_decimal_qty ? '0.01' : '1'}
                      value={item.quantity}
                      onChange={(e) => updateCartItem(idx, 'quantity', Number(e.target.value))}
                      className="w-12 text-center bg-transparent font-bold focus:outline-none"
                    />
                    <button
                      onClick={() => updateCartItem(idx, 'quantity', item.quantity + 1)}
                      className="p-1 hover:text-sky-400"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">@ ${item.unitPrice}</span>

                  <button
                    onClick={() => removeFromCart(idx)}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
              <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-xs">Scan barcode or select product to start sale</p>
            </div>
          )}
        </div>

        {/* Cart Totals & Actions */}
        <div className="p-4 border-t border-slate-700 space-y-3 bg-slate-800/80">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono">${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Order Discount ($):</span>
              <input
                type="number"
                value={orderDiscount}
                onChange={(e) => setOrderDiscount(Number(e.target.value))}
                className="w-16 px-1 text-right bg-slate-900 border border-slate-700 rounded text-xs text-white"
              />
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tax Total:</span>
              <span className="font-mono">${totals.taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-emerald-400 pt-2 border-t border-slate-700">
              <span>Grand Total:</span>
              <span>${totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="outline"
              disabled={cart.length === 0}
              onClick={handleHoldSale}
              className="text-xs border-slate-700 text-amber-400"
            >
              <PauseCircle className="h-4 w-4 mr-1" /> Hold (F4)
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowHoldModal(true)}
              className="text-xs border-slate-700 text-sky-400"
            >
              <PlayCircle className="h-4 w-4 mr-1" /> Resume (F5)
            </Button>
          </div>

          <Button
            size="lg"
            disabled={cart.length === 0 || isLoading}
            onClick={() => setShowPaymentModal(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950"
          >
            <CreditCard className="h-5 w-5" />
            <span>Pay & Print (F9) →</span>
          </Button>
        </div>
      </div>

      {/* Modals */}
      <POSPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        grandTotal={totals.grandTotal}
        onConfirm={handlePaymentConfirm}
      />

      <POSHoldResumeModal
        isOpen={showHoldModal}
        onClose={() => setShowHoldModal(false)}
        onSelect={(id) => resumeSale(id)}
      />

      <ThermalReceiptModal
        isOpen={Boolean(lastCompletedSale)}
        onClose={() => setLastCompletedSale(null)}
        sale={lastCompletedSale}
      />
    </div>
  );
};
