# RMS Enterprise Deployment & Installation Guide

This document outlines building production installers, portable executables, and deploying commercial releases via GitHub Actions CI/CD.

---

## 1. Local Production Build Procedure

Before generating installers, ensure all automated quality gates pass:

```bash
# 1. Verify strict TypeScript compliance
npm run typecheck

# 2. Verify ESLint static analysis
npm run lint

# 3. Execute Vitest unit test suite (38+ tests)
npm run test

# 4. Compile React & Main process assets
npm run build

# 5. Package Windows Setup.exe & Portable binary
npx electron-builder --win --x64
```

Output binaries will be generated under `dist-release/`:
- `RMS Enterprise Setup 1.0.0.exe` (NSIS Windows Installer with Desktop & Start Menu shortcuts)
- `RMS Enterprise Portable 1.0.0.exe` (Standalone zero-install executable for USB drives)

---

## 2. Windows Code Signing Setup

To prevent Windows SmartScreen warnings during commercial distribution, set Code Signing credentials prior to running Electron Builder:

```powershell
$env:WIN_CSC_LINK = "C:\certificates\code_signing_cert.pfx"
$env:WIN_CSC_KEY_PASSWORD = "YourCertificatePassword"
npx electron-builder --win --x64
```

---

## 3. GitHub Actions Automated CI/CD Releases

The repository contains an automated release workflow in `.github/workflows/release.yml`.

### How to Trigger an Automated Release:
1. Bump version in `package.json` (e.g. `1.0.0`).
2. Commit and push a git tag matching `v*`:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions will automatically:
   - Run typecheck, lint, and Vitest test suites.
   - Compile React & Electron main assets.
   - Package `Setup.exe` and `Portable.exe`.
   - Publish a new GitHub Release with binaries attached.
