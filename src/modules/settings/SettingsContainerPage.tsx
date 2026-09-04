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
import { AboutSettings } from './sections/AboutSettings';
import { CloudSyncSettings } from './sections/CloudSyncSettings';
import { UpdateSettings } from './sections/UpdateSettings';
import { useLanguageStore } from '../../renderer/stores/useLanguageStore';
import {
  Store,
  Palette,
  Globe,
  Coins,
  Receipt,
  Percent,
  HardDrive,
  Printer,
  History,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export const SettingsContainerPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const { language } = useLanguageStore();

  const sections = [
    {
      id: 'general',
      label: language === 'ar' ? 'بيانات المتجر والنشاط' : 'Store & Business',
      icon: Store,
    },
    {
      id: 'language',
      label: language === 'ar' ? 'اللغة والواجهة' : 'Language',
      icon: Globe,
    },
    {
      id: 'regional',
      label: language === 'ar' ? 'العملة والتنسيق' : 'Currency & Region',
      icon: Coins,
    },
    {
      id: 'tax',
      label: language === 'ar' ? 'نسبة الضريبة (VAT)' : 'Tax & VAT',
      icon: Percent,
    },
    {
      id: 'receipt',
      label: language === 'ar' ? 'نموذج الفاتورة' : 'Receipt Template',
      icon: Receipt,
    },
    {
      id: 'printer',
      label: language === 'ar' ? 'طابعة الإيصالات' : 'Thermal Printer',
      icon: Printer,
    },
    {
      id: 'appearance',
      label: language === 'ar' ? 'المظهر والألوان' : 'Appearance',
      icon: Palette,
    },
    {
      id: 'backup',
      label: language === 'ar' ? 'النسخ الاحتياطي' : 'Data Backup',
      icon: HardDrive,
    },
    {
      id: 'cloud_sync',
      label: language === 'ar' ? 'تطبيق الموبايل والسحابة' : 'Mobile App & Cloud',
      icon: Smartphone,
    },
    {
      id: 'updates',
      label: language === 'ar' ? 'تحديثات النظام' : 'Software Updates',
      icon: Sparkles,
    },
    {
      id: 'changes',
      label: language === 'ar' ? 'سجل التعديلات' : 'System Changes Log',
      icon: History,
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSettings />;
      case 'language':
        return <LanguageSettings />;
      case 'regional':
        return <RegionalSettings />;
      case 'tax':
        return <TaxSettings />;
      case 'receipt':
        return <ReceiptSettings />;
      case 'printer':
        return <PrinterSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'backup':
        return <BackupSettings />;
      case 'cloud_sync':
        return <CloudSyncSettings />;
      case 'updates':
        return <UpdateSettings />;
      case 'changes':
        return <AboutSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {language === 'ar' ? 'إعدادات النظام والمتجر' : 'Store & System Settings'}
        </h1>
        <p className="text-xs text-slate-500">
          {language === 'ar'
            ? 'تعديل بيانات المتجر، نسب الضريبة، إعدادات طابعة الفواتير والنسخ الاحتياطي'
            : 'Configure store profile, tax parameters, thermal receipt templates, and database backup.'}
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
                className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
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

