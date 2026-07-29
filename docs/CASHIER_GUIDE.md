# RMS Enterprise Cashier User Guide

This guide details everyday Point of Sale (POS) operations, barcode scanning, holding sales, payment processing, and 58mm/80mm thermal receipt printing.

---

## 1. POS Terminal Layout & Keyboard Hotkeys

The POS Terminal (`/pos`) is optimized for zero-mouse, ultra-fast keyboard & barcode scanner workflows:

| Hotkey | Action Description |
| :--- | :--- |
| **`F1`** | Focus Barcode / SKU Input box for instant scanning |
| **`F2`** | Open Product Search modal (search by Name, SKU, Category) |
| **`F3`** | Trigger Payment Checkout Modal |
| **`F4`** | Hold Current Sale (Suspend Cart for later) |
| **`F5`** | Open Held Sales Manager (Resume Suspended Cart) |
| **`F9`** | Register Shift Management (Open / Close Cash Register Shift) |
| **`Esc`** | Close Modals / Clear Active Search |

---

## 2. Processing a POS Checkout

1. **Scan Barcode**: Point USB barcode scanner at product label, or press `F1` and type barcode / SKU.
2. **Adjust Quantities**: Use `+` / `-` buttons or type decimal quantity (e.g. `2.5 kg`).
3. **Apply Item / Order Discounts**: Enter discount amount ($ or %).
4. **Trigger Payment (`F3`)**:
   - **Cash Payment**: Enter cash tendered; change due is calculated automatically.
   - **Card Payment**: Enter card transaction reference.
   - **Split Payment**: Combine Cash + Card payments.
5. **Print Thermal Receipt**: Receipt modal opens automatically for 58mm or 80mm ESC/POS thermal printing.

---

## 3. Holding & Resuming Sales

- **Hold Sale (`F4`)**: If a customer leaves the checkout counter, press `F4` to save the cart state.
- **Resume Sale (`F5`)**: Select any suspended transaction to restore cart items and complete checkout.

---

## 4. Sales History & Refunds

Navigate to **Sales History** (`/pos/history`):
- Search transactions by invoice number (e.g. `INV-2026-000001`).
- Reprint thermal receipts.
- Process item refunds or voids (reverses inventory ledger automatically under `Customer sale refund`).
