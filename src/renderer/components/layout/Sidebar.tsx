import React from 'react';
import { NavLink } from 'react-router-dom';
import { moduleRegistry } from '@modules/registry';
import { useLanguageStore } from '../../stores/useLanguageStore';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  HelpCircle,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Dashboard: LayoutDashboard,
  Package: Package,
  ShoppingCart: ShoppingCart,
  BarChart3: BarChart3,
  Settings: Settings,
  Info: HelpCircle,
};

export const Sidebar: React.FC = () => {
  const sidebarItems = moduleRegistry.getAllSidebarItems();
  const { t } = useLanguageStore();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 select-none">
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
        <div className="h-9 w-9 bg-sky-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">
          RMS
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide">RMS Enterprise</h2>
          <span className="text-[10px] text-sky-400 font-medium">v1.0.0 Architecture</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              isActive ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`
          }
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>{t('dashboard')}</span>
        </NavLink>

        {sidebarItems.map((item) => {
          const IconComponent = iconMap[item.icon] || HelpCircle;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`
              }
            >
              <IconComponent className="h-4 w-4" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
        Offline First Desktop Core
      </div>
    </aside>
  );
};
