import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@stores/useAuthStore';
import { useLanguageStore } from '@stores/useLanguageStore';
import { Button } from '@components/ui/Button';
import { Lock, Eye, EyeOff, AlertTriangle, ShieldAlert } from 'lucide-react';

export interface AdminPasswordConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  warningText?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  extraContent?: React.ReactNode;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const AdminPasswordConfirmModal: React.FC<AdminPasswordConfirmModalProps> = ({
  isOpen,
  title,
  message,
  warningText,
  confirmLabel,
  isLoading = false,
  extraContent,
  onClose,
  onConfirm,
}) => {
  const { verifyManagerPassword, loadManagerPassword } = useAuthStore();
  const { language } = useLanguageStore();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = isLoading || isSubmitting;

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setError(null);
      setIsSubmitting(false);
      loadManagerPassword().catch(() => {});
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, loadManagerPassword]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, busy, onClose]);

  if (!isOpen) return null;

  const t = {
    adminPassLabel:
      language === 'ar'
        ? 'كلمة مرور المدير / المشرف *'
        : language === 'fr'
        ? 'Mot de passe Admin / Gérant *'
        : 'Admin / Manager Password *',
    adminPassPlaceholder:
      language === 'ar'
        ? 'أدخل كلمة مرور المدير للتأكيد...'
        : language === 'fr'
        ? 'Entrez le mot de passe gérant...'
        : 'Enter admin password to confirm...',
    emptyError:
      language === 'ar'
        ? 'يرجى إدخال كلمة مرور المدير.'
        : language === 'fr'
        ? 'Veuillez entrer le mot de passe gérant.'
        : 'Please enter the admin password.',
    invalidError:
      language === 'ar'
        ? 'كلمة مرور المدير غير صحيحة.'
        : language === 'fr'
        ? 'Mot de passe gérant incorrect.'
        : 'Incorrect admin password. Please try again.',
    cancel: language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel',
    defaultConfirm:
      language === 'ar' ? 'تأكيد الحذف' : language === 'fr' ? 'Confirmer la suppression' : 'Confirm Delete',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (!password.trim()) {
      setError(t.emptyError);
      return;
    }

    if (!verifyManagerPassword(password)) {
      setError(t.invalidError);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm();
    } catch (err) {
      setError((err as Error).message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-rose-50/70 dark:bg-rose-950/20">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold px-2 py-1 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{message}</p>

          {warningText && (
            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              {warningText}
            </p>
          )}

          {extraContent}

          {/* Admin Password Field */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 rtl:space-x-reverse">
              <Lock className="h-3.5 w-3.5 text-rose-500" />
              <span>{t.adminPassLabel}</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t.adminPassPlaceholder}
                disabled={busy}
                autoComplete="off"
                className="w-full px-3.5 py-2.5 pr-10 rtl:pr-3.5 rtl:pl-10 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800/50">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              {t.cancel}
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={busy}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {confirmLabel || t.defaultConfirm}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
