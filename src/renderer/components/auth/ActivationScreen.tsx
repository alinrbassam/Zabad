import React, { useEffect, useState, useRef } from 'react';
import { useCommercialStore } from '../../stores/useCommercialStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Upload,
  Globe,
  Fish,
  AlertCircle,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ActivationScreenProps {
  onActivated?: () => void;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivated }) => {
  const {
    deviceId,
    loadDeviceId,
    activateWithSecretKey,
    activateLicense,
    selectAndActivateLicense,
    isLoading,
    error,
  } = useCommercialStore();
  const { language, setLanguage } = useLanguageStore();

  const [secretInput, setSecretInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  const handleSecretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretInput.trim()) return;
    setLocalError(null);

    const ok = await activateWithSecretKey(secretInput.trim());
    if (ok) {
      if (onActivated) {
        onActivated();
      }
      window.location.hash = '#/pos';
      window.location.reload();
    }
  };

  const handleSelectFile = async () => {
    setLocalError(null);
    const ok = await selectAndActivateLicense();
    if (ok) {
      if (onActivated) {
        onActivated();
      }
      window.location.hash = '#/pos';
      window.location.reload();
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
        if (ok) {
          if (onActivated) {
            onActivated();
          }
          window.location.hash = '#/pos';
          window.location.reload();
        }
      }
    };
    reader.onerror = () => {
      setLocalError('Impossible de lire le fichier sélectionné.');
    };
    reader.readAsText(file);
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
                ? 'نظام نقاط البيع وإدارة المتاجر'
                : language === 'fr'
                ? 'Système de Caisse & Gestion Commerciale'
                : 'Commercial Retail & POS System'}
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
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-slate-800/95 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-1">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {language === 'ar'
                ? 'تنشيط النظام'
                : language === 'fr'
                ? 'Activation du Système'
                : 'System Activation'}
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              {language === 'ar'
                ? 'يرجى إدخال الرمز السري للتنشيط لفتح البرنامج على هذا الجهاز.'
                : language === 'fr'
                ? 'Veuillez entrer le code secret d’activation pour déverrouiller ce terminal.'
                : 'Please enter the secret activation code to unlock this terminal.'}
            </p>
          </div>

          {/* Error Alert */}
          {activeError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5 rtl:space-x-reverse animate-shake">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">
                  {language === 'ar' ? 'رمز غير صحيح' : language === 'fr' ? 'Code Invalide' : 'Invalid Code'}
                </span>
                <span>{activeError}</span>
              </div>
            </div>
          )}

          {/* Primary Action: Secret Code Input Form */}
          <form onSubmit={handleSecretSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>
                  {language === 'ar'
                    ? 'الرمز السري للتنشيط :'
                    : language === 'fr'
                    ? 'Code Secret d’Activation :'
                    : 'Secret Activation Code:'}
                </span>
                <span className="text-[10px] text-slate-500">Technician / AnyDesk</span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  autoFocus
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="w-full pl-10 pr-10 py-3.5 bg-slate-900 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-2xl text-sm font-mono text-white tracking-widest outline-none transition-all placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !secretInput.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center space-x-2 rtl:space-x-reverse shadow-xl shadow-sky-600/30 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  <span>
                    {language === 'ar' ? 'جاري التحقق...' : language === 'fr' ? 'Vérification...' : 'Verifying...'}
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    {language === 'ar'
                      ? 'تنشيط النظام والفتح فوراً ✓'
                      : language === 'fr'
                      ? 'Déverrouiller le Système ✓'
                      : 'Unlock System ✓'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Advanced / Device Code Collapsible Drawer */}
          <div className="pt-2 border-t border-slate-700/60">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-300 transition-colors py-1"
            >
              <span>
                {language === 'ar' ? 'معلومات الجهاز وخيارات متقدمة' : language === 'fr' ? 'Informations appareil & options' : 'Device info & options'}
              </span>
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 bg-slate-900/70 p-3 rounded-2xl border border-slate-700/70 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Hardware ID
                    </span>
                    <span className="font-mono text-xs font-bold text-sky-400">
                      {deviceId || 'LOADING...'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-all"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept=".zabad,.json,.rms"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleSelectFile}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center justify-center space-x-2 rtl:space-x-reverse transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Importer fichier .zabad (optionnel)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-500 max-w-md mx-auto pt-2">
        <span>Zabad POS • Commercial Edition • Single Device License</span>
      </div>
    </div>
  );
};
export default ActivationScreen;
