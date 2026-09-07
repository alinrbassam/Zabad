import React, { useState, useEffect } from 'react';
import { useCommercialStore } from '@stores/useCommercialStore';
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

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const unsub = initUpdateListeners();
    return () => unsub();
  }, [initUpdateListeners]);

  const handleCheck = async () => {
    await checkForUpdates();
    setChecked(true);
  };

  const handleInstall = async () => {
    await installUpdate();
  };

  const isDownloaded = updateEvent?.status === 'downloaded';
  const isDownloading = updateEvent?.status === 'downloading';
  const hasUpdate = Boolean(updateStatus?.hasUpdate || updateEvent?.status === 'available' || isDownloaded);
  const targetVersion = updateEvent?.version || updateStatus?.latestVersion || '1.0.2';
  const progressPercent = updateEvent?.progress?.percent ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Mises à jour logicielles / Application Updates
        </h2>
        <p className="text-xs text-slate-500">
          Mettez à jour Zabad POS directement en 1 clic sans interruption des ventes et sans quitter l'application.
        </p>
      </div>

      <Card title="Gestionnaire de mise à jour intégrée">
        <div className="space-y-5">
          {/* Version status card */}
          <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">Version installée actuellement :</span>
              <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                {updateStatus?.currentVersion ? `v${updateStatus.currentVersion}` : 'v1.0.0'}
              </span>
            </div>

            <div>
              {isDownloaded ? (
                <Badge variant="success" className="px-3 py-1 text-xs">
                  Prêt à installer : v{targetVersion}
                </Badge>
              ) : isDownloading ? (
                <Badge variant="info" className="px-3 py-1 text-xs animate-pulse">
                  Téléchargement ({progressPercent}%)
                </Badge>
              ) : hasUpdate ? (
                <Badge variant="warning" className="px-3 py-1 text-xs">
                  Mise à jour disponible : v{targetVersion}
                </Badge>
              ) : checked ? (
                <Badge variant="success" className="px-3 py-1 text-xs">
                  Votre logiciel est à jour ✓
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
                    Mise à jour v{targetVersion} téléchargée avec succès !
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Cliquez sur le bouton ci-contre pour redémarrer l'application et appliquer la mise à jour immédiatement. Vos données, historiques et licence sont conservés intacts.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleInstall}
                isLoading={isInstallingUpdate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 shrink-0 flex items-center space-x-2 shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Redémarrer et Installer</span>
              </Button>
            </div>
          )}

          {/* Downloading Progress Bar */}
          {isDownloading && (
            <div className="p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl space-y-2">
              <div className="flex justify-between text-xs font-semibold text-sky-900 dark:text-sky-200">
                <span>Téléchargement de la nouvelle version en cours...</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-sky-200 dark:bg-sky-900 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-sky-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-sky-700 dark:text-sky-400">
                Le téléchargement s'effectue en arrière-plan. Vous pouvez continuer vos ventes normalement.
              </p>
            </div>
          )}

          {/* Release Notes */}
          {(updateEvent?.releaseNotes || updateStatus?.releaseNotes) && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Notes de version (v{targetVersion}) :
              </span>
              <div className="p-3 bg-slate-900 text-slate-200 text-xs rounded-xl font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                {updateEvent?.releaseNotes || updateStatus?.releaseNotes}
              </div>
            </div>
          )}

          {/* Actions footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>Canal : <strong className="text-slate-700 dark:text-slate-300">Mise à jour intégrée directe</strong></span>
            <div className="flex gap-2">
              {hasUpdate && !isDownloaded && !isDownloading && (
                <Button
                  onClick={downloadUpdate}
                  isLoading={isLoading}
                  className="bg-primary-600 hover:bg-primary-700 text-white flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Télécharger la mise à jour</span>
                </Button>
              )}

              <Button
                onClick={handleCheck}
                isLoading={isLoading}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Vérifier les mises à jour</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
