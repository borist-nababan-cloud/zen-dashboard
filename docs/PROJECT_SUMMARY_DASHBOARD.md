# Zen Panorama Dashboard Project Summary (Updated Oct 16, 2026)

## 1. Overview
The **Zen Family Spa and Reflexology** Executive Panorama Dashboard (`frontend\dashboard`) provides a real-time, high-level operational overview across all active Zen Family Spa outlets. The application consumes data synchronized to the central Supabase PostgreSQL cloud directly by the Delphi `SyncAgent` daemon.

## 2. Infrastructure & Repository
- **Repository:** Initialized and synchronized with `https://github.com/borist-nababan-cloud/zen-dashboard.git` on branch `main`.
- **Framework:** React 18 + TypeScript + Vite 6 + Tailwind CSS.
- **Runtime:** Built and packaged with Bun 1.3.4.

## 3. Architecture & Algorithmic Optimization
- **Data Hook (`useDashboardData`):**
  - **$O(1)$ Network Roundtrip:** 4 parallel queries (`master_outlet`, `ot_pos_trans_master`, `ot_pos_trans_payment_details`, `ot_pos_trans_reject`) executed concurrently via `Promise.all`.
  - **$O(N)$ Linear-Stream Aggregation:** Single-pass iteration calculating gross sales, physical cash, live active in-room guests, completed treatments, and split-payment consolidations.
  - **Timezone Awareness:** Computes today's operational window based on local time (Asia/Jakarta WIB UTC+7), querying UTC timestamps with exact boundary alignment.
  - **Payment Merging:** Merges primary tenders (`payment1` + `vpayment1` + `bank1`) and split-bill tenders (`payment2` + `vpayment2` + `bank2`), alongside cash and gift certificates.
- **Live Sync & Telemetry:** 30-second auto-refresh countdown with visibility-pause detection (`document.visibilityState === 'visible'`) and manual trigger.

## 4. Visual Design & Zen Brand Identity
- **Branding Assets:** Integrated company logo (`Logo150x150.png`, `Logo150x150.jpg`) and application favicon (`favicon.ico`) directly from `desktop\ZenSystem`.
- **Palette Tokens:**
  - `zen-matcha`: `#889D35` (Accent Brand Green)
  - `zen-sand`: `#D2C0A7` (Muted Warm Bamboo)
  - `zen-paper`: `#F8F5F1` (Rice Paper Canvas)
  - `zen-charcoal`: `#3C3C32` (High-contrast typography)
  - `zen-moss`: `#6E8027`
- **Core Visual Modules:**
  1. **Header:** Live WIB clock, active branch filter dropdown, auto-refresh countdown, and branding.
  2. **The Zen Garden Summary:** Primary Hero KPIs (Gross Sales, Cash on Hand, Active Guests In-Service, Completed Treatments).
  3. **Branch Panorama Grid:** Active outlet cards featuring daily target revenue progress bars, treatment service mix pills, and walk-in rejection counts.
  4. **Finance & Promo Matrix:** Consolidated tender breakdown and promotion ROI / discount absorption.
  5. **Rejection & Bottleneck Analysis:** Capacity bottleneck diagnostics on walk-in cancellations.

## 5. Verification & Build
- Production bundle compiled with zero type or build errors (`dist/index.html`, `dist/assets/`).
- Validated against live production Supabase database (`ihdlwogvjfgawgsalgng.supabase.co`).
