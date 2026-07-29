import { describe, it, expect } from 'vitest';
import { SetupWizardPayloadSchema } from '../shared/validation';

describe('Setup Wizard Schema Validation', () => {
  it('should validate complete 7-step setup wizard payload', () => {
    const payload = {
      language: 'en',
      theme: 'dark',
      businessName: 'Fresh Grocery Mart',
      businessType: 'Supermarket',
      ownerName: 'Alice Johnson',
      phone: '+1234567890',
      email: 'alice@freshmart.com',
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
      autoPrintReceipt: true,
      saveReceiptAsPdf: false,
      autoBackupEnabled: true,
      backupFrequency: 'daily',
      backupRetentionCount: 7,
      backupCompressionEnabled: true,
      backupEncryptionEnabled: false,
      ownerUsername: 'admin',
      ownerPassword: 'AdminPassw0rd!',
      securityQuestion: 'First pet name?',
      securityAnswer: 'Rover',
    };

    const parsed = SetupWizardPayloadSchema.parse(payload);
    expect(parsed.businessName).toBe('Fresh Grocery Mart');
    expect(parsed.ownerUsername).toBe('admin');
  });
});
