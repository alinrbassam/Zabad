import React from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const typeStyles = {
    info: 'bg-slate-900 text-white',
    success: 'bg-emerald-600 text-white',
    warning: 'bg-amber-600 text-white',
    error: 'bg-rose-600 text-white',
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center justify-between px-4 py-3 rounded-lg shadow-xl text-xs max-w-sm ${typeStyles[type]}`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-75 focus:outline-none">
        ✕
      </button>
    </div>
  );
};
