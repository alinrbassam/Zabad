import React, { useState } from 'react';
import { User, Shield } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
      >
        <div className="h-7 w-7 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 font-semibold text-xs">
          AD
        </div>
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Administrator
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 z-50">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <User className="h-5 w-5 text-sky-600" />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">System Admin</p>
              <p className="text-[10px] text-slate-500">admin@rms-enterprise.local</p>
            </div>
          </div>
          <div className="pt-2">
            <span className="flex items-center space-x-2 text-[11px] text-slate-600 dark:text-slate-300 py-1.5 px-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span>Full Access Level</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
