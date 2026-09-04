import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { KeyRound, Eye, EyeOff, X, Lock, CheckCircle2, AlertTriangle, Delete } from 'lucide-react';

export const ManagerPasswordModal: React.FC = () => {
  const {
    isManagerUnlockModalOpen,
    setManagerUnlockModalOpen,
    setRoleMode,
    verifyManagerPassword,
    resetManagerPasswordWithMasterKey,
  } = useAuthStore();
  const { language } = useLanguageStore();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isManagerUnlockModalOpen) {
      setPassword('');
      setRecoveryKey('');
      setError(null);
      setSuccessMsg(null);
      setIsForgotMode(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isManagerUnlockModalOpen]);

  if (!isManagerUnlockModalOpen) return null;

  const t = {
    title: language === 'ar' ? 'دخول وضع المدير' : language === 'fr' ? 'Accès Mode Gérant' : 'Manager Mode Access',
    subtitle:
      language === 'ar'
        ? 'أدخل كلمة مرور المدير لفتح الميزات الإدارية والتقارير'
        : language === 'fr'
        ? 'Entrez le mot de passe gérant pour débloquer les fonctions administratives'
        : 'Enter the manager password to unlock administrative and financial features',
    passwordPlaceholder:
      language === 'ar' ? 'كلمة مرور المدير...' : language === 'fr' ? 'Mot de passe gérant...' : 'Manager password...',
    unlockBtn: language === 'ar' ? 'فتح وضع المدير' : language === 'fr' ? 'Déverrouiller' : 'Unlock Manager',
    cancelBtn: language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel',
    forgotBtn:
      language === 'ar'
        ? 'نسيت كلمة المرور؟'
        : language === 'fr'
        ? 'Mot de passe oublié ?'
        : 'Forgot Password?',
    invalidPass:
      language === 'ar'
        ? 'كلمة المرور غير صحيحة. حاول مجدداً.'
        : language === 'fr'
        ? 'Mot de passe incorrect. Réessayez.'
        : 'Incorrect manager password. Try again.',
    forgotTitle:
      language === 'ar'
        ? 'استرداد كلمة مرور المدير'
        : language === 'fr'
        ? 'Récupération du Mot de Passe'
        : 'Manager Password Recovery',
    forgotSubtitle:
      language === 'ar'
        ? 'أدخل مفتاح الاسترداد الرئيسي لإعادة تعيين كلمة المرور إلى 1234'
        : language === 'fr'
        ? 'Entrez la Clé Maître de Récupération pour réinitialiser à 1234'
        : 'Enter the Master Recovery Key to reset the manager password to 1234',
    recoveryPlaceholder:
      language === 'ar' ? 'مفتاح الاسترداد...' : language === 'fr' ? 'Clé de récupération...' : 'Master recovery key...',
    resetBtn: language === 'ar' ? 'إعادة تعيين وفتح' : language === 'fr' ? 'Réinitialiser & Ouvrir' : 'Reset & Unlock',
    backBtn: language === 'ar' ? 'الرجوع' : language === 'fr' ? 'Retour' : 'Back',
    invalidMasterKey:
      language === 'ar'
        ? 'مفتاح الاسترداد غير صحيح.'
        : language === 'fr'
        ? 'Clé de récupération incorrecte.'
        : 'Invalid master recovery key.',
    resetSuccess:
      language === 'ar'
        ? 'تمت إعادة تعيين كلمة المرور إلى 1234 بنجاح!'
        : language === 'fr'
        ? 'Mot de passe réinitialisé à 1234 avec succès !'
        : 'Manager password reset to 1234 successfully!',
  };

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (verifyManagerPassword(password)) {
      setRoleMode('manager');
      setManagerUnlockModalOpen(false);
    } else {
      setError(t.invalidPass);
    }
  };

  const handleRecovery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const success = await resetManagerPasswordWithMasterKey(recoveryKey);
    if (success) {
      setSuccessMsg(t.resetSuccess);
      setTimeout(() => {
        setRoleMode('manager');
        setManagerUnlockModalOpen(false);
      }, 1000);
    } else {
      setError(t.invalidMasterKey);
    }
  };

  const handlePadPress = (val: string) => {
    setError(null);
    if (isForgotMode) {
      setRecoveryKey((prev) => prev + val);
    } else {
      setPassword((prev) => prev + val);
    }
  };

  const handlePadBackspace = () => {
    if (isForgotMode) {
      setRecoveryKey((prev) => prev.slice(0, -1));
    } else {
      setPassword((prev) => prev.slice(0, -1));
    }
  };

  const handlePadClear = () => {
    if (isForgotMode) {
      setRecoveryKey('');
    } else {
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-transparent">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              {isForgotMode ? <KeyRound className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isForgotMode ? t.forgotTitle : t.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isForgotMode ? t.forgotSubtitle : t.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => setManagerUnlockModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-900/50">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/50">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isForgotMode ? (
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-center text-lg font-bold tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Touch Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handlePadPress(digit)}
                    className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-base font-bold text-slate-800 dark:text-slate-200 transition-all shadow-xs"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handlePadClear}
                  className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 text-xs font-bold text-slate-500 transition-all"
                >
                  C
                </button>
                <button
                  type="button"
                  onClick={() => handlePadPress('0')}
                  className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-base font-bold text-slate-800 dark:text-slate-200 transition-all shadow-xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handlePadBackspace}
                  className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"
                >
                  <Delete className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(true);
                    setError(null);
                  }}
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  {t.forgotBtn}
                </button>
                <span className="text-[10px] text-slate-400 font-mono">Défaut: 1234</span>
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => setManagerUnlockModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-xs font-bold text-white shadow-md shadow-sky-600/25 transition-all"
                >
                  {t.unlockBtn}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRecovery} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                  placeholder={t.recoveryPlaceholder}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-center text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  autoFocus
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {language === 'ar'
                  ? 'مفتاح الاسترداد الرئيسي: 998822 أو مفتاح مزامنة السحابة الخاص بالمتجر.'
                  : language === 'fr'
                  ? 'Clé de récupération : 998822 ou votre Clé Secrète de synchronisation.'
                  : 'Master recovery key: 998822 or your store cloud sync secret key.'}
              </p>

              <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(false);
                    setError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {t.backBtn}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white shadow-md shadow-emerald-600/25 transition-all"
                >
                  {t.resetBtn}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
