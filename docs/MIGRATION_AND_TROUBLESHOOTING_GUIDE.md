# RMS Enterprise Migration & Troubleshooting Guide

This guide covers database schema migrations, automatic pre-restore safety backups, diagnostics, and crash recovery.

---

## 1. Automatic Schema Migrations & Safety Safeguards

When launching **RMS Enterprise**, `DatabaseMigrator` (`src/main/database/migrator.ts`) checks the internal `schema_migrations` table against registered migration steps:

- Migration steps execute inside single SQLite transactions.
- If a migration error occurs:
  1. The transaction rolls back automatically.
  2. A safety snapshot of the pre-migration SQLite database is generated.
  3. The application alerts the user with error details without corrupting existing store data.

---

## 2. Diagnostics & Crash Recovery

If the application encounters an unhandled exception:
- **Crash Recovery Log**: Uncaught main process exceptions are recorded in `logs/` via `logger.service.ts`.
- **Held Sales & Draft Recovery**: Active POS held sales (`suspended_sales` table) and purchase order drafts (`purchase_orders` table with status `Draft`) persist in SQLite across application restarts.

---

## 3. Common Troubleshooting Scenarios

### Issue: Printer Output Fails or Receipt Alignment Distorted
- **Fix**: Check **Settings > Receipt Defaults** and verify paper width matches physical printer roll (58mm vs 80mm).

### Issue: Product Barcode Not Found on Scanner Input
- **Fix**: Open **Products** (`/inventory/products`), edit product, and add secondary barcode aliases under **Alternate Barcodes**.

### Issue: License Shows Device Mismatch
- **Fix**: Go to **Settings > Licensing**, copy the active Device Activation Code, and request an updated signed `.rms` license payload matching the new motherboard/CPU hardware fingerprint.
