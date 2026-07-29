import React, { useState } from 'react';
import { Bell } from 'lucide-react';

export const Notifications: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-sky-500 rounded-full animate-pulse" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 z-50">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
            Notifications
          </h4>
          <div className="text-[11px] text-slate-500 p-2 text-center bg-slate-50 dark:bg-slate-900/50 rounded-md">
            System initialization complete. No pending alerts.
          </div>
        </div>
      )}
    </div>
  );
};
