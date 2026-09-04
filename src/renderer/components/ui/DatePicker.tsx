import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface DatePickerProps {
  label?: string;
  value?: string; // 'YYYY-MM-DD'
  onChange: (val: string) => void; // 'YYYY-MM-DD'
  error?: string;
  required?: boolean;
  className?: string;
  id?: string;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  required,
  className,
  id,
  placeholder = 'DD-MM-YYYY',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current YYYY-MM-DD
  const parseDate = (valStr?: string) => {
    if (!valStr) return null;
    const parts = valStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      if (!isNaN(date.getTime())) return date;
    }
    return null;
  };

  const selectedDate = parseDate(value);
  const today = new Date();

  const [viewYear, setViewYear] = useState(selectedDate ? selectedDate.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate ? selectedDate.getMonth() : today.getMonth());

  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [value]);

  // Display strictly formatted as DD-MM-YYYY
  const displayFormatted = selectedDate
    ? `${String(selectedDate.getDate()).padStart(2, '0')}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${selectedDate.getFullYear()}`
    : '';

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const y = viewYear;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0: Sun ... 6: Sat

  return (
    <div ref={containerRef} className={twMerge('relative flex flex-col space-y-1 w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={twMerge(
          clsx(
            'flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg cursor-pointer transition-all select-none',
            error
              ? 'border-red-500 focus:ring-red-400'
              : isOpen
              ? 'border-sky-500 ring-2 ring-sky-500/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400',
          ),
        )}
      >
        <span className={clsx('font-mono font-medium', !displayFormatted && 'text-slate-400')}>
          {displayFormatted || placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 text-slate-400 hover:text-sky-500 transition-colors" />
      </div>

      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}

      {/* Dropdown Calendar Popup */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1.5 left-0 w-72 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedDate &&
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === day;
              const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={twMerge(
                    clsx(
                      'h-7 w-7 rounded-lg text-xs font-medium flex items-center justify-center transition-colors',
                      isSelected
                        ? 'bg-sky-600 text-white font-bold'
                        : isToday
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                    ),
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer with Today / Clear buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            {!required && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-rose-500 font-semibold"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleToday}
              className="text-sky-600 dark:text-sky-400 hover:underline font-bold ml-auto"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
