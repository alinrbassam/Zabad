import React, { useEffect, useState } from 'react';
import { useCommercialStore } from '@stores/useCommercialStore';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Alert } from '@components/ui/Alert';
import { ShieldCheck, Key, Copy, Check } from 'lucide-react';

export const LicensingSettings: React.FC = () => {
  const { deviceId, license, loadDeviceId, loadActiveLicense, activateLicense, isLoading, error } =
    useCommercialStore();
  const [copied, setCopied] = useState(false);
  const [licenseText, setLicenseText] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadDeviceId();
    loadActiveLicense();
  }, [loadDeviceId, loadActiveLicense]);

  const handleCopyDeviceCode = () => {
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    if (!licenseText) return;

    const ok = await activateLicense(licenseText);
    if (ok) {
      setSuccessMsg('License activated successfully! Commercial modules enabled.');
      setLicenseText('');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          License & Device Activation
        </h2>
        <p className="text-xs text-slate-500">
          Manage offline commercial licensing, device fingerprint, and module permissions.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <Card title="1. Device Activation Fingerprint">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-slate-500">
              Send this unique Device Activation Code to your software vendor:
            </span>
            <div className="font-mono text-base font-black text-sky-600 dark:text-sky-400 tracking-wider">
              {deviceId || 'LOADING...'}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleCopyDeviceCode}
            className="flex items-center space-x-2"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Device Code'}</span>
          </Button>
        </div>
      </Card>

      <Card title="2. Active License Information">
        {license ? (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300">Status:</span>
              <Badge variant="success" className="flex items-center space-x-1">
                <ShieldCheck className="h-3 w-3 mr-1" />
                {license.status} ({license.licenseType})
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Licensed To:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {license.customerName} ({license.businessName})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Issue Date:</span>
              <span>{new Date(license.issueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expiration Date:</span>
              <span>
                {license.expirationDate
                  ? new Date(license.expirationDate).toLocaleDateString()
                  : 'Never (Lifetime)'}
              </span>
            </div>
            <div className="pt-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Enabled Commercial Modules:
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
              No License File Activated
            </p>
            <p>Paste your signed license file content below to activate commercial features.</p>
          </div>
        )}
      </Card>

      <Card title="3. Import & Activate License File (.rms)">
        <form onSubmit={handleActivate} className="space-y-4">
          <Input
            label="Paste Signed License Payload (.rms / JSON)"
            value={licenseText}
            onChange={(e) => setLicenseText(e.target.value)}
            placeholder='{"licenseKey":"RMS-102","customerName":"Acme Store", ...}'
          />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isLoading} className="flex items-center space-x-2">
              <Key className="h-4 w-4" />
              <span>Activate License ✓</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
