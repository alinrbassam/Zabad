import os from 'node:os';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { logger } from './logger.service';
import { ZABAD_LICENSE_PUBLIC_KEY } from '../../shared/license-public-key';

export interface LicenseDetails {
  id?: string;
  licenseKey?: string;
  customerName: string;
  businessName: string;
  deviceId: string;
  issueDate: string;
  expirationDate?: string | null;
  licenseType: 'Lifetime' | 'Subscription' | 'Trial';
  enabledModules: string[];
  status: 'Active' | 'Expired' | 'Invalid' | 'Trial' | 'Revoked';
}

interface LicenseDbRow {
  id: string;
  license_key: string;
  customer_name: string;
  business_name: string;
  device_id: string;
  issue_date: string;
  expiration_date?: string | null;
  license_type: 'Lifetime' | 'Subscription' | 'Trial';
  enabled_modules_json: string;
  status: 'Active' | 'Expired' | 'Invalid' | 'Trial' | 'Revoked';
}

export class LicensingService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Generates a permanent, stable hardware fingerprint for this machine.
   * On Windows, reads MachineGuid from the registry.
   * Format: XXXX-XXXX-XXXX-XXXX
   */
  public getDeviceFingerprint(): string {
    let rawGuid = '';

    if (process.platform === 'win32') {
      try {
        const out = execSync('reg query HKLM\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid', {
          encoding: 'utf8',
          windowsHide: true,
          timeout: 2000,
        });
        const match = out.match(/MachineGuid\s+REG_SZ\s+([a-zA-Z0-9\-]+)/i);
        if (match && match[1]) {
          rawGuid = match[1].trim();
        }
      } catch {
        // Fallback below
      }
    }

    if (!rawGuid) {
      const hostname = os.hostname();
      const arch = os.arch();
      const cpus = os.cpus().length;
      rawGuid = `${hostname}-${arch}-${cpus}`;
    }

    const hex16 = crypto
      .createHash('sha256')
      .update(`ZABAD-SALT-2026:${rawGuid}`)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();

    return hex16.match(/.{1,4}/g)?.join('-') || hex16;
  }

  /**
   * Strips all non-alphanumeric characters and converts to uppercase
   * for consistent device ID comparison.
   */
  public normalizeDeviceId(id: string): string {
    return String(id || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  }

  /**
   * Retrieves the currently active and valid license from SQLite.
   * Performs binding check against current device fingerprint,
   * expiration date verification, and status check.
   */
  public getActiveLicense(): LicenseDetails | null {
    const stmt = this.db.prepare(
      'SELECT * FROM license_info WHERE status = "Active" ORDER BY activated_at DESC LIMIT 1',
    );
    const row = stmt.get() as LicenseDbRow | undefined;
    if (!row) return null;

    // 1. Device binding check
    const currentNormalized = this.normalizeDeviceId(this.getDeviceFingerprint());
    const licenseNormalized = this.normalizeDeviceId(row.device_id);
    if (licenseNormalized && licenseNormalized !== currentNormalized) {
      logger.warn(
        'LicensingService',
        `License device mismatch: bound to ${row.device_id}, current is ${currentNormalized}`,
      );
      return null;
    }

    // 2. Expiration check
    if (row.expiration_date) {
      const exp = new Date(row.expiration_date);
      if (!isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
        logger.warn('LicensingService', `License expired on ${row.expiration_date}`);
        try {
          this.db.prepare('UPDATE license_info SET status = "Expired" WHERE id = ?').run(row.id);
        } catch {
          // ignore
        }
        return null;
      }
    }

    // 3. Status check
    if (row.status !== 'Active') {
      return null;
    }

    let modules: string[] = [];
    try {
      modules = JSON.parse(row.enabled_modules_json || '[]');
    } catch {
      modules = ['pos', 'inventory', 'purchasing', 'expenses', 'reports', 'settings'];
    }

    return {
      id: row.id,
      licenseKey: row.license_key,
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

  /**
   * Activates a license from a payload string (.zabad file content or JSON).
   * Validates Ed25519 signature, checks device binding, and verifies expiration.
   */
  public activateLicensePayload(payloadStr: string): LicenseDetails {
    let parsed: any;
    try {
      parsed = JSON.parse(payloadStr.trim());
    } catch {
      throw new Error(
        'Format de fichier invalide / Invalid license file format. Please select a valid .zabad file.',
      );
    }

    let licenseData: any;
    let signature: string | undefined;

    // Format v2 (signed with Ed25519)
    if (parsed.format === 'zabad-license-v2' && parsed.license && parsed.signature) {
      licenseData = parsed.license;
      signature = String(parsed.signature);

      try {
        const canonicalData = Buffer.from(JSON.stringify(licenseData));
        const sigBuffer = Buffer.from(signature, 'base64');
        const isValid = crypto.verify(null, canonicalData, ZABAD_LICENSE_PUBLIC_KEY, sigBuffer);
        if (!isValid) {
          throw new Error(
            'Signature cryptographique invalide / Invalid cryptographic signature. The license file has been altered or corrupted.',
          );
        }
      } catch (err: any) {
        throw new Error(err.message || 'Signature verification failed');
      }
    } else if (parsed.license && parsed.signature) {
      licenseData = parsed.license;
      signature = String(parsed.signature);
      try {
        const canonicalData = Buffer.from(JSON.stringify(licenseData));
        const sigBuffer = Buffer.from(signature, 'base64');
        const isValid = crypto.verify(null, canonicalData, ZABAD_LICENSE_PUBLIC_KEY, sigBuffer);
        if (!isValid) {
          throw new Error('Signature cryptographique invalide / Invalid cryptographic signature.');
        }
      } catch (err: any) {
        throw new Error(err.message || 'Signature verification failed');
      }
    } else {
      // Legacy unsigned format (fallback)
      licenseData = parsed;
    }

    const currentDeviceId = this.getDeviceFingerprint();
    const currentNormalized = this.normalizeDeviceId(currentDeviceId);
    const licenseNormalized = this.normalizeDeviceId(licenseData.deviceId);

    if (licenseNormalized && licenseNormalized !== currentNormalized) {
      throw new Error(
        `Code d'appareil non correspondant / Device ID mismatch: Cette licence est destinée à l'appareil [${licenseData.deviceId}], mais cet ordinateur est [${currentDeviceId}].`,
      );
    }

    // Expiration check
    if (licenseData.expirationDate) {
      const exp = new Date(licenseData.expirationDate);
      if (!isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
        throw new Error('Cette licence a expiré / This license has already expired.');
      }
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
      licenseData.licenseKey || licenseId,
      licenseData.customerName || 'Client Zabad',
      licenseData.businessName || 'Poissonnerie Zabad',
      currentDeviceId,
      licenseData.issueDate || now,
      licenseData.expirationDate || null,
      licenseData.licenseType || 'Lifetime',
      JSON.stringify(
        licenseData.enabledModules || [
          'pos',
          'inventory',
          'purchasing',
          'expenses',
          'reports',
          'settings',
        ],
      ),
      now,
    );

    logger.info(
      'LicensingService',
      `Activated license for ${licenseData.customerName} on device ${currentDeviceId}`,
    );

    return {
      id: licenseId,
      licenseKey: licenseData.licenseKey || licenseId,
      customerName: licenseData.customerName || 'Client Zabad',
      businessName: licenseData.businessName || 'Poissonnerie Zabad',
      deviceId: currentDeviceId,
      issueDate: licenseData.issueDate || now,
      expirationDate: licenseData.expirationDate || null,
      licenseType: licenseData.licenseType || 'Lifetime',
      enabledModules: licenseData.enabledModules || [
        'pos',
        'inventory',
        'purchasing',
        'expenses',
        'reports',
        'settings',
      ],
      status: 'Active',
    };
  }

  /**
   * Revokes an active license (locally or triggered by remote sync).
   */
  public revokeLicense(deviceIdOrKey?: string): boolean {
    try {
      if (deviceIdOrKey) {
        this.db
          .prepare('UPDATE license_info SET status = "Revoked" WHERE device_id = ? OR license_key = ?')
          .run(deviceIdOrKey, deviceIdOrKey);
      } else {
        this.db.prepare('UPDATE license_info SET status = "Revoked" WHERE status = "Active"').run();
      }
      logger.warn('LicensingService', `Revoked license: ${deviceIdOrKey || 'active'}`);
      return true;
    } catch (e: any) {
      logger.error('LicensingService', 'Failed to revoke license', e);
      return false;
    }
  }
}
