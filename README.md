# BoothPOS V2 — Art Fest Terminal

> **100% Local-First, Offline-Ready Point of Sale designed for creator conventions, art markets, and multi-artist booths.**

---

## ✨ Features Built for Your Booth

1. **⚡ 100% Offline-First Architecture**:
   - Zero reliance on external servers or convention venue Wi-Fi.
   - Built on **Dexie.js (IndexedDB)**: all data, transactions, and product photos persist permanently on your iPad or device.
   - Works flawlessly in Airplane mode.

2. **📱 iPad-Optimized Landscape Layout**:
   - **Large Visual Touch Buttons**: Big product tiles with crisp photos, prices, artist tags, and in-stock badges.
   - **Category & Sub-Category Pills**: Instant filtering (e.g. `Stickers` → `Sheet A5`, `Die-cut`, `Stamps`).
   - **Cart Drawer**: Always visible on the right with large `+` and `-` quantity steppers.

3. **📴 Offline EMVCo PromptPay QR Generator**:
   - Generates official Bank of Thailand standard EMVCo QR codes with exact payment amounts directly in JavaScript.
   - **Zero external API calls** (no dependency on `promptpay.io` or external image hosts).

4. **💵 Quick Cash Change Calculator**:
   - One-tap buttons for common Thai bills: `฿20`, `฿50`, `฿100`, `฿500`, `฿1,000`, and `Exact`.
   - Clear, bold "Change Due" display to eliminate mental math errors during high-speed checkout rush hours.

5. **🏷️ Specific Item Bundle Deals**:
   - Built-in bundle pricing (e.g. *1 for ฿55, 2 for ฿100*).
   - Real-time savings badge in cart and on product cards.

6. **🎨 Multi-Artist Sales Tracking & Settlement**:
   - Each item is assigned an artist (e.g., `INK`, `Field`, `General`).
   - Live settlement summary showing:
     - Items sold per artist
     - Cash collected vs. PromptPay received per artist
     - Net payout owed to each artist

7. **📊 Instant CSV Exports**:
   - **Export Transactions CSV**: Download complete order ledger with timestamps, receipt IDs, payment methods, and artist breakdowns.
   - **Export Items Sold CSV**: Line-by-line export for deep spreadsheet bookkeeping.
   - **Export Catalog CSV**: Backup your full product catalog anytime.

8. **🖼️ Local Photo Storage**:
   - Photos uploaded directly from your iPad are converted to local Data URLs and saved inside the browser's IndexedDB.
   - Photos display instantly at 0ms latency even with zero internet.

9. **📈 1-Click Google Sheets Sync**:
   - Sync transactions, line-by-line item sales, and artist payouts directly to your personal Google Sheet with a single tap.
   - Built-in copyable Google Apps Script webhook code ready to paste into `Extensions > Apps Script`.

---

## 🚀 Getting Started

### 1. Start Local Development Server
```bash
cd C:\Antigravity\V2_art_pos
npm run dev
```
Open the local URL (e.g., `http://localhost:5173`) in Safari or Chrome on your iPad.

### 2. Add to iPad Home Screen (Full Screen App Mode)
1. On your iPad in Safari, open the POS URL.
2. Tap the **Share** button in Safari.
3. Tap **"Add to Home Screen"**.
4. Launch BoothPOS directly from your Home Screen — it will run full-screen just like a native iPad app!

### 3. Quick Catalog Setup
- **Sample Art Fest Data**: Go to the **Products & CSV** tab and tap **"Sample Data"** to load 10 sample items.
- **Import Real Products**: Tap **"Import Real_product.csv"** to immediately load your 120+ item catalog from your previous art booth.
- **Add Direct in App**: Tap **"Add Product"** to create an item and upload photos directly from your iPad photo library.
