import React, { useState, useEffect } from 'react';
import { useAuthStore, DEFAULT_MANAGER_PASSWORD } from '../../../renderer/stores/useAuthStore';
import { useLanguageStore } from '../../../renderer/stores/useLanguageStore';
import { ShieldCheck, Key, CheckCircle2, AlertCircle, Eye, EyeOff, Info } from 'lucide-react';

export const SecuritySettings: React.FC = () => {
  const { language } = useLanguageStore();
  const { managerPassword, loadManagerPassword, updateManagerPassword } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadManagerPassword();
  }, [loadManagerPassword]);

  const t = {
    title:
      language === 'ar'
        ? 'كلمة مرور المدير والأمان'
        : language === 'fr'
        ? 'Mot de Passe Gérant & Sécurité'
        : 'Manager Password & Security',
    subtitle:
      language === 'ar'
        ? 'تحديد كلمة المرور المطلوبة للانتقال من وضع الكاشير إلى وضع المدير والإدارة'
        : language === 'fr'
        ? 'Configurez le mot de passe requis pour passer du Mode Caisse au Mode Gérant'
        : 'Configure the password required to switch from Cashier Mode to Manager Mode',
    currentPass:
      language === 'ar'
        ? 'كلمة المرور الحالية للمدير'
        : language === 'fr'
        ? 'Mot de passe actuel'
        : 'Current Manager Password',
    newPass:
      language === 'ar'
        ? 'كلمة المرور الجديدة'
        : language === 'fr'
        ? 'Nouveau mot de passe'
        : 'New Manager Password',
    confirmPass:
      language === 'ar'
        ? 'تأكيد كلمة المرور الجديدة'
        : language === 'fr'
        ? 'Confirmer le nouveau mot de passe'
        : 'Confirm New Password',
    saveBtn:
      language === 'ar'
        ? 'حفظ كلمة المرور الجديدة'
        : language === 'fr'
        ? 'Enregistrer le mot de passe'
        : 'Save New Password',
    saving:
      language === 'ar' ? 'جاري الحفظ...' : language === 'fr' ? 'Enregistrement...' : 'Saving...',
    errEmpty:
      language === 'ar'
        ? 'يرجى إدخال جميع الحقول المطلوبة'
        : language === 'fr'
        ? 'Veuillez remplir tous les champs obligatoires'
        : 'Please fill in all required fields',
    errWrongCurrent:
      language === 'ar'
        ? 'كلمة المرور الحالية غير صحيحة'
        : language === 'fr'
        ? 'Le mot de passe actuel est incorrect'
        : 'Current manager password is incorrect',
    errMismatch:
      language === 'ar'
        ? 'كلمة المرور الجديدة وتأكيدها غير متطابقين'
        : language === 'fr'
        ? 'Les nouveaux mots de passe ne correspondent pas'
        : 'New passwords do not match',
    errTooShort:
      language === 'ar'
        ? 'يجب أن تتكون كلمة المرور من 4 أحرف أو أرقام على الأقل'
        : language === 'fr'
        ? 'Le mot de passe doit comporter au moins 4 caractères'
        : 'Password must be at least 4 characters long',
    successMsg:
      language === 'ar'
        ? 'تم تحديث كلمة مرور المدير بنجاح في قاعدة البيانات!'
        : language === 'fr'
        ? 'Mot de passe gérant mis à jour avec succès dans la base de données !'
        : 'Manager password updated successfully in SQLite database!',
    infoCardTitle:
      language === 'ar'
        ? 'معلومات حماية وضع المدير'
        : language === 'fr'
        ? 'Protection du Mode Gérant'
        : 'Manager Protection Info',
    infoCardBody:
      language === 'ar'
        ? 'يبدأ البرنامج دائماً في وضع الكاشير (البيع فقط). عند الرغبة في فتح المخزون، المشتريات، التقارير أو الإعدادات، يطلب النظام كلمة المرور هذه. في حال نسيانها، يمكنك دائماً استخدام مفتاح الاسترداد الرئيسي: 998822'
        : language === 'fr'
        ? "L'application démarre directement en Mode Caisse (vente seule). Pour accéder aux stocks, achats, rapports ou réglages, ce mot de passe est exigé. En cas d'oubli, la Clé Maître de Récupération est : 998822"
        : 'The app boots directly in Cashier mode (sales only). To access inventory, purchases, reports, or settings, this password is required. If forgotten, Master Recovery Key: 998822',
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t.errEmpty);
      return;
    }

    if (currentPassword !== managerPassword && currentPassword !== DEFAULT_MANAGER_PASSWORD) {
      setError(t.errWrongCurrent);
      return;
    }

    if (newPassword.length < 4) {
      setError(t.errTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.errMismatch);
      return;
    }

    setIsSaving(true);
    try {
      await updateManagerPassword(newPassword);
      setSuccess(t.successMsg);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2 rtl:space-x-reverse">
          <ShieldCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          <span>{t.title}</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">{t.subtitle}</p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 rtl:space-x-reverse p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-900/50">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 rtl:space-x-reverse p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/50">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.currentPass}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.newPass}
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.confirmPass}
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 rtl:space-x-reverse px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all disabled:opacity-50"
            >
              <Key className="h-3.5 w-3.5" />
              <span>{isSaving ? t.saving : t.saveBtn}</span>
            </button>
          </div>
        </form>

        {/* Info Column */}
        <div className="bg-sky-50/60 dark:bg-sky-950/20 p-5 rounded-2xl border border-sky-100 dark:border-sky-900/40 space-y-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-sky-700 dark:text-sky-300">
            <Info className="h-4 w-4 flex-shrink-0" />
            <h4 className="text-xs font-bold">{t.infoCardTitle}</h4>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.infoCardBody}
          </p>
          <div className="pt-2 border-t border-sky-200/50 dark:border-sky-800/50">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">
              {language === 'ar' ? 'مفتاح الاسترداد الاحتياطي:' : 'Clé Maître de Secours :'}
            </span>
            <span className="inline-block px-2.5 py-1 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-lg text-xs font-mono font-bold text-sky-600 dark:text-sky-400 select-all">
              998822
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
