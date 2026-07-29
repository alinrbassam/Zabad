import { describe, it, expect } from 'vitest';
import { AppConfigSchema, LogPayloadSchema } from '../shared/validation';

describe('Validation Schemas', () => {
  it('should validate valid AppConfig payload', () => {
    const validConfig = {
      theme: 'dark',
      language: 'ar',
      currency: 'USD',
      businessName: 'Supermarket',
      businessType: 'Retail',
      taxRate: 15,
      taxNumber: 'TAX-123',
      address: 'Main St',
      phone: '123456789',
      backupPath: '/backup',
      receiptHeader: 'Welcome',
      receiptFooter: 'Thanks',
      appVersion: '1.0.0',
    };

    const parsed = AppConfigSchema.parse(validConfig);
    expect(parsed.theme).toBe('dark');
    expect(parsed.language).toBe('ar');
  });

  it('should reject invalid LogPayload level', () => {
    const invalidLog = {
      level: 'invalid_level',
      module: 'Test',
      message: 'Hello',
    };

    expect(() => LogPayloadSchema.parse(invalidLog)).toThrow();
  });
});
