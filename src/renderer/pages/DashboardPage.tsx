import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useLanguageStore } from '../stores/useLanguageStore';
import { useAuthStore } from '../stores/useAuthStore';
import {
  ShoppingCart,
  Truck,
  PackagePlus,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Receipt,
  PlusCircle,
  DollarSign,
  BarChart3,
  Fish,
  Flame,
  Scale,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { SalesOrderEntity } from '@shared/types';
import { formatDateTime } from '../utils/date';
import { formatCurrency } from '../utils/currency';

interface TopProductItem {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
  unit: string;
}

interface CategorySale {
  id: string;
  name: string;
  revenue: number;
  percentage: number;
  color: string;
}

interface DailySalesTrend {
  day: string;
  amount: number;
  orders: number;
}

export const DashboardPage: React.FC = () => {
  const { t, language } = useLanguageStore();
  const { activeRoleMode } = useAuthStore();
  const navigate = useNavigate();

  // Overview is Manager Only: Redirect Cashier directly to POS
  useEffect(() => {
    if (activeRoleMode === 'cashier') {
      navigate('/pos', { replace: true });
    }
  }, [activeRoleMode, navigate]);

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    grossProfit: 0,
    profitMargin: 0,
    ordersCount: 0,
    averageTicket: 0,
    totalStockQty: 0,
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    purchasesCount: 0,
    todayPurchases: 0,
  });

  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySale[]>([]);
  const [dailyTrend, setDailyTrend] = useState<DailySalesTrend[]>([]);
  const [recentSales, setRecentSales] = useState<SalesOrderEntity[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Calculate start date based on selected timeRange
        let startDate = todayStr;
        if (timeRange === 'week') {
          const past = new Date(now.getTime() - 7 * 86400000);
          startDate = past.toISOString().split('T')[0];
        } else if (timeRange === 'month') {
          const past = new Date(now.getTime() - 30 * 86400000);
          startDate = past.toISOString().split('T')[0];
        } else if (timeRange === 'all') {
          startDate = '2020-01-01';
        }

        // 1. Stock Summary
        let stockQty = 0;
        let productsCount = 0;
        let lowCount = 0;
        let outCount = 0;
        if (window.api?.getStockSummary) {
          const stockRes = await window.api.getStockSummary();
          if (stockRes && stockRes.success && stockRes.data) {
            productsCount = stockRes.data.totalProducts || 0;
            stockQty = stockRes.data.totalStockQty || 0;
            lowCount = stockRes.data.lowStockCount || 0;
            outCount = stockRes.data.outOfStockCount || 0;
          }
        }

        // 2. Sales Orders & Calculations
        let allSales: SalesOrderEntity[] = [];
        if (window.api?.getSalesList) {
          const salesRes = await window.api.getSalesList();
          if (salesRes && salesRes.success && salesRes.data) {
            allSales = salesRes.data;
            setRecentSales(allSales.slice(0, 6));
          }
        }

        // Filter valid sales by date range
        const validSales = allSales.filter(
          (s) => s.payment_status !== 'Cancelled' && s.payment_status !== 'Refunded',
        );
        const filteredSales = validSales.filter((s) => {
          if (!s.created_at) return false;
          if (timeRange === 'all') return true;
          return s.created_at.slice(0, 10) >= startDate;
        });

        const rev = filteredSales.reduce((acc, s) => acc + (s.grand_total || 0), 0);
        const orderCount = filteredSales.length;
        const avg = orderCount > 0 ? rev / orderCount : 0;

        // Fetch real dashboard metrics and product performance from backend
        let realGrossProfit = 0;
        if (window.api?.getReportsDashboard) {
          const metricsRes = await window.api.getReportsDashboard({
            startDate,
            endDate: todayStr,
          });
          if (metricsRes?.success && metricsRes.data) {
            realGrossProfit = Number((metricsRes.data as any).grossProfit ?? 0);
          }
        }
        const marginPct = rev > 0 ? Math.max(0, (realGrossProfit / rev) * 100) : 0;

        // 3. Purchase Orders
        let purchasesSum = 0;
        let poCount = 0;
        if (window.api?.getPurchaseOrders) {
          const poRes = await window.api.getPurchaseOrders();
          if (poRes && poRes.success && poRes.data) {
            const pos = poRes.data;
            const todayPOs = pos.filter((p) => p.created_at && p.created_at.startsWith(todayStr));
            purchasesSum = todayPOs.reduce((acc, p) => acc + (p.grand_total || 0), 0);
            poCount = todayPOs.length;
          }
        }

        setStats({
          totalRevenue: rev,
          grossProfit: realGrossProfit,
          profitMargin: Math.round(marginPct * 10) / 10,
          ordersCount: orderCount,
          averageTicket: avg,
          totalStockQty: Math.round(stockQty * 100) / 100,
          totalProducts: productsCount,
          lowStockCount: lowCount,
          outOfStockCount: outCount,
          purchasesCount: poCount,
          todayPurchases: purchasesSum,
        });

        // 4. Load Products & Categories for real Top Products & Category Breakdown
        const productMap = new Map<string, any>();
        const categoryMap = new Map<string, string>();

        if (window.api?.getCategories) {
          const catRes = await window.api.getCategories();
          if (catRes?.success && Array.isArray(catRes.data)) {
            for (const c of catRes.data) {
              categoryMap.set(c.id, language === 'ar' ? c.name_ar || c.name_en : c.name_en);
            }
          }
        }

        if (window.api?.searchProducts) {
          const prodRes = await window.api.searchProducts('', 500, 0);
          if (prodRes?.success && Array.isArray(prodRes.data)) {
            for (const p of prodRes.data) {
              productMap.set(p.id, p);
            }
          }
        }

        const realTopProducts: TopProductItem[] = [];
        const categoryRevTotals = new Map<string, number>();

        if (window.api?.getProductReport) {
          const perfRes = await window.api.getProductReport({
            startDate,
            endDate: todayStr,
          });
          if (perfRes?.success && Array.isArray(perfRes.data)) {
            const sortedByRev: any[] = [...perfRes.data].sort(
              (a: any, b: any) => Number(b.total_revenue || 0) - Number(a.total_revenue || 0),
            );

            for (const row of sortedByRev) {
              const pInfo = productMap.get(row.id);
              const catId = pInfo?.category_id || 'uncategorized';
              const catName =
                categoryMap.get(catId) ||
                (language === 'ar' ? 'عام' : 'General');
              const itemRev = Number(row.total_revenue || 0);
              const itemQty = Number(row.total_sold_qty || 0);

              if (itemRev > 0 || itemQty > 0) {
                categoryRevTotals.set(catName, (categoryRevTotals.get(catName) || 0) + itemRev);
              }

              if (realTopProducts.length < 5 && (itemRev > 0 || itemQty > 0)) {
                realTopProducts.push({
                  id: row.id,
                  name:
                    language === 'ar'
                      ? pInfo?.name_ar || row.name_en
                      : row.name_en,
                  category: catName,
                  quantitySold: Math.round(itemQty * 100) / 100,
                  revenue: Math.round(itemRev * 100) / 100,
                  unit: pInfo?.unit_symbol || 'Kg',
                });
              }
            }
          }
        }

        setTopProducts(realTopProducts);

        // 5. Real Category Breakdown
        const colors = ['bg-sky-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
        const totalCatRev = Array.from(categoryRevTotals.values()).reduce((a, b) => a + b, 0);
        const realCategories: CategorySale[] = Array.from(categoryRevTotals.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, catRev], idx) => ({
            id: `cat-${idx}`,
            name,
            revenue: Math.round(catRev * 100) / 100,
            percentage: totalCatRev > 0 ? Math.round((catRev / totalCatRev) * 100) : 0,
            color: colors[idx % colors.length],
          }));

        setCategorySales(realCategories);

        // 6. Real Last 7 Days Daily Trend
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const realTrend: DailySalesTrend[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 86400000);
          const dateKey = d.toISOString().split('T')[0];
          const daySales = validSales.filter(
            (s) => s.created_at && s.created_at.slice(0, 10) === dateKey,
          );
          const dayAmount = daySales.reduce((sum, s) => sum + (s.grand_total || 0), 0);
          realTrend.push({
            day: dayNames[d.getDay()],
            amount: Math.round(dayAmount * 100) / 100,
            orders: daySales.length,
          });
        }
        setDailyTrend(realTrend);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    window.addEventListener('supabase-data-synced', loadDashboardData);
    return () => window.removeEventListener('supabase-data-synced', loadDashboardData);
  }, [timeRange, language]);

  const maxProductRev = Math.max(...topProducts.map((p) => p.revenue), 1);
  const maxDailyTrend = Math.max(...dailyTrend.map((d) => d.amount), 1);

  if (activeRoleMode === 'cashier') {
    return null;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header with Title & Time Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center space-x-2 rtl:space-x-reverse">
            <Fish className="h-7 w-7 text-sky-600 dark:text-sky-400" />
            <span>
              {language === 'ar' ? 'لوحة تحليلات وإحصائيات المتجر' : 'Seafood Store Analytics'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'متابعة الأصناف الأكثر طلباً، توزيع المبيعات، ومراقبة الأرباح والمخزون'
              : 'Real-time performance of top selling fish, category shares, revenue, and stock'}
          </p>
        </div>

        {/* Time Range Filter Tabs */}
        <div className="flex items-center space-x-1 rtl:space-x-reverse bg-slate-200 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-300 dark:border-slate-700/80 select-none self-start sm:self-auto">
          {[
            { id: 'today', labelEn: 'Today', labelAr: 'اليوم' },
            { id: 'week', labelEn: 'This Week', labelAr: 'الأسبوع' },
            { id: 'month', labelEn: 'This Month', labelAr: 'الشهر' },
            { id: 'all', labelEn: 'All Time', labelAr: 'الكل' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeRange(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === tab.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {language === 'ar' ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Action Launchers Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Sell / POS Launcher */}
        <div
          onClick={() => navigate('/pos')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-5 text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <span className="flex items-center text-xs font-bold uppercase tracking-wider text-white/90 group-hover:translate-x-1 transition-transform">
              {language === 'ar' ? 'بدء البيع' : 'Start POS'}
              <ArrowRight className="ml-1.5 h-4 w-4 rtl:rotate-180" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-black">
              {language === 'ar' ? '🛒 نقطة البيع (الكاشير)' : '🛒 POS Cashier Checkout'}
            </h3>
            <p className="text-[11px] text-sky-100 mt-0.5">
              {language === 'ar'
                ? 'اختيار الأسماك، تحديد الوزن بالكيلو، وحساب الإجمالي فوراً'
                : 'Select fish from catalog, adjust weight in Kg, and cash checkout'}
            </p>
          </div>
        </div>

        {/* Buy / Direct Purchase */}
        <div
          onClick={() => navigate('/purchasing/direct')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <span className="flex items-center text-xs font-bold uppercase tracking-wider text-white/90 group-hover:translate-x-1 transition-transform">
              {language === 'ar' ? 'إدخال بضاعة' : 'Stock In'}
              <ArrowRight className="ml-1.5 h-4 w-4 rtl:rotate-180" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-black">{t('action_new_purchase')}</h3>
            <p className="text-[11px] text-emerald-100 mt-0.5">
              {language === 'ar'
                ? 'تسجيل فواتير الموردين وزيادة كميات المخزون مباشرة'
                : 'Record vendor invoices and increase stock inventory directly'}
            </p>
          </div>
        </div>

        {/* Add Product */}
        <div
          onClick={() => navigate('/inventory/products/new')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
              <PackagePlus className="h-6 w-6 text-white" />
            </div>
            <span className="flex items-center text-xs font-bold uppercase tracking-wider text-white/90 group-hover:translate-x-1 transition-transform">
              {language === 'ar' ? 'إضافة صنف' : 'Add Item'}
              <PlusCircle className="ml-1.5 h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-black">{t('action_add_product')}</h3>
            <p className="text-[11px] text-amber-100 mt-0.5">
              {language === 'ar'
                ? 'إضافة صنف سمك جديد بالاسم وسعر الكيلو وكمية البداية'
                : 'Add new seafood product with cost, selling price and starting stock'}
            </p>
          </div>
        </div>
      </div>

      {/* 4 KPI Highlight Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Revenue */}
        <Card className="border-l-4 border-l-sky-500 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'ar' ? 'إجمالي المبيعات' : 'Total Revenue'}
            </span>
            <div className="rounded-xl bg-sky-50 dark:bg-sky-950/50 p-2 text-sky-600 dark:text-sky-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {formatCurrency(stats.totalRevenue)}
            </span>
            <Badge variant="info">
              {stats.ordersCount} {language === 'ar' ? 'فاتورة' : 'orders'}
            </Badge>
          </div>
        </Card>

        {/* Estimated Gross Profit */}
        <Card className="border-l-4 border-l-emerald-500 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'ar' ? 'صافي الربح التقديري' : 'Estimated Gross Profit'}
            </span>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 p-2 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(stats.grossProfit)}
            </span>
            <Badge variant="success">
              {stats.profitMargin}% {language === 'ar' ? 'هامش' : 'margin'}
            </Badge>
          </div>
        </Card>

        {/* Total Stock on Hand in Store */}
        <Card className="border-l-4 border-l-indigo-500 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'ar' ? 'المخزون المتوفر' : 'Seafood Stock on Hand'}
            </span>
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/50 p-2 text-indigo-600 dark:text-indigo-400">
              <Scale className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {stats.totalStockQty} <span className="text-sm font-semibold">{language === 'ar' ? 'كجم' : 'Kg'}</span>
            </span>
            <span className="text-xs text-slate-500 font-bold">
              {stats.totalProducts} {language === 'ar' ? 'صنف' : 'items'}
            </span>
          </div>
        </Card>

        {/* Stock Alerts (Low Stock & Out of Stock) */}
        <Card
          className="border-l-4 border-l-rose-500 p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/inventory/products')}
          title={language === 'ar' ? 'انقر لعرض المنتجات وإعادة الطلب' : 'Click to view products and restock'}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'ar' ? 'تنبيهات نواقص المخزون' : 'Stock Alerts (Low & Out)'}
            </span>
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 p-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-2 rtl:space-x-reverse">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                {stats.outOfStockCount + stats.lowStockCount}
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {language === 'ar' ? 'أصناف تحتاج توريد' : 'items need restock'}
              </span>
            </div>
            <Badge variant={stats.outOfStockCount + stats.lowStockCount > 0 ? 'danger' : 'neutral'}>
              {stats.outOfStockCount + stats.lowStockCount > 0
                ? language === 'ar'
                  ? 'يتطلب طلبية'
                  : 'Reorder now'
                : language === 'ar'
                ? 'المخزون كافٍ'
                : 'Optimal'}
            </Badge>
          </div>
          {(stats.outOfStockCount > 0 || stats.lowStockCount > 0) && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold">
              <span className="text-rose-600 dark:text-rose-400">
                ⚠️ {stats.outOfStockCount} {language === 'ar' ? 'نافذ تماماً' : 'Out of Stock'}
              </span>
              <span className="text-amber-600 dark:text-amber-400">
                📉 {stats.lowStockCount} {language === 'ar' ? 'كمية منخفضة' : 'Low Stock'}
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Main Analytics Row: Top Selling Fish & Categories Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. TOP SELLING SEAFOOD PRODUCTS (2 Columns) */}
        <div className="lg:col-span-2">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {language === 'ar' ? 'الأصناف الأكثر مبيعاً' : 'Top Selling Seafood & Items'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'ترتيب الأسماك حسب إجمالي الإيرادات والوزن المباع' : 'Ranked by total revenue and weight (Kg) sold'}
                  </p>
                </div>
              </div>

              <Badge variant="neutral">
                {topProducts.length} {language === 'ar' ? 'أصناف رائدة' : 'Leaders'}
              </Badge>
            </div>

            {/* List of Top Products with Progress Bars */}
            <div className="space-y-3 pt-1">
              {topProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {language === 'ar'
                    ? 'لا توجد مبيعات مسجلة في هذه الفترة'
                    : 'No product sales recorded for this period'}
                </div>
              ) : (
                topProducts.map((prod, idx) => {
                  const percent = Math.min(100, Math.round((prod.revenue / maxProductRev) * 100));
                  return (
                    <div
                      key={prod.id}
                      className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800/80 transition-all hover:border-sky-500/40"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                          <span
                            className={`h-6 w-6 rounded-full flex items-center justify-center font-black text-[11px] ${
                              idx === 0
                                ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {prod.name}
                            </span>
                            <span className="text-[10px] text-slate-400">{prod.category}</span>
                          </div>
                        </div>

                        <div className="text-right rtl:text-left">
                          <span className="font-black text-slate-900 dark:text-slate-100 font-mono text-sm block">
                            {formatCurrency(prod.revenue)}
                          </span>
                          <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold font-mono">
                            {prod.quantitySold} {prod.unit}
                          </span>
                        </div>
                      </div>

                      {/* Progress Fill Bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* 2. TOP CATEGORIES BREAKDOWN (1 Column) */}
        <div>
          <Card className="p-5 space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-500">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {language === 'ar' ? 'المبيعات حسب الأقسام' : 'Sales by Category'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {language === 'ar' ? 'نسبة كل فئة من إجمالي المبيعات' : 'Revenue distribution share'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Share List */}
              <div className="space-y-3.5 pt-3">
                {categorySales.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    {language === 'ar'
                      ? 'لا توجد مبيعات حسب الأقسام بعد'
                      : 'No category sales recorded yet'}
                  </div>
                ) : (
                  categorySales.map((cat) => (
                    <div key={cat.id} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-slate-800 dark:text-slate-200">{cat.name}</span>
                        <span className="font-mono text-slate-900 dark:text-slate-100">
                          {formatCurrency(cat.revenue)} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`${cat.color} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Category Insights Footer */}
            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800/60 text-xs text-sky-800 dark:text-sky-300">
              <span className="font-bold block mb-0.5">
                💡 {language === 'ar' ? 'ملاحظة الأداء:' : 'Key Insight:'}
              </span>
              {categorySales.length > 0
                ? language === 'ar'
                  ? `قسم "${categorySales[0].name}" يتصدر المبيعات بنسبة ${categorySales[0].percentage}% من الإيرادات.`
                  : `"${categorySales[0].name}" leads with ${categorySales[0].percentage}% of total category revenue.`
                : language === 'ar'
                ? 'ستظهر تحليلات الأقسام تلقائياً عند تسجيل المبيعات.'
                : 'Category insights will appear automatically as sales are recorded.'}
            </div>
          </Card>
        </div>
      </div>

      {/* Secondary Row: 7-Day Velocity Chart & Live Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Daily Sales Velocity Chart (1 Column) */}
        <div className="lg:col-span-1">
          <Card className="p-5 space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {language === 'ar' ? 'حركة المبيعات اليومية' : 'Daily Sales Velocity'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {language === 'ar' ? 'مقارنة الأيام السبعة الأخيرة' : 'Last 7 days revenue comparison'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bar Histogram */}
              <div className="pt-6 flex items-end justify-between gap-2 h-44 px-1">
                {dailyTrend.map((d, i) => {
                  const heightPercent =
                    d.amount > 0 ? Math.max(12, Math.round((d.amount / maxDailyTrend) * 100)) : 4;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-[10px] font-bold text-slate-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatCurrency(d.amount)}
                      </span>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-28 flex items-end overflow-hidden">
                        <div
                          className="w-full bg-gradient-to-t from-sky-600 to-indigo-500 group-hover:from-emerald-500 group-hover:to-teal-400 transition-all rounded-t-lg"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {d.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
              <span>{language === 'ar' ? 'المتوسط اليومي (7 أيام)' : '7-Day Daily Avg'}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(
                  dailyTrend.length > 0
                    ? dailyTrend.reduce((sum, d) => sum + d.amount, 0) / dailyTrend.length
                    : 0,
                )}
              </span>
            </div>
          </Card>
        </div>

        {/* 2. Recent Sales & Invoices Live Feed (2 Columns) */}
        <div className="lg:col-span-2">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-500">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {language === 'ar' ? 'سجل الفواتير والمبيعات الأخيرة' : 'Recent Sales & Invoices'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'فواتير الكاشير الصادرة لحظياً' : 'Live record of completed customer receipts'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/pos/sales')}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-bold flex items-center space-x-1"
              >
                <span>{language === 'ar' ? 'عرض الكل' : 'View All'}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">{t('loading')}</div>
            ) : recentSales.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {language === 'ar' ? 'لا توجد فواتير مسجلة اليوم' : 'No sales orders recorded yet'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 px-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => navigate('/pos/sales')}
                  >
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 font-mono">
                          {sale.invoice_number}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {sale.created_at ? formatDateTime(sale.created_at) : '-'} • {sale.payment_method || 'Cash'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right rtl:text-left">
                      <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 font-mono block">
                        {formatCurrency(sale.grand_total || 0)}
                      </span>
                      <div className="mt-0.5">
                        <Badge variant="success">
                          {sale.payment_status || 'Paid'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;


