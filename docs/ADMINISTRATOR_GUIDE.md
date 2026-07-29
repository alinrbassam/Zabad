# RMS Enterprise Administrator Guide

This guide covers store setup, user role permissions, licensing activation, automated cloud-sync backups, and SQLite database maintenance.

---

## 1. Initial Setup Wizard

Upon first launching **RMS Enterprise**, the System Setup Wizard guides you through:
1. **Business Profile**: Store Name, Tax ID / Commercial Register, Address, Contact Phone & Currency.
2. **Tax Configuration**: Default VAT / Sales Tax rate (e.g. 15%) and Tax inclusive/exclusive calculation mode.
3. **Receipt Defaults**: Receipt Header text, Footer message, Logo upload, and Thermal Printer paper width (58mm vs 80mm).
4. **Owner Account Setup**: Create Master Business Owner credentials and security recovery question.

---

## 2. User & Permission Management

Navigate to **Users Management** (`/users`):
- **Roles**:
  - **Owner**: Full system access (Financial P&L reports, purchase costs, user management, backups, maintenance).
  - **Manager**: Stock adjustments, purchase order creation, sales history, discounts, supplier returns.
  - **Cashier**: Restricted to POS terminal checkout, holding sales, shift opening/closing. Blocked from profit metrics, COGS, and financial reports.
- **PIN Login**: Enable 4-digit PIN access for fast cashier switching on touchscreen POS terminals.

---

## 3. Commercial Offline Licensing

Navigate to **Settings > Licensing**:
1. Copy your unique 16-character **Device Activation Code** (e.g. `9F4A8B2C1D0E3F7A`).
2. Send the activation code to your software vendor.
3. Paste the returned signed `.rms` license payload and click **Activate License**.

---

## 4. Disaster Recovery & Cloud-Sync Backups

Navigate to **Settings > Backup**:
- **Manual Full Backup**: Click **Create Full System Backup** to generate a complete `.db` snapshot.
- **Automated Cloud-Sync Backup**: Set a destination folder (e.g. `C:\POS Cloud Backups`) and retention count (e.g. Keep 7 backups). Your cloud desktop client (OneDrive, Google Drive, Dropbox, Synology) will sync this folder automatically.

---

## 5. Storage Maintenance

Navigate to **Settings > Maintenance**:
- **Storage VACUUM**: Reclaims fragmented disk space and shrinks SQLite database file size.
- **PRAGMA Integrity Check**: Scans database tables and B-tree indexes for physical integrity.
