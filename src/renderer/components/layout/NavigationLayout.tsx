import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Breadcrumbs } from './Breadcrumbs';

export const NavigationLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isPos = location.pathname === '/pos';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        {!isPos && <Breadcrumbs />}
        <main className={`flex-1 ${isPos ? 'p-2 md:p-2.5 overflow-hidden flex flex-col' : 'p-6 overflow-y-auto'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};
