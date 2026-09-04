'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Coins,
  AlertTriangle,
  Receipt,
  RefreshCw,
  Lock,
  Phone,
  ArrowUpRight,
  ShieldCheck,
  Search,
  Wallet,
  Smartphone as PhoneIcon,
  ShoppingBag,
  TrendingUp,
  PackageX,
  Clock,
} from 'lucide-react';
import { StoreSnapshot, defaultDemoSnapshot } from '@/lib/storage';

const OWNER_PIN = process.env.NEXT_PUBLIC_DASHBOARD_PIN || '1234';

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<StoreSnapshot>(defaultDemoSnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'debts' | 'stock' | 'sales'>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [debtSearch, setDebtSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'out_of_stock' | 'low_stock'>('all');

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('zabad_auth_unlocked');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          setSnapshot(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load live data, using cached snapshot', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      setPinError(false);

      if (newPin.length === 4) {
        if (newPin === OWNER_PIN) {
          sessionStorage.setItem('zabad_auth_unlocked', 'true');
          setIsAuthenticated(true);
          setPinInput('');
        } else {
          setPinError(true);
          setTimeout(() => {
            setPinInput('');
            setPinError(false);
          }, 800);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleLock = () => {
    sessionStorage.removeItem('zabad_auth_unlocked');
    setIsAuthenticated(false);
    setPinInput('');
  };

  const formatFCFA = (amount: number = 0) => {
    return Math.round(amount).toLocaleString() + ' FCFA';
  };

  const filteredDebtors = useMemo(() => {
    if (!debtSearch.trim()) return snapshot.debts.records;
    const q = debtSearch.toLowerCase();
    return snapshot.debts.records.filter(
      (d) =>
        d.customerName.toLowerCase().includes(q) ||
        (d.customerPhone && d.customerPhone.includes(q)) ||
        d.invoiceNumber.toLowerCase().includes(q)
    );
  }, [snapshot.debts.records, debtSearch]);

  const filteredStock = useMemo(() => {
    if (stockFilter === 'all') return snapshot.stockAlerts.items;
    return snapshot.stockAlerts.items.filter((item) => item.status === stockFilter);
  }, [snapshot.stockAlerts.items, stockFilter]);

  // ================= PIN LOCK SCREEN =================
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-between min-h-screen px-6 py-12 bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950 text-white">
        <div className="text-center pt-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
            <Lock className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Zabad Seafood</h1>
          <p className="text-sm text-slate-400 mt-1">Owner Mobile Portal</p>
        </div>

        <div className="w-full max-w-xs flex flex-col items-center">
          <p className="text-xs text-slate-300 font-medium mb-6">
            Enter 4-digit security PIN to access live store records
          </p>

          {/* PIN Indicator Dots */}
          <div className="flex gap-4 mb-8">
            {[0, 1, 2, 3].map((idx) => {
              const filled = pinInput.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    pinError
                      ? 'bg-rose-500 animate-pulse'
                      : filled
                      ? 'bg-teal-400 scale-110 shadow-lg shadow-teal-500/50'
                      : 'bg-slate-700 border border-slate-600'
                  }`}
                />
              );
            })}
          </div>

          {pinError && (
            <p className="text-xs text-rose-400 font-semibold mb-4 animate-bounce">
              Incorrect PIN. Try again.
            </p>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-4 w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handlePinDigit(num)}
                className="h-14 rounded-2xl bg-slate-800/80 active:bg-teal-600/40 border border-slate-700/60 text-xl font-semibold transition-all"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPinInput('')}
              className="h-14 rounded-2xl bg-slate-800/40 text-xs font-semibold text-slate-400 active:bg-slate-800"
            >
              Clear
            </button>
            <button
              onClick={() => handlePinDigit('0')}
              className="h-14 rounded-2xl bg-slate-800/80 active:bg-teal-600/40 border border-slate-700/60 text-xl font-semibold transition-all"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-14 rounded-2xl bg-slate-800/40 text-xs font-semibold text-slate-400 active:bg-slate-800 flex items-center justify-center"
            >
              ⌫
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 text-center">
          Secured for Zabad Seafood Management
        </div>
      </div>
    );
  }

  // ================= MAIN DASHBOARD =================
  const today = snapshot.today || {};
  const totalCashAndMomo = (today.cashAmount || 0) + (today.mobileMoneyAmount || 0);
  const cashPercent = totalCashAndMomo > 0 ? Math.round(((today.cashAmount || 0) / totalCashAndMomo) * 100) : 50;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {snapshot.storeName || 'Zabad Seafood'}
            </h1>
          </div>
          <p className="text-[11px] text-slate-500">
            {snapshot.timestamp
              ? `Synced ${new Date(snapshot.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Live'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <button
            onClick={handleLock}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 active:scale-95 transition-all"
            title="Lock Portal"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 p-4 space-y-4">
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Big Revenue Banner */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white shadow-lg shadow-teal-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              <div className="flex items-center justify-between text-xs text-teal-200 font-medium mb-1">
                <span>TODAY'S REVENUE</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-600/50 border border-teal-400/30 text-[10px]">
                  {today.orderCount || 0} Orders
                </span>
              </div>
              <div className="text-3xl font-extrabold tracking-tight">
                {formatFCFA(today.revenue)}
              </div>

              <div className="mt-4 pt-3 border-t border-teal-600/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-teal-300 block text-[10px]">Gross Profit</span>
                  <span className="font-bold text-emerald-300">
                    +{formatFCFA(today.grossProfit)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-teal-300 block text-[10px]">Net After Expenses</span>
                  <span className={`font-bold ${today.netProfit >= 0 ? 'text-white' : 'text-rose-300'}`}>
                    {formatFCFA(today.netProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Expenses */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Today's Expenses</span>
                  <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {formatFCFA(today.expensesTotal)}
                </div>
                <span className="text-[10px] text-slate-400">
                  {snapshot.recentExpenses?.length || 0} entries today
                </span>
              </div>

              {/* Outstanding Debt */}
              <div
                onClick={() => setActiveTab('debts')}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm active:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Customer Debt</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="text-lg font-bold text-amber-600">
                  {formatFCFA(snapshot.debts.totalOutstanding)}
                </div>
                <span className="text-[10px] text-slate-400">
                  {snapshot.debts.debtorsCount} active debtor(s)
                </span>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Payment Breakdown
              </h2>

              {/* Visual Progress Bar */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${cashPercent}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title="Cash"
                />
                <div
                  style={{ width: `${100 - cashPercent}%` }}
                  className="bg-orange-500 h-full transition-all"
                  title="Orange Money / MOMO"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
                  <div>
                    <span className="text-[11px] text-slate-500 block">Cash ({cashPercent}%)</span>
                    <span className="font-bold text-slate-800">
                      {formatFCFA(today.cashAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-orange-500 inline-block" />
                  <div>
                    <span className="text-[11px] text-slate-500 block">OM / MOMO ({100 - cashPercent}%)</span>
                    <span className="font-bold text-slate-800">
                      {formatFCFA(today.mobileMoneyAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Health Banner */}
            <div
              onClick={() => setActiveTab('stock')}
              className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between cursor-pointer active:bg-rose-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
                  <PackageX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-rose-900">
                    Stock Alerts ({snapshot.stockAlerts.outOfStockCount + snapshot.stockAlerts.lowStockCount})
                  </h3>
                  <p className="text-[11px] text-rose-700">
                    {snapshot.stockAlerts.outOfStockCount} Out of stock • {snapshot.stockAlerts.lowStockCount} Low stock
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
            </div>
          </div>
        )}

        {/* ================= TAB 2: DEBTS & BORROW LEDGER ================= */}
        {activeTab === 'debts' && (
          <div className="space-y-4">
            {/* Total Debt Banner */}
            <div className="bg-amber-500 text-white p-4 rounded-2xl shadow-md">
              <span className="text-xs text-amber-100 block">TOTAL UNPAID DEBT</span>
              <div className="text-2xl font-extrabold mt-0.5">
                {formatFCFA(snapshot.debts.totalOutstanding)}
              </div>
              <span className="text-[11px] text-amber-100">
                {snapshot.debts.debtorsCount} customer(s) with pending balance
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search debtor name, phone, or invoice..."
                value={debtSearch}
                onChange={(e) => setDebtSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Debtors List */}
            <div className="space-y-2.5">
              {filteredDebtors.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No Outstanding Debts</p>
                  <p className="text-[11px] text-slate-400">All customer orders are fully paid.</p>
                </div>
              ) : (
                filteredDebtors.map((debt) => (
                  <div
                    key={debt.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {debt.customerName}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {debt.invoiceNumber} • {new Date(debt.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-rose-600 block">
                          {formatFCFA(debt.dueAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400">Due Amount</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        Paid: {formatFCFA(debt.paidAmount)} / {formatFCFA(debt.totalAmount)}
                      </span>
                      {debt.customerPhone && (
                        <a
                          href={`tel:${debt.customerPhone}`}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 font-semibold flex items-center gap-1 hover:bg-teal-100"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: STOCK ALERTS ================= */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setStockFilter('all')}
                className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                  stockFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                All ({snapshot.stockAlerts.items.length})
              </button>
              <button
                onClick={() => setStockFilter('out_of_stock')}
                className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                  stockFilter === 'out_of_stock'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                Out of Stock ({snapshot.stockAlerts.outOfStockCount})
              </button>
              <button
                onClick={() => setStockFilter('low_stock')}
                className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                  stockFilter === 'low_stock'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                Low Stock ({snapshot.stockAlerts.lowStockCount})
              </button>
            </div>

            {/* List */}
            <div className="space-y-2.5">
              {filteredStock.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Healthy Stock</p>
                  <p className="text-[11px] text-slate-400">All items are sufficiently stocked.</p>
                </div>
              ) : (
                filteredStock.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                      <span className="text-[10px] text-slate-500">
                        Restock threshold: {item.reorderLevel} {item.unit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                          item.status === 'out_of_stock'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.currentStock} {item.unit}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.status === 'out_of_stock' ? 'Depleted' : 'Low Stock'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: RECENT SALES ACTIVITY ================= */}
        {activeTab === 'sales' && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Today's Receipts
            </h2>

            {snapshot.recentSales.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Sales Recorded Today</p>
                <p className="text-[11px] text-slate-400">New sales will appear here in real-time.</p>
              </div>
            ) : (
              snapshot.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-mono">
                        {sale.invoiceNumber}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {sale.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 block">
                      {formatFCFA(sale.grandTotal)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">Completed</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Read-Only Mode Badge */}
        <div className="pt-4 pb-2 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 text-[10px] font-semibold text-slate-600">
            <ShieldCheck className="w-3 h-3 text-slate-500" />
            Read-Only Owner View • No changes permitted
          </span>
        </div>
      </div>

      {/* Floating Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-2 flex justify-around items-center z-40">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'overview' ? 'text-teal-600 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('debts')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all relative ${
            activeTab === 'debts' ? 'text-teal-600 font-bold' : 'text-slate-400'
          }`}
        >
          <Coins className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Debts</span>
          {snapshot.debts.debtorsCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
              {snapshot.debts.debtorsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all relative ${
            activeTab === 'stock' ? 'text-teal-600 font-bold' : 'text-slate-400'
          }`}
        >
          <AlertTriangle className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Stock</span>
          {snapshot.stockAlerts.outOfStockCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              {snapshot.stockAlerts.outOfStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'sales' ? 'text-teal-600 font-bold' : 'text-slate-400'
          }`}
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Sales</span>
        </button>
      </nav>
    </div>
  );
}
