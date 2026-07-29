export interface LicenseInfo {
  key: string;
  clientName: string;
  businessType: string;
  validUntil: string;
  isExpired: boolean;
  features: string[];
}

export interface ILicensingService {
  verifyLicense(key: string): Promise<LicenseInfo>;
  getActiveLicense(): Promise<LicenseInfo | null>;
  activateLicense(key: string): Promise<boolean>;
}
