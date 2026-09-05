import React, { useEffect, useState, useRef } from 'react';
import { useCommercialStore } from '../../stores/useCommercialStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import {
  ShieldAlert,
  Copy,
  Check,
  Upload,
  Key,
  Globe,
  Fish,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ActivationScreenProps {
  onActivated?: () => void;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivated }) => {
  const { deviceId, loadDeviceId, activateLicense, selectAndActivateLicense, isLoading, error } =
    useCommercialStore();
  const { language, setLanguage } = useLanguageStore();

  const [copied, setCopied] = useState(false);
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [manualText, setManualText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDeviceId();
  }, [loadDeviceId]);

  const handleCopyCode = () => {
    if (!deviceId) return;
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSelectFile = async () => {
    setLocalError(null);
    const ok = await selectAndActivateLicense();
    if (ok && onActivated) {
      onActivated();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        setLocalError(null);
        const ok = await activateLicense(content);
        if (ok && onActivated) {
          onActivated();
        }
      }
    };
    reader.onerror = () => {
      setLocalError('Impossible de lire le fichier sélectionné / Failed to read selected file.');
    };
    reader.readAsText(file);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    setLocalError(null);
    const ok = await activateLicense(manualText.trim());
    if (ok && onActivated) {
      onActivated();
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans relative overflow-x-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 p-2 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Fish className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="font-black text-lg text-white tracking-wide">ZABAD POS</span>
              <span className="text-[10px] uppercase tracking-wider font-bold bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/30">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'ar'
                ? 'نظام نقاط البيع للمأكولات البحرية والأسماك'
                : language === 'fr'
                ? 'Système de Caisse & Gestion Poissonnerie'
                : 'Fresh Seafood Retail & POS System'}
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse bg-slate-800/80 border border-slate-700/80 rounded-xl p-1 text-xs">
          <Globe className="h-3.5 w-3.5 text-slate-400 ml-1.5 rtl:ml-0 rtl:mr-1.5" />
          {(['fr', 'en', 'ar'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                language === lang
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang === 'fr' ? 'FR' : lang === 'en' ? 'EN' : 'عربي'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Activation Card */}
      <div className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {language === 'ar'
                ? 'تنشيط النظام مطلوب'
                : language === 'fr'
                ? 'Activation du Logiciel Requise'
                : 'Software Activation Required'}
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {language === 'ar'
                ? 'هذا النظام محمي ومرتبط بهذا الجهاز تحديداً. يرجى تزويد المطور برمز الجهاز أدناه للحصول على ملف الترخيص.'
                : language === 'fr'
                ? 'Cette installation de Zabad POS est sécurisée et verrouillée pour cet appareil. Veuillez fournir le Code d’Appareil ci-dessous à votre fournisseur.'
                : 'This Zabad POS installation is bound to this specific hardware. Please provide the Device Code below to your software vendor to receive your license.'}
            </p>
          </div>

          {/* Error Message */}
          {activeError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5 rtl:space-x-reverse">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">
                  {language === 'ar' ? 'فشل التنشيط' : language === 'fr' ? 'Erreur d’activation' : 'Activation Error'}
                </span>
                <span>{activeError}</span>
              </div>
            </div>
          )}

          {/* Device Activation Code Box */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider">
                {language === 'ar' ? 'رمز تنشيط الجهاز' : language === 'fr' ? 'Code d’Activation de l’Appareil' : 'Device Activation Code'}
              </span>
              <span className="text-[10px] text-sky-400 font-mono">Hardware ID</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="font-mono text-xl sm:text-2xl font-black tracking-widest text-sky-400 select-all">
                {deviceId || 'GENERATING...'}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center space-x-1.5 rtl:space-x-reverse px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold transition-all active:scale-95 flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">
                      {language === 'ar' ? 'تم النسخ' : language === 'fr' ? 'Copié !' : 'Copied!'}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-300" />
                    <span>{language === 'ar' ? 'نسخ' : language === 'fr' ? 'Copier' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instructions Step-by-Step */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3.5 space-y-2 text-xs text-slate-300">
            <div className="font-bold text-slate-200 flex items-center space-x-1.5 rtl:space-x-reverse">
              <HelpCircle className="h-3.5 w-3.5 text-sky-400" />
              <span>
                {language === 'ar' ? 'خطوات التنشيط السريعة :' : language === 'fr' ? 'Étapes d’activation :' : 'Activation Steps:'}
              </span>
            </div>
            <ol className="space-y-1.5 text-[11px] text-slate-400 list-decimal list-inside leading-relaxed">
              <li>
                <strong className="text-slate-300">
                  {language === 'ar' ? 'انسخ رمز الجهاز' : language === 'fr' ? 'Copiez le Code d’Appareil' : 'Copy the Device Code'}{' '}
                </strong>
                {language === 'ar' ? 'وأرسله للمطور عبر واتساب أو إيميل.' : language === 'fr' ? 'et envoyez-le par WhatsApp ou Email.' : 'and send it via WhatsApp or email.'}
              </li>
              <li>
                {language === 'ar'
                  ? 'ستستلم ملف ترخيص معتمد بصيغة '
                  : language === 'fr'
                  ? 'Recevez votre fichier de licence officiel '
                  : 'Receive your official license file '}
                <strong className="text-sky-400 font-mono">.zabad</strong>.
              </li>
              <li>
                {language === 'ar'
                  ? 'اضغط زر الاستيراد أدناه لاختيار الملف والتنشيط فوراً.'
                  : language === 'fr'
                  ? 'Cliquez ci-dessous pour importer le fichier et débloquer le système.'
                  : 'Click below to import the file and unlock the system.'}
              </li>
            </ol>
          </div>

          {/* Primary Action Button: Import .zabad file */}
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".zabad,.json,.rms"
              className="hidden"
            />

            <button
              type="button"
              disabled={isLoading}
              onClick={handleSelectFile}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.99] text-white font-black text-sm sm:text-base flex items-center justify-center space-x-2.5 rtl:space-x-reverse shadow-xl shadow-emerald-600/30 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  <span>
                    {language === 'ar'
                      ? 'جاري التحقق من الترخيص...'
                      : language === 'fr'
                      ? 'Vérification de la licence...'
                      : 'Verifying License...'}
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>
                    {language === 'ar'
                      ? '📁 استيراد ملف الترخيص (.zabad)'
                      : language === 'fr'
                      ? '📁 Importer le Fichier de Licence (.zabad)'
                      : '📁 Import License File (.zabad)'}
                  </span>
                </>
              )}
            </button>

            {/* Toggle Manual Paste Textarea */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowManualPaste(!showManualPaste)}
                className="text-xs text-slate-400 hover:text-sky-400 font-medium transition-colors"
              >
                {showManualPaste
                  ? language === 'ar'
                    ? '▲ إخفاء لصق النص يدوياً'
                    : language === 'fr'
                    ? '▲ Masquer la saisie manuelle'
                    : '▲ Hide manual paste'
                  : language === 'ar'
                  ? '▼ أو لصق كود الترخيص يدوياً'
                  : language === 'fr'
                  ? '▼ Ou coller le texte de la licence'
                  : '▼ Or paste license text manually'}
              </button>
            </div>

            {showManualPaste && (
              <form onSubmit={handleManualSubmit} className="space-y-2 pt-2">
                <textarea
                  rows={4}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder='{"app":"Zabad POS","license":{...},"signature":"..."}'
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                />
                <button
                  type="submit"
                  disabled={isLoading || !manualText.trim()}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all"
                >
                  <Key className="h-3.5 w-3.5" />
                  <span>
                    {language === 'ar' ? 'تنشيط' : language === 'fr' ? 'Activer' : 'Activate'}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-500 max-w-md mx-auto pt-2">
        <span>Zabad POS • Commercial Enterprise Edition • Offline Secure Activation</span>
      </div>
    </div>
  );
};
export default ActivationScreen;
