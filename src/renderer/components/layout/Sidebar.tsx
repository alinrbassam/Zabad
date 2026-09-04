import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  Truck,
  FolderTree,
  Sliders,
  History,
  Store,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  LogOut,
  Users,
  HandCoins,
  Receipt,
  BarChart2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { t, language } = useLanguageStore();
  const { pathname } = useLocation();
  const { logout, user, activeRoleMode, setRoleMode } = useAuthStore();

  const handleLogout = async () => {
    const msg = language === 'ar' ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to log out?';
    if (confirm(msg)) {
      await logout();
    }
  };

  const navSections = [
    {
      id: 'sell',
      label: language === 'ar' ? 'البيع (نقطة البيع)' : 'Sell (POS)',
      icon: ShoppingCart,
      color: 'text-sky-400',
      items: [
        {
          id: 'pos-terminal',
          label: language === 'ar' ? 'نقطة البيع (الكاشير)' : 'POS Checkout',
          icon: ShoppingCart,
          path: '/pos',
        },
        {
          id: 'pos-debts',
          label: language === 'ar' ? 'سجل الديون (الآجل)' : 'Customer Debts',
          icon: HandCoins,
          path: '/pos/debts',
        },
        {
          id: 'sales-history',
          label: language === 'ar' ? 'سجل المبيعات والفواتير' : 'Sales History',
          icon: History,
          path: '/pos/sales',
        },
      ],
    },
    {
      id: 'finance',
      label: language === 'ar' ? 'المالية والمصاريف' : 'Finance & Expenses',
      icon: Receipt,
      color: 'text-rose-400',
      items: [
        {
          id: 'expenses',
          label: language === 'ar' ? 'المصاريف التشغيلية' : 'Store Expenses',
          icon: Receipt,
          path: '/expenses',
        },
        {
          id: 'financial-report',
          label: language === 'ar' ? 'تقرير الأرباح والخسائر' : 'Financial P&L Report',
          icon: BarChart2,
          path: '/reports/financial',
        },
      ],
    },
    {
      id: 'buy',
      label: language === 'ar' ? 'الشراء (المشتريات)' : 'Buy (Purchases)',
      icon: Truck,
      color: 'text-emerald-400',
      items: [
        {
          id: 'direct-purchase',
          label: language === 'ar' ? 'شراء مباشر (إدخال بضاعة)' : 'Direct Purchase',
          icon: Store,
          path: '/purchasing/direct',
        },
        {
          id: 'purchase-orders',
          label: language === 'ar' ? 'فواتير وأوامر الشراء' : 'Purchase Orders',
          icon: Truck,
          path: '/purchasing/orders',
        },
        {
          id: 'purchasing-history',
          label: language === 'ar' ? 'سجل المشتريات' : 'Purchasing History',
          icon: History,
          path: '/purchasing/history',
        },
      ],
    },
    {
      id: 'inventory',
      label: language === 'ar' ? 'المخزون والمنتجات' : 'Inventory & Stock',
      icon: Package,
      color: 'text-amber-400',
      items: [
        {
          id: 'suppliers',
          label: language === 'ar' ? '1. الموردين (Suppliers)' : '1. Suppliers',
          icon: Users,
          path: '/inventory/suppliers',
        },
        {
          id: 'categories',
          label: language === 'ar' ? '2. الأقسام (Categories)' : '2. Categories',
          icon: FolderTree,
          path: '/inventory/categories',
        },
        {
          id: 'product-new',
          label: language === 'ar' ? '3. إضافة صنف جديد (Add Item)' : '3. Add New Item',
          icon: PlusCircle,
          path: '/inventory/products/new',
        },
        {
          id: 'products-list',
          label: language === 'ar' ? '4. المخزون والمنتجات (Inventory)' : '4. Products & Stock',
          icon: Package,
          path: '/inventory/products',
        },
        {
          id: 'adjustments',
          label: language === 'ar' ? '5. جرد وتسوية المخزون (Adjustments)' : '5. Stock Adjustments',
          icon: Sliders,
          path: '/inventory/adjustments',
        },
      ],
    },
  ];

  const visibleSections = navSections.filter((sec) => {
    if (activeRoleMode === 'cashier') {
      return sec.id === 'sell';
    }
    return true;
  });

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    sell: true,
    finance: true,
    buy: true,
    inventory: true,
  });

  // Auto-expand group containing the active path
  useEffect(() => {
    if (pathname.startsWith('/pos')) {
      setOpenGroups((prev) => ({ ...prev, sell: true }));
    } else if (pathname.startsWith('/expenses') || pathname.startsWith('/reports/financial')) {
      setOpenGroups((prev) => ({ ...prev, finance: true }));
    } else if (pathname.startsWith('/purchasing')) {
      setOpenGroups((prev) => ({ ...prev, buy: true }));
    } else if (pathname.startsWith('/inventory')) {
      setOpenGroups((prev) => ({ ...prev, inventory: true }));
    }
  }, [pathname]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <aside className="w-64 bg-[#0B1120] text-slate-300 flex flex-col h-screen border-r border-slate-800/80 select-none">
      {/* App Branding */}
      <div className="p-4 border-b border-slate-800/80 flex items-center space-x-3 rtl:space-x-reverse bg-[#080d19]">
        <div className="h-10 w-10 bg-gradient-to-tr from-sky-500 via-cyan-500 to-blue-600 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-cyan-500/25">
          🐟
        </div>
        <div>
          <h2 className="text-base font-black text-white tracking-wide flex items-center space-x-1 rtl:space-x-reverse">
            <span>{language === 'ar' ? 'نظام زَبَد' : 'Zabad POS'}</span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-400 font-mono px-1.5 py-0.2 rounded">v2</span>
          </h2>
          <span className="text-[11px] text-cyan-400/90 font-medium block">
            {activeRoleMode === 'cashier'
              ? language === 'ar'
                ? 'وضع الكاشير (بيع فقط)'
                : 'Cashier Mode (Sales Only)'
              : language === 'ar'
              ? 'وضع المدير (إدارة كاملة)'
              : 'Manager Mode (Full Access)'}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {/* 1. Main Dashboard Link (Manager Only) */}
        {activeRoleMode !== 'cashier' && (
          <>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center space-x-3 rtl:space-x-reverse px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-500/25 border border-sky-400/30'
                    : 'hover:bg-slate-800/70 text-slate-300'
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4 text-cyan-400" />
              <span>{t('overview')}</span>
            </NavLink>

            <div className="border-b border-slate-800/60 my-2" />
          </>
        )}

        {/* 2. Grouped Modules (Sell, and Buy/Inventory if Manager) */}
        {visibleSections.map((sec) => {
          const SectionIcon = sec.icon;
          const isOpen = openGroups[sec.id];

          return (
            <div key={sec.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(sec.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-800/60 text-slate-300 transition-colors"
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <SectionIcon className={`h-4 w-4 ${sec.color}`} />
                  <span className="text-xs font-semibold">{sec.label}</span>
                </div>
                {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500 rtl:rotate-180" />}
              </button>

              {isOpen && (
                <div className="pl-4 rtl:pl-0 rtl:pr-4 space-y-1 border-l rtl:border-l-0 rtl:border-r border-slate-800/70 ml-4 rtl:ml-0 rtl:mr-4">
                  {sec.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <NavLink
                        key={item.id}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center space-x-2.5 rtl:space-x-reverse px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30 shadow-xs'
                              : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                          }`
                        }
                      >
                        <ItemIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {activeRoleMode === 'manager' && (
          <>
            <div className="border-b border-slate-800 my-2" />
            {/* 3. Settings Link */}
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center space-x-3 rtl:space-x-reverse px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'hover:bg-slate-800 text-slate-300'
                }`
              }
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>{t('settings')}</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Role Switcher & User Profile */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {/* Quick Role Switcher Button */}
        <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 pl-1 rtl:pl-0 rtl:pr-1">
            {language === 'ar' ? 'الوضع:' : 'Mode:'}
          </span>
          <button
            onClick={() => setRoleMode(activeRoleMode === 'cashier' ? 'manager' : 'cashier')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              activeRoleMode === 'cashier'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-emerald-600 text-white shadow-xs'
            }`}
          >
            {activeRoleMode === 'cashier'
              ? language === 'ar'
                ? '🛒 كاشير (تبديل للمدير)'
                : '🛒 Cashier (Switch)'
              : language === 'ar'
              ? '👑 مدير (تبديل للكاشير)'
              : '👑 Manager (Switch)'}
          </button>
        </div>

        {user && (
          <div className="px-2 py-1 flex items-center justify-between text-xs text-slate-400">
            <span className="truncate font-semibold text-slate-300">
              {user.full_name || user.username}
            </span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-sky-400 uppercase">
              {activeRoleMode}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;


