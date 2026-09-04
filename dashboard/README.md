# Zabad Seafood • Live Mobile Dashboard (Vercel PWA)

A 100% free ($0/month), read-only mobile dashboard designed for store owners to monitor live daily revenue, gross profits, customer debts, and inventory alerts from their phone while traveling abroad.

---

## Features
- **Strictly Read-Only**: No edit/delete permissions or mutation buttons.
- **PIN Protected**: 4-digit passcode lock (default `1234`) with iOS-style keypad to protect business financial figures.
- **Key Metrics**:
  - Today's Revenue (FCFA) & Order count
  - Gross & Net Profit calculations
  - Cash vs Orange Money / MTN MOMO breakdown
  - Outstanding Customer Debts (with 1-tap phone call button)
  - Inventory alerts (depleted out-of-stock & low-stock items)
  - Recent receipts feed
- **PWA (Install to Phone)**: Open on iPhone (Safari) or Android (Chrome) and tap **"Add to Home Screen"** for a full native app icon.

---

## 3-Minute Free Deployment to Vercel

1. Log into [vercel.com](https://vercel.com) with your GitHub account (`alinrbassam`).
2. Click **"Add New..."** -> **"Project"** -> Select your **`Zabad`** repository.
3. In the configuration screen:
   - Expand **"Root Directory"** -> Click **Edit** -> Select `dashboard`.
   - Expand **"Environment Variables"** and add:
     - `SYNC_SECRET_KEY`: `zabad-secret-key-2026` *(or your own secret token)*
     - `NEXT_PUBLIC_DASHBOARD_PIN`: `1234` *(or any 4-digit PIN you want for the phone)*
4. *(Optional for permanent cloud persistence)*:
   - In your Vercel project, go to the **Storage** tab.
   - Click **Create Database** -> Select **Upstash Redis** (100% Free tier).
   - Vercel automatically links the environment variables!
5. Click **"Deploy"**. Vercel will give you a free URL (e.g., `https://zabad-dashboard.vercel.app`).

---

## Connecting Desktop POS to Your Mobile Dashboard

1. Open **Zabad POS** on your store PC.
2. Go to **Settings** -> **Mobile App & Cloud**.
3. Toggle **Enable Cloud Synchronization** to ON.
4. Paste your Vercel Sync URL:
   ```
   https://zabad-dashboard.vercel.app/api/sync
   ```
5. Paste your Sync Secret Key (`zabad-secret-key-2026`).
6. Click **Save Configuration** then click **"Sync Now (Push to Mobile)"**.
7. The POS will now automatically transmit fresh numbers every 5 minutes and immediately whenever an order or expense is completed!
