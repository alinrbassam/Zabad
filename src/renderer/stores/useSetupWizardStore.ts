import { create } from 'zustand';
import { SetupWizardPayloadInput } from '@shared/validation';

const initialSetupData: SetupWizardPayloadInput = {
  language: 'en',
  theme: 'system',
  businessName: 'متجر زَبَد للأسماك الطازجة',
  businessType: 'Fish Market',
  logo: '',
  ownerName: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  city: '',
  country: '',
  taxNumber: '',
  currency: 'FCFA',
  timezone: 'UTC',
  dateFormat: 'DD-MM-YYYY',
  timeFormat: '24h',
  taxEnabled: true,
  taxRate: 15,
  pricesIncludeTax: false,
  receiptWidth: '80mm',
  receiptLanguage: 'en',
  showReceiptLogo: true,
  showReceiptAddress: true,
  showReceiptPhone: true,
  showReceiptTaxNumber: true,
  showCashierName: true,
  receiptFooterMessage: 'Thank you for shopping with us!',
  returnPolicy: '30 days returns allowed with valid receipt.',
  autoPrintReceipt: true,
  saveReceiptAsPdf: false,
  autoBackupEnabled: true,
  backupFolder: '',
  backupFrequency: 'daily',
  cloudSyncFolder: '',
  backupRetentionCount: 7,
  backupCompressionEnabled: true,
  backupEncryptionEnabled: false,
  ownerUsername: 'admin',
  ownerPassword: '',
  securityQuestion: 'What is your favorite store name?',
  securityAnswer: '',
};

interface SetupWizardState {
  currentStep: number;
  data: SetupWizardPayloadInput;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<SetupWizardPayloadInput>) => void;
  resetWizard: () => void;
}

export const useSetupWizardStore = create<SetupWizardState>((set, get) => ({
  currentStep: 1,
  data: initialSetupData,
  setStep: (step: number) => set({ currentStep: step }),
  nextStep: () => set({ currentStep: Math.min(get().currentStep + 1, 7) }),
  prevStep: () => set({ currentStep: Math.max(get().currentStep - 1, 1) }),
  updateData: (partial) => set({ data: { ...get().data, ...partial } }),
  resetWizard: () => set({ currentStep: 1, data: initialSetupData }),
}));
