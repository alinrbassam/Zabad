import React, { useState } from 'react';
import { Card } from '@components/ui/Card';
import { GeneralSettings } from './sections/GeneralSettings';
import { AppearanceSettings } from './sections/AppearanceSettings';
import { LanguageSettings } from './sections/LanguageSettings';
import { RegionalSettings } from './sections/RegionalSettings';
import { ReceiptSettings } from './sections/ReceiptSettings';
import { TaxSettings } from './sections/TaxSettings';
import { BackupSettings } from './sections/BackupSettings';
import { PrinterSettings } from './sections/PrinterSettings';
import { UpdateSettings } from './sections/UpdateSettings';
import { LicensingSettings } from './sections/LicensingSettings';
import { AboutSettings } from './sections/AboutSettings';
import {
  Store,
  Palette,
  Globe,
  Coins,
  Receipt,
  Percent,
  HardDrive,
  Printer,
  RefreshCw,
  Key,
  Info,
} from 'lucide-react';

export const SettingsContainerPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    { id: 'general', label: 'General & Business', icon: Store },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'regional', label: 'Regional & Units', icon: Coins },
    { id: 'receipt', label: 'Receipt Options', icon: Receipt },
    { id: 'tax', label: 'Tax Rules', icon: Percent },
    { id: 'backup', label: 'Backups Policy', icon: HardDrive },
    { id: 'printer', label: 'Printers', icon: Printer },
    { id: 'updates', label: 'Application Updates', icon: RefreshCw },
    { id: 'licensing', label: 'License Info', icon: Key },
    { id: 'about', label: 'About RMS', icon: Info },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'language':
        return <LanguageSettings />;
      case 'regional':
        return <RegionalSettings />;
      case 'receipt':
        return <ReceiptSettings />;
      case 'tax':
        return <TaxSettings />;
      case 'backup':
        return <BackupSettings />;
      case 'printer':
        return <PrinterSettings />;
      case 'updates':
        return <UpdateSettings />;
      case 'licensing':
        return <LicensingSettings />;
      case 'about':
        return <AboutSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Application Settings
        </h1>
        <p className="text-xs text-slate-500">
          Configure business profile, tax parameters, thermal receipt templates, regional options,
          and system preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-1 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 self-start">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        <div className="md:col-span-3">
          <Card>{renderSection()}</Card>
        </div>
      </div>
    </div>
  );
};
