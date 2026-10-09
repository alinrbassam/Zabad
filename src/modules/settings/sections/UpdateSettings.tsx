import React, { useState, useEffect } from 'react';
import { useCommercialStore } from '@stores/useCommercialStore';
import { useLanguageStore } from '../../../renderer/stores/useLanguageStore';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { RefreshCw, CheckCircle2, Download } from 'lucide-react';

export const UpdateSettings: React.FC = () => {
  const {
    updateStatus,
    updateEvent,
    isInstallingUpdate,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    initUpdateListeners,
    isLoading,
  } = useCommercialStore();
  const { language } = useLanguageStore();

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const unsub = initUpdateListeners();
    checkForUpdates()
      .then(() => setChecked(true))
      .catch(() => {});
    return () => unsub();
  }, [initUpdateListeners, checkForUpdates]);

  const handleCheck = async () => {
    await checkForUpdates();
    setChecked(true);
  };

  const handleInstall = async () => {
    await installUpdate();
  };

  const isDownloaded = updateEvent?.status === 'downloaded';
  const isDownloading = updateEvent?.status === 'downloading';
  const hasUpdate = Boolean(
    updateStatus?.hasUpdate || updateEvent?.status === 'available' || isDownloaded,
  );
  const targetVersion = updateEvent?.version || updateStatus?.latestVersion || '1.0.18';
  const progressPercent = updateEvent?.progress?.percent ?? 0;

  const rawReleaseNotes = updateEvent?.releaseNotes || updateStatus?.releaseNotes || '';
  const cleanReleaseNotes = String(rawReleaseNotes)
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {language === 'ar' ? 'تحديثات النظام / Software Updates' : 'Software Updates'}
        </h2>
        <p className="text-xs text-slate-500">
          {language === 'ar'
            ? 'قم بتحديث النظام بنقرة واحدة دون مقاطعة المبيعات أو فقدان أي بيانات.'
            : 'Update Khalil POS directly in 1 click without interrupting sales or losing any data.'}
        </p>
      </div>

      <Card title={language === 'ar' ? 'مدير التحديثات المدمج' : 'Built-in Update Manager'}>
        <div className="space-y-5">
          {/* Version status card */}
          <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">
                {language === 'ar' ? 'الإصدار المثبت حالياً:' : 'Currently installed version:'}
              </span>
              <span className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {updateStatus?.currentVersion ? (
                  `v${updateStatus.currentVersion}`
                ) : isLoading ? (
                  <span className="inline-flex items-center text-xs text-slate-400 font-normal">
                    <RefreshCw className="h-3 w-3 animate-spin mr-1.5" />
                    {language === 'ar' ? 'جاري التحقق...' : 'Checking...'}
                  </span>
                ) : (
                  'v1.0.18'
                )}
              </span>
            </div>

            <div>
              {isDownloaded ? (
                <Badge variant="success" className="px-3 py-1 text-xs">
                  {language === 'ar'
                    ? `جاهز للتثبيت: v${targetVersion}`
                    : `Ready to install: v${targetVersion}`}
                </Badge>
              ) : isDownloading ? (
                <Badge variant="info" className="px-3 py-1 text-xs animate-pulse">
                  {language === 'ar'
                    ? `جاري التنزيل (${progressPercent}%)`
                    : `Downloading (${progressPercent}%)`}
                </Badge>
              ) : hasUpdate ? (
                <Badge variant="warning" className="px-3 py-1 text-xs">
                  {language === 'ar'
                    ? `تم العثور على إصدار جديد: v${targetVersion}`
                    : `New version found: v${targetVersion}`}
                </Badge>
              ) : checked ? (
                <Badge variant="success" className="px-3 py-1 text-xs">
                  {language === 'ar' ? 'النظام محدّث لأحدث إصدار ✓' : 'Your software is up to date ✓'}
                </Badge>
              ) : null}
            </div>
          </div>

          {/* Downloaded and Ready banner */}
          {isDownloaded && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                    {language === 'ar'
                      ? `تم تنزيل التحديث v${targetVersion} بنجاح!`
                      : `Update v${targetVersion} downloaded successfully!`}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {language === 'ar'
                      ? 'اضغط على الزر لإعادة تشغيل التطبيق وتثبيت التحديث فوراً. جميع بياناتك ومبيعاتك وترخيصك محفوظة بالكامل.'
                      : 'Click the button on the right to restart the application and apply the update immediately. Your products, sales history, and license remain intact.'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleInstall}
                isLoading={isInstallingUpdate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 shrink-0 flex items-center space-x-2 shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span>{language === 'ar' ? 'إعادة التشغيل والتثبيت' : 'Restart & Install'}</span>
              </Button>
            </div>
          )}

          {/* Downloading Progress Bar */}
          {isDownloading && (
            <div className="p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl space-y-2">
              <div className="flex justify-between text-xs font-semibold text-sky-900 dark:text-sky-200">
                <span>
                  {language === 'ar'
                    ? 'جاري تنزيل الإصدار الجديد...'
                    : 'Downloading new version...'}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-sky-200 dark:bg-sky-900 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-sky-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-sky-700 dark:text-sky-400">
                {language === 'ar'
                  ? 'يتم التنزيل في الخلفية. يمكنك متابعة البيع بشكل طبيعي.'
                  : 'Download is running in the background. You can continue your sales normally.'}
              </p>
            </div>
          )}

          {/* Release Notes */}
          {cleanReleaseNotes && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ar'
                  ? `ملاحظات الإصدار (v${targetVersion}):`
                  : `Release Notes (v${targetVersion}):`}
              </span>
              <div className="p-3 bg-slate-900 text-slate-200 text-xs rounded-xl font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                {cleanReleaseNotes}
              </div>
            </div>
          )}

          {/* Actions footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>
              {language === 'ar' ? 'القناة: ' : 'Channel: '}
              <strong className="text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'تحديث مباشر مدمج' : 'Direct Built-in Updater'}
              </strong>
            </span>
            <div className="flex gap-2">
              {hasUpdate && !isDownloaded && !isDownloading && (
                <Button
                  onClick={downloadUpdate}
                  isLoading={isLoading}
                  className="bg-primary-600 hover:bg-primary-700 text-white flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{language === 'ar' ? 'تنزيل التحديث' : 'Download'}</span>
                </Button>
              )}

              <Button
                onClick={handleCheck}
                isLoading={isLoading}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>{language === 'ar' ? 'التحقق من التحديثات' : 'Check for Updates'}</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

