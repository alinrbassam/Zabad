import os from 'node:os';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { logger } from './logger.service';

export interface LicenseDetails {
  id?: string;
  customerName: string;
  businessName: string;
  deviceId: string;
  issueDate: string;
  expirationDate?: string | null;
  licenseType: 'Lifetime' | 'Subscription' | 'Trial';
  enabledModules: string[];
  status: 'Active' | 'Expired' | 'Invalid' | 'Trial';
}

interface LicenseDbRow {
  id: string;
  customer_name: string;
  business_name: string;
  device_id: string;
  issue_date: string;
  expiration_date?: string | null;
  license_type: 'Lifetime' | 'Subscription' | 'Trial';
  enabled_modules_json: string;
  status: 'Active' | 'Expired' | 'Invalid' | 'Trial';
}

export class LicensingService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public getDeviceFingerprint(): string {
    const hostname = os.hostname();
    const arch = os.arch();
    const cpus = os.cpus().length;
    const raw = `${hostname}-${arch}-${cpus}`;
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16).toUpperCase();
  }

  public getActiveLicense(): LicenseDetails | null {
    const stmt = this.db.prepare(
      'SELECT * FROM license_info WHERE status = "Active" ORDER BY activated_at DESC LIMIT 1',
    );
    const row = stmt.get() as LicenseDbRow | undefined;
    if (!row) return null;

    let modules: string[] = [];
    try {
      modules = JSON.parse(row.enabled_modules_json || '[]');
    } catch {
      modules = [];
    }

    return {
      id: row.id,
      customerName: row.customer_name,
      businessName: row.business_name,
      deviceId: row.device_id,
      issueDate: row.issue_date,
      expirationDate: row.expiration_date,
      licenseType: row.license_type,
      enabledModules: modules,
      status: row.status,
    };
  }

  public activateLicensePayload(payloadStr: string): LicenseDetails {
    let parsed: {
      licenseKey?: string;
      customerName?: string;
      businessName?: string;
      deviceId?: string;
      issueDate?: string;
      expirationDate?: string;
      licenseType?: 'Lifetime' | 'Subscription' | 'Trial';
      enabledModules?: string[];
    };
    try {
      parsed = JSON.parse(payloadStr);
    } catch {
      throw new Error('Invalid license file format');
    }

    const currentDeviceId = this.getDeviceFingerprint();
    if (parsed.deviceId && parsed.deviceId !== currentDeviceId) {
      throw new Error(`Device ID mismatch: License is bound to ${parsed.deviceId}`);
    }

    const licenseId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertStmt = this.db.prepare(`
      INSERT INTO license_info (
        id, license_key, customer_name, business_name, device_id,
        issue_date, expiration_date, license_type, enabled_modules_json, status, activated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
    `);

    insertStmt.run(
      licenseId,
      parsed.licenseKey || licenseId,
      parsed.customerName || 'Customer',
      parsed.businessName || 'Business',
      currentDeviceId,
      parsed.issueDate || now,
      parsed.expirationDate || null,
      parsed.licenseType || 'Lifetime',
      JSON.stringify(parsed.enabledModules || ['pos', 'inventory', 'purchasing', 'reports']),
      now,
    );

    logger.info('LicensingService', `Activated license for ${parsed.customerName}`);

    return {
      id: licenseId,
      customerName: parsed.customerName || 'Customer',
      businessName: parsed.businessName || 'Business',
      deviceId: currentDeviceId,
      issueDate: parsed.issueDate || now,
      expirationDate: parsed.expirationDate || null,
      licenseType: parsed.licenseType || 'Lifetime',
      enabledModules: parsed.enabledModules || ['pos', 'inventory', 'purchasing', 'reports'],
      status: 'Active',
    };
  }
}
