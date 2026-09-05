import React, { useEffect, useState, useRef } from 'react';
import { useCommercialStore } from '@stores/useCommercialStore';
import { useLanguageStore } from '@stores/useLanguageStore';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Alert } from '@components/ui/Alert';
import { ShieldCheck, Key, Copy, Check, Upload, FileCode } from 'lucide-react';
import { formatDate } from '@utils/date';

export const LicensingSettings: React.FC = () => {
  const {
    deviceId,
    license,
    loadDeviceId,
    loadActiveLicense,
    activateLicense,
    selectAndActivateLicense,
    isLoading,
    error,
  } = useCommercialStore();
  const { language } = useLanguageStore();

  const [copied, setCopied] = useState(false);
  const [licenseText, setLicenseText] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDeviceId();
    loadActiveLicense();
  }, [loadDeviceId, loadActiveLicense]);

  const handleCopyDeviceCode = () => {
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileSelect = async () => {
    setSuccessMsg(null);
    const ok = await selectAndActivateLicense();
    if (ok) {
      setSuccessMsg(
        language === 'fr'
          ? 'Licence activée avec succès !'
          : language === 'ar'
          ? 'تم تنشيط الترخيص بنجاح!'
          : 'License activated successfully!',
      );
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        setSuccessMsg(null);
        const ok = await activateLicense(content);
        if (ok) {
          setSuccessMsg(
            language === 'fr'
              ? 'Licence activée avec succès !'
              : language === 'ar'
              ? 'تم تنشيط الترخيص بنجاح!'
              : 'License activated successfully!',
          );
        }
      }
    };
    reader.readAsText(file);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    if (!licenseText) return;

    const ok = await activateLicense(licenseText);
    if (ok) {
      setSuccessMsg(
        language === 'fr'
          ? 'Licence activée avec succès !'
          : language === 'ar'
          ? 'تم تنشيط الترخيص بنجاح!'
          : 'License activated successfully!',
      );
      setLicenseText('');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {language === 'ar'
            ? 'تنشيط وترخيص النظام'
            : language === 'fr'
            ? 'Licence & Activation du Logiciel'
            : 'License & Software Activation'}
        </h2>
        <p className="text-xs text-slate-500">
          {language === 'ar'
            ? 'إدارة ترخيص النظام، بصمة الجهاز، واستيراد ملفات الترخيص المعتمدة (.zabad)'
            : language === 'fr'
            ? 'Gérer la licence de l’appareil, la signature cryptographique et l’import de fichiers .zabad'
            : 'Manage device hardware binding, cryptographic verification, and import .zabad license files'}
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <Card
        title={
          language === 'ar'
            ? '1. رمز تنشيط الجهاز (Hardware ID)'
            : language === 'fr'
            ? '1. Code d’Activation de l’Appareil (Hardware ID)'
            : '1. Device Activation Code (Hardware ID)'
        }
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-slate-500">
              {language === 'ar'
                ? 'زوّد المطور بهذا الرمز للحصول على ملف الترخيص المعتمد:'
                : language === 'fr'
                ? 'Fournissez ce code à votre vendeur pour recevoir votre fichier de licence :'
                : 'Provide this unique code to your vendor to receive your signed license file:'}
            </span>
            <div className="font-mono text-lg font-black text-sky-600 dark:text-sky-400 tracking-widest select-all">
              {deviceId || 'LOADING...'}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleCopyDeviceCode}
            className="flex items-center space-x-2 rtl:space-x-reverse"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            <span>
              {copied
                ? language === 'ar'
                  ? 'تم النسخ للحافظة'
                  : language === 'fr'
                  ? 'Copié !'
                  : 'Copied!'
                : language === 'ar'
                ? 'نسخ رمز الجهاز'
                : language === 'fr'
                ? 'Copier le Code'
                : 'Copy Device Code'}
            </span>
          </Button>
        </div>
      </Card>

      <Card
        title={
          language === 'ar'
            ? '2. معلومات الترخيص النشط'
            : language === 'fr'
            ? '2. Informations sur la Licence Active'
            : '2. Active License Information'
        }
      >
        {license ? (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'الحالة :' : language === 'fr' ? 'Statut :' : 'Status:'}
              </span>
              <Badge variant="success" className="flex items-center space-x-1">
                <ShieldCheck className="h-3 w-3 mr-1" />
                {license.status} ({license.licenseType})
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                {language === 'ar' ? 'مرخص لصالح :' : language === 'fr' ? 'Titulaire :' : 'Licensed To:'}
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {license.customerName} ({license.businessName})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                {language === 'ar' ? 'تاريخ الإصدار :' : language === 'fr' ? 'Date d’émission :' : 'Issue Date:'}
              </span>
              <span>{formatDate(license.issueDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                {language === 'ar' ? 'تاريخ الانتهاء :' : language === 'fr' ? 'Date d’expiration :' : 'Expiration Date:'}
              </span>
              <span>
                {license.expirationDate
                  ? formatDate(license.expirationDate)
                  : language === 'ar'
                  ? 'دائم مدى الحياة (Lifetime)'
                  : language === 'fr'
                  ? 'À vie (Illimité)'
                  : 'Never (Lifetime)'}
              </span>
            </div>
            <div className="pt-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {language === 'ar' ? 'الوحدات المفعلة :' : language === 'fr' ? 'Modules autorisés :' : 'Enabled Modules:'}
              </span>
              <div className="flex flex-wrap gap-1">
                {license.enabledModules.map((m) => (
                  <Badge key={m} variant="info">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500 space-y-2">
            <Key className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {language === 'ar'
                ? 'لا يوجد ترخيص مفعل حالياً'
                : language === 'fr'
                ? 'Aucune licence active'
                : 'No Active License'}
            </p>
            <p>
              {language === 'ar'
                ? 'استورد ملف الترخيص (.zabad) لتفعيل النظام على هذا الجهاز.'
                : language === 'fr'
                ? 'Importez un fichier de licence (.zabad) pour activer le système sur cet appareil.'
                : 'Import a .zabad license file to activate the software on this PC.'}
            </p>
          </div>
        )}
      </Card>

      <Card
        title={
          language === 'ar'
            ? '3. استيراد ملف ترخيص معتمد (.zabad)'
            : language === 'fr'
            ? '3. Importer un Fichier de Licence (.zabad)'
            : '3. Import Signed License File (.zabad)'
        }
      >
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".zabad,.json,.rms"
            className="hidden"
          />

          <Button
            type="button"
            isLoading={isLoading}
            onClick={handleFileSelect}
            className="w-full py-3 flex items-center justify-center space-x-2 rtl:space-x-reverse bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
          >
            <Upload className="h-4 w-4" />
            <span>
              {language === 'ar'
                ? '📁 اختيار واستيراد ملف الترخيص (.zabad)'
                : language === 'fr'
                ? '📁 Choisir & Importer le Fichier (.zabad)'
                : '📁 Select & Import License File (.zabad)'}
            </span>
          </Button>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 font-semibold block mb-2">
              {language === 'ar'
                ? 'أو لصق نص الترخيص يدوياً :'
                : language === 'fr'
                ? 'Ou coller le contenu textuel de la licence :'
                : 'Or paste license text manually:'}
            </span>
            <form onSubmit={handleActivate} className="space-y-3">
              <textarea
                rows={3}
                value={licenseText}
                onChange={(e) => setLicenseText(e.target.value)}
                placeholder='{"app":"Zabad POS","license":{...},"signature":"..."}'
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isLoading || !licenseText.trim()}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <FileCode className="h-4 w-4" />
                  <span>
                    {language === 'ar' ? 'تنشيط النص' : language === 'fr' ? 'Activer le texte' : 'Activate Text'}
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
};
export default LicensingSettings;
