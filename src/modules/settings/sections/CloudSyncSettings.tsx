import React, { useState, useEffect } from 'react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import {
  Cloud,
  CheckCircle2,
  Lock,
  Unlock,
  Store,
  Briefcase,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useLanguageStore } from '../../../renderer/stores/useLanguageStore';

const DEFAULT_SUPABASE_URL = 'https://zlewivlmnwjloksdercw.supabase.co';
const DEFAULT_SUPABASE_KEY =
  typeof window !== 'undefined' && window.atob
    ? window.atob('c2Jfc2VjcmV0X2ZjRDA0cGxzOXpDNEdRNHlnQ2d0blFfLUIzclplUDI=')
    : '';

export const CloudSyncSettings: React.FC = () => {
  const { language } = useLanguageStore();

  // Supabase Multi-Device State
  const [supabaseEnabled, setSupabaseEnabled] = useState(true);
  const [syncRole, setSyncRole] = useState<'store' | 'manager'>('store');
  const [supabaseUrl, setSupabaseUrl] = useState(DEFAULT_SUPABASE_URL);
  const [supabaseKey, setSupabaseKey] = useState(DEFAULT_SUPABASE_KEY);
  const [syncInterval, setSyncInterval] = useState(10);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [remoteMeta, setRemoteMeta] = useState<any>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSupabaseConfig();
  }, []);

  const loadSupabaseConfig = async () => {
    try {
      const api = (window as any).api;
      if (api?.getSupabaseSyncConfig) {
        const res = await api.getSupabaseSyncConfig();
        if (res?.success && res.data) {
          setSupabaseEnabled(res.data.enabled ?? true);
          setSyncRole(res.data.role || 'store');
          setSupabaseUrl(res.data.supabaseUrl || DEFAULT_SUPABASE_URL);
          setSupabaseKey(res.data.supabaseKey || DEFAULT_SUPABASE_KEY);
          setSyncInterval(res.data.autoSyncIntervalMinutes || 10);
          setLastSyncAt(res.data.lastSyncAt);
          setLastStatus(res.data.lastStatus);
          setRemoteMeta(res.data.remoteMeta);
        }
      }
    } catch (err) {
      console.error('Failed to load Supabase sync config', err);
    }
  };

  const handleSaveConfig = async (
    newRole = syncRole,
    newEnabled = supabaseEnabled,
    newInterval = syncInterval,
    newUrl = supabaseUrl,
    newKey = supabaseKey
  ) => {
    setIsSaving(true);
    setSyncMessage(null);
    try {
      const api = (window as any).api;
      await api.updateSupabaseSyncConfig({
        role: newRole,
        enabled: newEnabled,
        autoSyncIntervalMinutes: newInterval,
        supabaseUrl: newUrl,
        supabaseKey: newKey,
      });
      setSyncMessage(
        language === 'fr'
          ? 'Configuration enregistrée avec succès ✓'
          : 'Configuration saved successfully ✓'
      );
      setIsLocked(true);
    } catch (err: any) {
      setSyncMessage(`Erreur: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const api = (window as any).api;
      const res = await api.syncSupabaseNow();
      if (res?.success) {
        setSyncMessage(res.data?.message || 'Synchronisation terminée avec succès ✓');
        setLastSyncAt(res.data?.timestamp || new Date().toISOString());
        setLastStatus('success');
        if (res.data?.remoteMeta) {
          setRemoteMeta(res.data.remoteMeta);
        }
      } else {
        const errMsg = res?.data?.message || res?.error?.message || 'Erreur réseau';
        setSyncMessage(`Échec: ${errMsg}`);
        setLastStatus(`Erreur: ${errMsg}`);
      }
    } catch (err: any) {
      setSyncMessage(`Erreur: ${err.message}`);
      setLastStatus(`Erreur: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl select-none">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Cloud className="h-5 w-5 text-sky-600" />
          {language === 'ar'
            ? 'مزامنة السحابة بين جهازي لابتوب (Supabase)'
            : language === 'fr'
            ? 'Synchronisation Multi-PC dans le Cloud (Supabase)'
            : 'Multi-Laptop Cloud Sync (Supabase)'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'ar'
            ? 'ربط جهاز الكاشير في المتجر مع لابتوب المدير في المنزل أو في الخارج لمزامنة المبيعات والمخزون والديون لحظياً.'
            : language === 'fr'
            ? 'Connectez le PC Caisse du magasin avec le PC portable du gérant à domicile ou à l’étranger pour synchroniser ventes, dettes et stocks.'
            : 'Sync the in-store cashier laptop with the manager’s remote laptop at home or abroad.'}
        </p>
      </div>

      {/* Role Selection Card */}
      <Card title={language === 'fr' ? 'Rôle de cet Ordinateur' : 'Role of this Computer'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Store POS Option */}
            <div
              onClick={() => {
                setSyncRole('store');
                handleSaveConfig('store');
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                syncRole === 'store'
                  ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 ring-2 ring-sky-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    syncRole === 'store' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {language === 'fr' ? 'PC Magasin (Caisse Principale)' : 'In-Store POS (Primary)'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'fr'
                      ? 'Cet ordinateur enregistre les ventes et envoie les données vers le cloud.'
                      : 'This computer processes sales and uploads updates to Supabase.'}
                  </p>
                </div>
              </div>
              {syncRole === 'store' && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-sky-600 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{language === 'fr' ? 'Actif sur ce PC' : 'Active on this PC'}</span>
                </div>
              )}
            </div>

            {/* Remote Manager Option */}
            <div
              onClick={() => {
                setSyncRole('manager');
                handleSaveConfig('manager');
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                syncRole === 'manager'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    syncRole === 'manager'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {language === 'fr' ? 'PC Gérant à Distance' : 'Remote Manager (Home / Abroad)'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'fr'
                      ? 'Pour le gérant en déplacement : télécharge l’état du magasin en 2 secondes.'
                      : 'For the owner traveling or at home: pulls store reports and sales.'}
                  </p>
                </div>
              </div>
              {syncRole === 'manager' && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{language === 'fr' ? 'Actif sur ce PC' : 'Active on this PC'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sync Trigger Action Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">
                  {language === 'fr' ? 'Dernière synchronisation :' : 'Last Sync Time:'}
                </span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'Jamais / Never'}
                </span>
              </div>
              {lastStatus && (
                <Badge variant={lastStatus === 'success' ? 'success' : 'danger'}>
                  {lastStatus === 'success' ? 'Synchronisé ✓' : lastStatus}
                </Badge>
              )}
            </div>

            {/* Remote Info Card (if in manager mode) */}
            {syncRole === 'manager' && remoteMeta && (
              <div className="p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>🏪 {remoteMeta.storeName || 'Magasin'}</span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(remoteMeta.lastSyncedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300 pt-1 text-[11px]">
                  <span>
                    Ventes aujourd'hui : <strong>{remoteMeta.orderCountToday ?? 0}</strong>
                  </span>
                  <span>
                    Recette : <strong>{Number(remoteMeta.revenueToday || 0).toLocaleString()} {remoteMeta.currency || 'USD'}</strong>
                  </span>
                  <span>
                    Articles : <strong>{remoteMeta.productCount ?? 0}</strong>
                  </span>
                </div>
              </div>
            )}

            {syncMessage && (
              <div
                className={`p-2.5 rounded-lg text-xs ${
                  syncMessage.includes('Erreur') || syncMessage.includes('Échec')
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {syncMessage}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="primary"
                onClick={handleSyncNow}
                isLoading={isSyncing}
                disabled={isSyncing}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {language === 'ar'
                    ? 'مزامنة ثنائية الاتجاه الآن (الكمبيوتر 1 ↔ الكمبيوتر 2)'
                    : language === 'fr'
                    ? 'Synchroniser maintenant (PC 1 ↔ PC 2)'
                    : 'Sync Both Laptops Now (Two-Way)'}
                </span>
              </Button>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  {language === 'fr'
                    ? `Auto-sync toutes les ${syncInterval} min`
                    : `Auto-sync every ${syncInterval} min`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Advanced Supabase Credentials (Protected) */}
      <Card title={language === 'fr' ? 'Paramètres Techniques Cloud' : 'Cloud Technical Parameters'}>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>
                {isLocked
                  ? language === 'fr'
                    ? 'Identifiants Supabase configurés et protégés.'
                    : 'Supabase credentials configured and locked.'
                  : language === 'fr'
                  ? 'Modification déverrouillée.'
                  : 'Editing enabled.'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 rounded font-semibold text-[11px] flex items-center gap-1 hover:bg-slate-50"
            >
              {isLocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {isLocked ? 'Déverrouiller' : 'Verrouiller'}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                readOnly={isLocked}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border font-mono ${
                  isLocked
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    : 'bg-white text-slate-900 border-sky-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase API Secret Key
              </label>
              <input
                type="password"
                value={supabaseKey}
                readOnly={isLocked}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border font-mono ${
                  isLocked
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    : 'bg-white text-slate-900 border-sky-500'
                }`}
              />
            </div>

            {!isLocked && (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => handleSaveConfig()}
                  isLoading={isSaving}
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {language === 'fr' ? 'Enregistrer les paramètres' : 'Save Parameters'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
