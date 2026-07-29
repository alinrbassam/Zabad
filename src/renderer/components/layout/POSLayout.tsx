import React from 'react';

export const POSLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="h-screen w-screen bg-slate-900 text-slate-100 flex flex-col overflow-hidden">
      <header className="h-12 bg-slate-950 px-4 flex items-center justify-between border-b border-slate-800">
        <span className="font-bold text-sm text-sky-400">RMS POS Checkout Interface</span>
        <span className="text-xs text-slate-400">Offline Standalone Mode</span>
      </header>
      <main className="flex-1 overflow-hidden p-4">{children}</main>
    </div>
  );
};
