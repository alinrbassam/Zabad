import React from 'react';
import { Card } from '@components/ui/Card';
import { HelpCircle, ShieldCheck, Mail } from 'lucide-react';

export const HelpPage: React.FC = () => {
  const shortcuts = [
    { key: 'F1', description: 'Focus Barcode / SKU Input' },
    { key: 'F2', description: 'Open Product Search' },
    { key: 'F3', description: 'Open Payment Modal (Cash/Card/Split)' },
    { key: 'F4', description: 'Hold Sale (Suspend Current Cart)' },
    { key: 'F5', description: 'Resume Suspended Sale' },
    { key: 'F9', description: 'Open Register Shift Manager' },
    { key: 'Esc', description: 'Cancel Modal / Clear Search' },
  ];

  const faqs = [
    {
      q: 'How does offline mode work?',
      a: 'The Retail Management System operates 100% offline using an embedded local SQLite database. Internet is only required if checking for voluntary updates.',
    },
    {
      q: 'How do I backup my store data?',
      a: 'Navigate to Settings > Backup. You can generate a Full .db Backup or set up an automated Cloud-Sync folder (compatible with OneDrive, Google Drive, and Dropbox).',
    },
    {
      q: 'What happens when a subscription license expires?',
      a: 'Customer data is NEVER deleted. After a 7-day grace period, new sales checkout is paused, but all existing reports, exports, backups, and sales history remain accessible.',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-3">
        <HelpCircle className="h-6 w-6 text-sky-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Help Center & Keyboard Reference</h1>
          <p className="text-xs text-slate-500">POS hotkeys, frequently asked questions, and support documentation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="POS Keyboard Hotkeys">
          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {shortcuts.map((s) => (
              <div key={s.key} className="py-2.5 flex justify-between items-center">
                <span className="font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-bold text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700">
                  {s.key}
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{s.description}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Frequently Asked Questions (FAQ)">
          <div className="space-y-4 text-xs">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">{faq.q}</span>
                <p className="text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Enterprise Support & Commercial License">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-8 w-8 text-emerald-500" />
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block">RMS Enterprise Retail System v1.0.0</span>
              <span className="text-slate-500">Commercial License Active • Offline Mode Secured</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-slate-500">
            <Mail className="h-4 w-4 text-sky-500" />
            <span>Support: support@rms-enterprise.com</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
