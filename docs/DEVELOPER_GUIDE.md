# RMS Enterprise Developer & Architecture Guide

Welcome to the **Retail Management System (RMS) Enterprise** developer documentation. This document details the technical architecture, design patterns, build pipeline, and developer environment setup.

---

## 1. Technology Stack Overview

- **Core Framework**: Electron 31 + Node.js 20
- **Frontend Logic & Framework**: React 18 + TypeScript (Strict Mode enabled) + Vite 5
- **Desktop Database**: SQLite3 via `better-sqlite3` (synchronous, high-throughput embedded relational store)
- **State Management**: Zustand (modular, lightweight client stores)
- **UI Design System**: Vanilla CSS + TailwindCSS (Dark Mode, High Contrast, Arabic RTL support)
- **Validation Schemas**: Zod (runtime validation across IPC boundaries)
- **Unit Testing**: Vitest (23 test suites, 100% test pass rate)
- **Packaging & CI/CD**: Electron Builder + GitHub Actions (`.github/workflows/release.yml`)

---

## 2. Architecture & Directory Blueprint

```
WA System/
├── .github/workflows/release.yml    # CI/CD GitHub Actions Build & Release Pipeline
├── electron-builder.yml            # NSIS Windows Setup & Portable Packaging Configuration
├── src/
│   ├── main/                       # Electron Main Process (Node.js & SQLite Engine)
│   │   ├── database/               # SQLite Connection Singleton, Repositories, Migrator (v1-v7)
│   │   ├── ipc/                    # Typed ContextBridge Handlers across IPC channels
│   │   ├── services/               # Core Domain Services (Auth, Inventory, Purchasing, POS, Reports, Licensing, Backup)
│   │   ├── index.ts                # App Readiness, Migration Runner, Error Handlers
│   │   └── window.ts               # BrowserWindow Hardening & Security Isolation
│   ├── preload/                    # Secure Preload Script (`api.ts` ContextBridge Exposure)
│   ├── renderer/                   # React Frontend Application (UI Components & Stores)
│   │   ├── components/ui/          # Reusable UI Design Tokens (Card, Table, Badge, Button, Input)
│   │   ├── stores/                 # Zustand Global State Managers (Auth, POS, Inventory, Reports, Commercial)
│   │   ├── App.tsx                 # HashRouter & Dynamic Module Route Dispatcher
│   │   └── main.tsx                # React DOM Mount Entrypoint
│   ├── modules/                    # Self-Contained Enterprise Plug-in Modules
│   │   ├── auth/                   # Authentication & Screen Lock
│   │   ├── inventory/              # Product Catalog, Batches, Stock Movements & Barcodes
│   │   ├── purchasing/             # Purchase Orders, Goods Receiving & Supplier Returns
│   │   ├── pos/                    # Fast POS Terminal, Held Sales, Shift Totals & Thermal Receipts
│   │   ├── reports/                # Database Aggregated Analytics & Financial P&L Statements
│   │   ├── settings/               # System Settings, Licensing, Backup & Maintenance Sections
│   │   ├── help/                   # Help Center & POS Hotkeys Guide
│   │   └── registry.ts             # Dynamic Module Registration Singleton
│   ├── shared/                     # Cross-Process Shared Contracts (Types, IPC Channels, Validation)
│   └── tests/                      # Vitest Unit Test Suites (38+ tests)
```

---

## 3. Database Schema & Migration System

All database schema mutations are governed by `DatabaseMigrator` (`src/main/database/migrator.ts`). Migrations are versioned sequentially and executed atomically upon app launch:

- `v2_auth_and_settings.ts`: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `app_settings`, `audit_logs`
- `v3_inventory.ts`: `categories`, `brands`, `units`, `suppliers`, `products`, `product_barcodes`, `inventory_balances`, `inventory_movements`, `inventory_batches`
- `v4_purchasing.ts`: `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items`, `supplier_invoices`, `purchase_returns`, `purchase_return_items`
- `v5_pos.ts`: `sales_orders`, `sales_order_items`, `sales_payments`, `suspended_sales`, `suspended_sale_items`, `sales_refunds`, `sales_refund_items`, `pos_shifts`
- `v6_reports.ts`: `saved_report_filters`, performance composite indexes
- `v7_commercial.ts`: `license_info`, `backup_records`

---

## 4. Developer Build & Testing Commands

```bash
# Install dependencies
npm ci

# Run Development DevServer with Hot Reload
npm run dev

# Run TypeScript Strict Typecheck
npm run typecheck

# Run ESLint Code Quality Verification
npm run lint

# Run Vitest Automated Unit Test Suite
npm run test

# Format Codebase using Prettier
npm run format

# Production Packaging via Electron Builder
npx electron-builder --win --x64
```
