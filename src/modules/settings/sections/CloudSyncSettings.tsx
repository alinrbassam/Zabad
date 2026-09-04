import React, { useState, useEffect } from 'react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import {
  Smartphone,
  RefreshCw,
  CheckCircle2,
  Lock,
  Unlock,
  RotateCcw,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

const DEFAULT_SYNC_URL = 'https://zabad.vercel.app/api/sync';
const DEFAULT_SYNC_KEY = 'zabad-secret-key-2026';

export const CloudSyncSettings: React.FC = () => {
  const [enabled, setEnabled] = useState(true);
  const [syncUrl, setSyncUrl] = useState(DEFAULT_SYNC_URL);
  const [syncKey, setSyncKey] = useState(DEFAULT_SYNC_KEY);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await (window as any).api.getCloudSyncConfig();
      if (res?.success && res.data) {
        setEnabled(res.data.enabled ?? true);
        setSyncUrl(res.data.syncUrl || DEFAULT_SYNC_URL);
        setSyncKey(res.data.syncKey || DEFAULT_SYNC_KEY);
        setLastSyncAt(res.data.lastSyncAt);
        setLastStatus(res.data.lastStatus);
      }
    } catch (err) {
      console.error('Failed to load cloud sync config', err);
    }
  };

  const handleSave = async (
    newEnabled = enabled,
    newUrl = syncUrl,
    newKey = syncKey
  ) => {
    setIsSaving(true);
    setSyncMessage(null);
    try {
      await (window as any).api.updateCloudSyncConfig({
        enabled: newEnabled,
        syncUrl: newUrl,
        syncKey: newKey,
      });
      setSyncMessage('Settings saved successfully');
      setIsLocked(true);
    } catch (err: any) {
      setSyncMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setSyncUrl(DEFAULT_SYNC_URL);
    setSyncKey(DEFAULT_SYNC_KEY);
    setEnabled(true);
    await handleSave(true, DEFAULT_SYNC_URL, DEFAULT_SYNC_KEY);
    setSyncMessage('Reset to official Zabad Cloud defaults ✓');
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await (window as any).api.syncCloudNow();
      if (res?.success) {
        setSyncMessage('Snapshot sent to Mobile Dashboard successfully!');
        setLastSyncAt(res.data?.timestamp || new Date().toISOString());
        setLastStatus('success');
      } else {
        setSyncMessage(`Sync failed: ${res?.data?.message || res?.error?.message || 'Check connection'}`);
        setLastStatus(`Error: ${res?.data?.message || 'Check connection'}`);
      }
    } catch (err: any) {
      setSyncMessage(`Sync error: ${err.message}`);
      setLastStatus(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-teal-600" />
          Mobile Dashboard & Cloud Sync
        </h2>
        <p className="text-xs text-slate-500">
          Transmit live sales, daily profit, debtor balances, and stock alerts to your mobile dashboard on Vercel so the owner can view them from abroad.
        </p>
      </div>

      <Card title="Cloud Sync Configuration">
        <div className="space-y-5">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 block">
                Enable Cloud Synchronization
              </span>
              <span className="text-xs text-slate-500">
                Automatically pushes store metrics every 5 minutes and immediately after any checkout
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setEnabled(val);
                  handleSave(val, syncUrl, syncKey);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {/* Protection Notice & Lock Controls */}
          <div className="flex items-center justify-between px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>
                {isLocked
                  ? 'Parameters are locked to prevent accidental changes.'
                  : 'Editing enabled. Make sure not to change the Secret Key unless updating Vercel.'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isLocked ? (
                <button
                  type="button"
                  onClick={() => setIsLocked(false)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 rounded font-semibold text-[11px] flex items-center gap-1 hover:bg-amber-50 text-amber-900 dark:text-amber-100"
                >
                  <Unlock className="h-3 w-3" />
                  Unlock
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLocked(true)}
                  className="px-2.5 py-1 bg-amber-600 text-white rounded font-semibold text-[11px] flex items-center gap-1 hover:bg-amber-700"
                >
                  <Lock className="h-3 w-3" />
                  Lock
                </button>
              )}

              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-semibold text-[11px] flex items-center gap-1 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                title="Restore default Zabad Cloud parameters"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Defaults
              </button>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vercel Dashboard Sync URL
              </label>
              <input
                type="text"
                value={syncUrl}
                readOnly={isLocked}
                onChange={(e) => setSyncUrl(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border font-mono transition-colors ${
                  isLocked
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sync Secret Key (Token)
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={syncKey}
                  readOnly={isLocked}
                  onChange={(e) => setSyncKey(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 text-xs rounded-lg border font-mono transition-colors ${
                    isLocked
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Sync Status Info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Last Sync Status:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'No sync recorded yet'}
              </span>
            </div>
            {lastStatus && (
              <Badge variant={lastStatus === 'success' ? 'success' : 'danger'}>
                {lastStatus === 'success' ? 'Synchronized ✓' : lastStatus}
              </Badge>
            )}
          </div>

          {syncMessage && (
            <div
              className={`p-3 rounded-lg text-xs ${
                syncMessage.includes('Error') || syncMessage.includes('failed')
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {syncMessage}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={handleSyncNow}
              isLoading={isSyncing}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Sync Now (Push to Mobile)</span>
            </Button>

            {!isLocked && (
              <Button
                onClick={() => handleSave()}
                isLoading={isSaving}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Changes</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
