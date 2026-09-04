import React, { useState, useEffect } from 'react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Smartphone, RefreshCw, CheckCircle2 } from 'lucide-react';

export const CloudSyncSettings: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [syncUrl, setSyncUrl] = useState('');
  const [syncKey, setSyncKey] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await (window as any).api.getCloudSyncConfig();
      if (res?.success && res.data) {
        setEnabled(res.data.enabled);
        setSyncUrl(res.data.syncUrl || '');
        setSyncKey(res.data.syncKey || '');
        setLastSyncAt(res.data.lastSyncAt);
        setLastStatus(res.data.lastStatus);
      }
    } catch (err) {
      console.error('Failed to load cloud sync config', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSyncMessage(null);
    try {
      await (window as any).api.updateCloudSyncConfig({
        enabled,
        syncUrl,
        syncKey,
      });
      setSyncMessage('Settings saved successfully');
    } catch (err: any) {
      setSyncMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
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
        setSyncMessage(`Sync failed: ${res?.data?.message || res?.error?.message || 'Check sync URL'}`);
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
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 block">
                Enable Cloud Synchronization
              </span>
              <span className="text-xs text-slate-500">
                Automatically pushes store metrics every 5 minutes and on completed checkout
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vercel Dashboard Sync URL
              </label>
              <input
                type="text"
                placeholder="https://your-dashboard.vercel.app/api/sync"
                value={syncUrl}
                onChange={(e) => setSyncUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                The URL of your deployed Next.js Vercel dashboard ending in <code>/api/sync</code>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sync Secret Key (Token)
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="e.g. zabad-secret-key-2026"
                  value={syncKey}
                  onChange={(e) => setSyncKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Must match the <code>SYNC_SECRET_KEY</code> environment variable on Vercel
              </span>
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
            <div className={`p-3 rounded-lg text-xs ${
              syncMessage.includes('Error') || syncMessage.includes('failed')
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {syncMessage}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={handleSyncNow}
              isLoading={isSyncing}
              disabled={!syncUrl || isSyncing}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Sync Now (Push to Mobile)</span>
            </Button>

            <Button
              onClick={handleSave}
              isLoading={isSaving}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Save Configuration</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
