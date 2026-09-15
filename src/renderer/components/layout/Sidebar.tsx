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
  ChevronLeft,
  LogOut,
  Users,
  HandCoins,
  Receipt,
  BarChart2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { t, language } = useLanguageStore();
  const { pathname } = useLocation();
  const { logout, user, activeRoleMode, setRoleMode, setManagerUnlockModalOpen } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('zabad_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' && window.innerWidth <= 1280;
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zabad_sidebar_collapsed', String(next));
      } catch {
        // fallback
      }
      return next;
    });
  };

  const getLabel = (ar: string, en: string, fr: string) => {
    if (language === 'ar') return ar;
    if (language === 'fr') return fr;
    return en;
  };

  const handleRoleSwitch = () => {
    if (activeRoleMode === 'cashier') {
      setManagerUnlockModalOpen(true);
    } else {
      setRoleMode('cashier');
    }
  };

  const handleLogout = async () => {
    if (activeRoleMode === 'manager') {
      setRoleMode('cashier');
    } else {
      await logout();
    }
  };

  const navSections = [
    {
      id: 'sell',
      label: getLabel('البيع (نقطة البيع)', 'Sell (POS)', 'Vente (Caisse)'),
      icon: ShoppingCart,
      color: 'text-sky-400',
      items: [
        {
          id: 'pos-terminal',
          label: getLabel('نقطة البيع (الكاشير)', 'POS Checkout', 'Caisse Enregistreuse'),
          icon: ShoppingCart,
          path: '/pos',
        },
        {
          id: 'pos-debts',
          label: getLabel('سجل الديون (الآجل)', 'Customer Debts', 'Dettes Clients (Crédit)'),
          icon: HandCoins,
          path: '/pos/debts',
        },
        {
          id: 'sales-history',
          label: getLabel('سجل المبيعات والفواتير', 'Sales History', 'Historique des Ventes'),
          icon: History,
          path: '/pos/sales',
        },
      ],
    },
    {
      id: 'finance',
      label: getLabel('المالية والمصاريف', 'Finance & Expenses', 'Finances & Dépenses'),
      icon: Receipt,
      color: 'text-rose-400',
      items: [
        {
          id: 'expenses',
          label: getLabel('المصاريف التشغيلية', 'Store Expenses', 'Dépenses du Magasin'),
          icon: Receipt,
          path: '/expenses',
        },
        {
          id: 'financial-report',
          label: getLabel('تقرير الأرباح والخسائر', 'Financial P&L Report', 'Rapport Financier P&L'),
          icon: BarChart2,
          path: '/reports/financial',
        },
      ],
    },
    {
      id: 'buy',
      label: getLabel('الشراء (المشتريات)', 'Buy (Purchases)', 'Achats & Approvisionnement'),
      icon: Truck,
      color: 'text-emerald-400',
      items: [
        {
          id: 'direct-purchase',
          label: getLabel('شراء مباشر (إدخال بضاعة)', 'Direct Purchase', 'Achat Direct / Entrée'),
          icon: Store,
          path: '/purchasing/direct',
        },
        {
          id: 'purchase-orders',
          label: getLabel('فواتير وأوامر الشراء', 'Purchase Orders', 'Bons de Commande'),
          icon: Truck,
          path: '/purchasing/orders',
        },
        {
          id: 'purchasing-history',
          label: getLabel('سجل المشتريات', 'Purchasing History', 'Historique des Achats'),
          icon: History,
          path: '/purchasing/history',
        },
      ],
    },
    {
      id: 'inventory',
      label: getLabel('المخزون والمنتجات', 'Inventory & Stock', 'Stock & Produits'),
      icon: Package,
      color: 'text-amber-400',
      items: [
        {
          id: 'suppliers',
          label: getLabel('1. الموردين (Suppliers)', '1. Suppliers', '1. Fournisseurs'),
          icon: Users,
          path: '/inventory/suppliers',
        },
        {
          id: 'categories',
          label: getLabel('2. الأقسام (Categories)', '2. Categories', '2. Catégories'),
          icon: FolderTree,
          path: '/inventory/categories',
        },
        {
          id: 'product-new',
          label: getLabel('3. إضافة صنف جديد (Add Item)', '3. Add New Item', '3. Ajouter un Produit'),
          icon: PlusCircle,
          path: '/inventory/products/new',
        },
        {
          id: 'products-list',
          label: getLabel('4. المخزون والمنتجات (Inventory)', '4. Products & Stock', '4. Produits & Stock'),
          icon: Package,
          path: '/inventory/products',
        },
        {
          id: 'adjustments',
          label: getLabel('5. جرد وتسوية المخزون (Adjustments)', '5. Stock Adjustments', '5. Ajustements de Stock'),
          icon: Sliders,
          path: '/inventory/adjustments',
        },
      ],
    },
  ];

  const visibleSections = navSections
    .filter((sec) => {
      if (activeRoleMode === 'cashier') {
        return sec.id === 'sell';
      }
      return true;
    })
    .map((sec) => {
      if (activeRoleMode === 'cashier') {
        return {
          ...sec,
          items: sec.items.filter((item) => item.id !== 'sales-history'),
        };
      }
      return sec;
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
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } bg-[#0B1120] text-slate-300 flex flex-col h-screen border-r border-slate-800/80 select-none transition-all duration-300 shrink-0`}
    >
      {/* App Branding & Collapse Toggle */}
      <div
        className={`p-3 border-b border-slate-800/80 flex items-center ${
          isCollapsed ? 'flex-col gap-2 justify-center' : 'justify-between'
        } bg-[#080d19]`}
      >
        <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
          <div className="h-9 w-9 bg-gradient-to-tr from-sky-500 via-cyan-500 to-blue-600 rounded-xl flex items-center justify-center font-black text-white text-base shadow-md shadow-cyan-500/25 shrink-0">
            K
          </div>
          {!isCollapsed && (
            <div className="min-w-0 truncate">
              <h2 className="text-sm font-black text-white tracking-wide flex items-center space-x-1 rtl:space-x-reverse">
                <span>{language === 'ar' ? 'نظام خليل' : 'Khalil POS'}</span>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-400 font-mono px-1 py-0.2 rounded">v2</span>
              </h2>
              <span className="text-[10px] text-cyan-400/90 font-medium truncate block">
                {activeRoleMode === 'cashier'
                  ? getLabel('الكاشير (بيع فقط)', 'Cashier', 'Caisse')
                  : getLabel('المدير', 'Manager', 'Gérant')}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={toggleCollapse}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors shrink-0"
          title={isCollapsed ? 'Développer la barre latérale' : 'Réduire la barre latérale'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          ) : (
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-2.5 space-y-2 overflow-y-auto">
        {/* 1. Main Dashboard Link (Manager Only) */}
        {activeRoleMode !== 'cashier' && (
          <>
            <NavLink
              to="/"
              end
              title={t('overview')}
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'space-x-3 rtl:space-x-reverse px-3.5 py-2.5'
                } rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-500/25 border border-sky-400/30'
                    : 'hover:bg-slate-800/70 text-slate-300'
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4 text-cyan-400 shrink-0" />
              {!isCollapsed && <span>{t('overview')}</span>}
            </NavLink>

            <div className="border-b border-slate-800/60 my-2" />
          </>
        )}

        {/* 2. Grouped Modules */}
        {visibleSections.map((sec) => {
          const SectionIcon = sec.icon;
          const isOpen = openGroups[sec.id];

          if (isCollapsed) {
            return (
              <div key={sec.id} className="space-y-1 py-1 border-b border-slate-800/40">
                {sec.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      title={item.label}
                      className={({ isActive }) =>
                        `flex items-center justify-center p-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30 shadow-xs'
                            : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                        }`
                      }
                    >
                      <ItemIcon className="h-4 w-4 shrink-0" />
                    </NavLink>
                  );
                })}
              </div>
            );
          }

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
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500 rtl:rotate-180" />
                )}
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
            <NavLink
              to="/settings"
              title={t('settings')}
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'space-x-3 rtl:space-x-reverse px-3 py-2.5'
                } rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'hover:bg-slate-800 text-slate-300'
                }`
              }
            >
              <Settings className="h-4 w-4 text-slate-400 shrink-0" />
              {!isCollapsed && <span>{t('settings')}</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* Role Switcher & User Profile */}
      <div className="p-2.5 border-t border-slate-800 space-y-2">
        {/* Quick Role Switcher Button */}
        {!isCollapsed ? (
          <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 pl-1 rtl:pl-0 rtl:pr-1">
              {getLabel('الوضع:', 'Mode:', 'Mode :')}
            </span>
            <button
              onClick={handleRoleSwitch}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeRoleMode === 'cashier'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-emerald-600 text-white shadow-xs'
              }`}
            >
              {activeRoleMode === 'cashier'
                ? getLabel('🛒 كاشير (تبديل للمدير)', '🛒 Cashier (Switch)', '🛒 Caisse (Changer)')
                : getLabel('👑 مدير (تبديل للكاشير)', '👑 Manager (Switch)', '👑 Gérant (Changer)')}
            </button>
          </div>
        ) : (
          <button
            onClick={handleRoleSwitch}
            className={`w-full p-2 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
              activeRoleMode === 'cashier'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-emerald-600 text-white shadow-xs'
            }`}
            title={activeRoleMode === 'cashier' ? 'Passer en Mode Gérant' : 'Passer en Mode Caisse'}
          >
            {activeRoleMode === 'cashier' ? '🛒' : '👑'}
          </button>
        )}

        {user && !isCollapsed && (
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
          className={`w-full flex items-center justify-center ${
            isCollapsed ? 'p-2' : 'space-x-2 rtl:space-x-reverse px-3 py-2'
          } rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors`}
          title={
            activeRoleMode === 'manager'
              ? getLabel('قفل والرجوع للكاشير', 'Lock to Cashier', 'Verrouiller en Caisse')
              : getLabel('إعادة ضبط الكاشير', 'Reset Cashier Session', 'Réinitialiser la Caisse')
          }
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!isCollapsed && (
            <span>
              {activeRoleMode === 'manager'
                ? getLabel('قفل والرجوع للكاشير', 'Lock to Cashier', 'Verrouiller en Caisse')
                : getLabel('إعادة ضبط الكاشير', 'Reset Cashier Session', 'Réinitialiser la Caisse')}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;


