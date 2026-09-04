import React, { useState } from 'react';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { useLanguageStore } from '../../../renderer/stores/useLanguageStore';
import {
  FileCode,
  CheckCircle2,
  ShoppingCart,
  Truck,
  Package,
  Sparkles,
  Search,
} from 'lucide-react';

interface FileChange {
  file: string;
  category: 'Navigation & Layout' | 'Dashboard' | 'POS & Sales' | 'Purchasing' | 'Inventory' | 'Settings & i18n';
  action: 'Created' | 'Modified' | 'Optimized';
  description: string;
  descriptionAr: string;
}

export const AboutSettings: React.FC = () => {
  const { language } = useLanguageStore();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const changesList: FileChange[] = [
    {
      file: 'src/renderer/pages/DashboardPage.tsx',
      category: 'Dashboard',
      action: 'Optimized',
      description:
        'Transformed dashboard into a store-owner overview with 3 Quick Launchers (Sell, Buy, Add Product), real-time daily KPI counters, and live sales/purchases tables.',
      descriptionAr:
        'تحويل لوحة التحكم إلى نظرة عامة سريعة للمتجر مع 3 أزرار إطلاق سريعة (بيع، شراء، إضافة منتج)، وعدادات إحصائيات يومية وجداول المبيعات والمشتريات الحية.',
    },
    {
      file: 'src/renderer/components/layout/Sidebar.tsx',
      category: 'Navigation & Layout',
      action: 'Optimized',
      description:
        'Streamlined sidebar navigation into 4 clean sections (Overview, Sell, Buy, Inventory, Settings) and removed complex enterprise admin noise (audit logs, RBAC matrices, diagnostics).',
      descriptionAr:
        'تبسيط القائمة الجانبية إلى 4 أقسام واضحة (نظرة عامة، بيع، شراء، مخزون، إعدادات) وإخفاء التعقيدات الإدارية (سجلات التدقيق، مصفوفة الصلاحيات، التشخيصات).',
    },
    {
      file: 'src/renderer/components/layout/TopBar.tsx',
      category: 'Navigation & Layout',
      action: 'Optimized',
      description:
        'Enhanced header styling with RTL support, quick language toggle (Arabic/English), and theme switcher.',
      descriptionAr:
        'تحسين ترويسة التطبيق مع دعم التنسيق العربي (RTL)، زر التبديل الفوري للغة والسمة الليلية/النهارية.',
    },
    {
      file: 'src/renderer/App.tsx',
      category: 'Navigation & Layout',
      action: 'Modified',
      description:
        'Updated routing to land directly on the simplified Store Overview dashboard at "/" with seamless fallbacks.',
      descriptionAr:
        'تحديث نظام التوجيه ليفتح مباشرة على لوحة النظرة العامة للمتجر مع توجيه تلقائي وسلس.',
    },
    {
      file: 'src/modules/settings/SettingsContainerPage.tsx',
      category: 'Settings & i18n',
      action: 'Optimized',
      description:
        'Restructured settings suite into practical store configurations (Business Profile, Currency, Tax, Receipts, Printer, Appearance, Backup, and Changes Log).',
      descriptionAr:
        'إعادة هيكلة الإعدادات للتركيز على الإعدادات اليومية للمتجر (بيانات المتجر، العملة، الضريبة، الفواتير، الطابعة، النسخ الاحتياطي، وسجل التعديلات).',
    },
    {
      file: 'src/renderer/translations/ar.json & en.json',
      category: 'Settings & i18n',
      action: 'Modified',
      description:
        'Added comprehensive Arabic and English translations for simplified store operations, action hubs, and KPI metrics.',
      descriptionAr:
        'إضافة نصوص وترجمات كاملة باللغتين العربية والإنجليزية لجميع عمليات المتجر المبسطة والإحصائيات.',
    },
    {
      file: 'src/modules/pos/POSTerminalPage.tsx & ThermalReceiptModal.tsx',
      category: 'POS & Sales',
      action: 'Optimized',
      description:
        'Tailored POS terminal for Fish & Seafood retail: visual seafood catalog, decimal weight presets (+0.25, +0.5, +1.0 Kg), custom fresh fish entries (+ Custom Item), and clean receipts without QR code requirements.',
      descriptionAr:
        'تخصيص نقطة البيع لمتجر أسماك ومأكولات بحرية: دليل مصور للأسماك، دعم الوزن العشري بالكيلو، إضافة صنف طازج سريع بالوزن، وإيصالات حرارية نظيفة بدون رموز QR.',
    },
    {
      file: 'src/renderer/components/layout/Sidebar.tsx & TopBar.tsx',
      category: 'Navigation & Layout',
      action: 'Optimized',
      description:
        'Implemented Role Separation: Cashier mode (sells only, purchasing and inventory hidden) vs. Manager mode (full purchasing, supplier invoices, inventory, and settings) with instant 1-click switcher.',
      descriptionAr:
        'تطبيق فصل الصلاحيات: وضع الكاشير (بيع فقط وإخفاء المشتريات والمخزون) مقابل وضع المدير (إدارة المشتريات والمخزون بالكامل) مع زر تبديل فوري.',
    },
    {
      file: 'src/modules/purchasing/DirectPurchasePage.tsx & PurchasingHistoryPage.tsx',
      category: 'Purchasing',
      action: 'Optimized',
      description:
        'Dedicated purchasing suite for the manager to record incoming seafood supplier deliveries and immediately increment inventory stock.',
      descriptionAr:
        'قسم المشتريات المخصص للمدير لتسجيل فواتير توريد الأسماك من الموردين وزيادة المخزون فوراً.',
    },
    {
      file: 'src/modules/inventory/ProductsPage.tsx & ProductFormPage.tsx',
      category: 'Inventory',
      action: 'Optimized',
      description:
        'Enhanced product catalog with instant search, seafood categories, weight tracking per Kg, cost vs. selling price, and stock adjustments.',
      descriptionAr:
        'تحسين دليل المنتجات بالبحث الفوري، تصنيفات الأسماك، دعم البيع بالكيلو والقطعة، حساب هامش الربح، وتسويات المخزون.',
    },
  ];

  const filteredChanges = changesList.filter((item) => {
    const matchesCategory = filter === 'all' || item.category === filter;
    const matchesSearch =
      item.file.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.descriptionAr.includes(search);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 p-5 text-white shadow-md">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {language === 'ar' ? 'سجل التعديلات والتحديثات' : 'System Changes & Updates Log'}
            </h2>
            <p className="text-xs text-sky-100">
              {language === 'ar'
                ? 'ملخص كامل لجميع التعديلات والتحسينات التي تمت لتبسيط النظام لمتجرك'
                : 'Detailed record of all system simplifications and architecture enhancements made to your store'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-t-4 border-t-sky-500">
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
            <ShoppingCart className="h-4 w-4 text-sky-500" />
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
              {language === 'ar' ? '١. البيع السريع (الكاشير)' : '1. Fast Selling (POS)'}
            </h4>
          </div>
          <p className="text-[11px] text-slate-500">
            {language === 'ar'
              ? 'كاشير فوري مع مسح الباركود، تعدد وسائل الدفع، وتعليق الفواتير واسترجاعها.'
              : 'Instant barcode checkout, split payments, suspended sales, and thermal receipts.'}
          </p>
        </Card>

        <Card className="border-t-4 border-t-emerald-500">
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
            <Truck className="h-4 w-4 text-emerald-500" />
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
              {language === 'ar' ? '٢. الشراء المباشر' : '2. Direct Purchasing'}
            </h4>
          </div>
          <p className="text-[11px] text-slate-500">
            {language === 'ar'
              ? 'إدخال فواتير المشتريات وزيادة رصيد المنتجات بالمخزن فور الحفظ.'
              : 'Direct vendor purchase entries that immediately increment inventory balance.'}
          </p>
        </Card>

        <Card className="border-t-4 border-t-amber-500">
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
            <Package className="h-4 w-4 text-amber-500" />
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
              {language === 'ar' ? '٣. دليل المخزون المبسط' : '3. Simple Inventory'}
            </h4>
          </div>
          <p className="text-[11px] text-slate-500">
            {language === 'ar'
              ? 'سجل المنتجات بالباركود، التكلفة، سعر البيع، تنبيهات نقص المخزون والتسويات.'
              : 'Products master with barcode, cost, selling price, low-stock alerts, and adjustments.'}
          </p>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse overflow-x-auto w-full sm:w-auto">
          {['all', 'Dashboard', 'POS & Sales', 'Purchasing', 'Inventory', 'Navigation & Layout', 'Settings & i18n'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === cat
                    ? 'bg-sky-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? (language === 'ar' ? 'الكل' : 'All') : cat}
              </button>
            ),
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'ar' ? 'بحث في التعديلات...' : 'Search changes...'}
            className="w-full pl-8 rtl:pl-3 rtl:pr-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Detailed File Changes List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
          <span>{language === 'ar' ? 'الملفات والمكونات المعدلة' : 'Modified Files & Components'}</span>
          <Badge variant="info">
            {filteredChanges.length} {language === 'ar' ? 'عنصر' : 'items'}
          </Badge>
        </div>

        <div className="space-y-2.5">
          {filteredChanges.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 transition-colors shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                  <FileCode className="h-4 w-4 flex-shrink-0" />
                  <span className="break-all">{item.file}</span>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Badge variant="neutral">{item.category}</Badge>
                  <Badge variant="success">
                    <CheckCircle2 className="h-3 w-3 mr-1 rtl:mr-0 rtl:ml-1 inline" />
                    {item.action}
                  </Badge>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'ar' ? item.descriptionAr : item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* System Environment Info */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="block font-bold text-slate-800 dark:text-slate-200">
              {language === 'ar' ? 'إصدار التطبيق' : 'App Version'}
            </span>
            <span>v1.1.0 (Streamlined)</span>
          </div>
          <div>
            <span className="block font-bold text-slate-800 dark:text-slate-200">
              {language === 'ar' ? 'محرك البيانات' : 'Database'}
            </span>
            <span>SQLite Offline</span>
          </div>
          <div>
            <span className="block font-bold text-slate-800 dark:text-slate-200">
              {language === 'ar' ? 'واجهة المستخدم' : 'UI Framework'}
            </span>
            <span>React 18 + Tailwind</span>
          </div>
          <div>
            <span className="block font-bold text-slate-800 dark:text-slate-200">
              {language === 'ar' ? 'الحالة' : 'Status'}
            </span>
            <span className="text-emerald-600 font-semibold">Active & Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AboutSettings;

