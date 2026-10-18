# Zen Panorama Dashboard Project Summary (Updated Oct 18, 2026)

## 1. Overview
The **Zen Family Spa and Reflexology** Executive Panorama Dashboard (`frontend\dashboard`) provides a real-time, high-level operational overview across all active Zen Family Spa outlets. The application consumes data synchronized to the central Supabase PostgreSQL cloud directly by the Delphi `SyncAgent` daemon.

## 2. Infrastructure, Containerization & Deployment
- **Repository:** Synchronized and pushed with `https://github.com/borist-nababan-cloud/zen-dashboard.git` on branch `main`.
- **Framework:** React 18 + TypeScript + Vite 6 + Tailwind CSS.
- **Production Containerization:** 
  - Multi-stage `Dockerfile`: Node 20 builder $\to$ Nginx Alpine runner (~25MB image size).
  - Production `nginx.conf`: Single Page Application (SPA) routing (`try_files $uri $uri/ /index.html;`), Gzip compression, immutable asset caching headers, no-cache on `index.html`, security headers, and `/healthz` healthcheck endpoint.
  - Performance chunk splitting configured in `vite.config.js` (`manualChunks` for React, Supabase, Lucide, and utils).
  - Coolify-ready via Dockerfile build pack or Docker Compose (`docker-compose.yml`).

## 3. Architecture & Algorithmic Optimization
- **Data Hook (`useDashboardData`):**
  - **$O(1)$ Network Roundtrip:** Parallel queries (`master_outlet`, `ot_pos_trans_master`, `ot_pos_trans_detail`, `ot_pos_trans_payment_details`, `ot_pos_trans_reject`) executed concurrently via `Promise.all`.
  - **Operational Date Filtering:** Seamlessly leverages indexed `tanggal` column with fallback pattern `id_payment.like.%.PAY.${yymmdd}%`.
  - **Standardized 4-Category Treatment & Product Mix Breakdown:**
    - `"BJ"` : **Foot & Body** (Core spa, massage, and reflexology services; maps legacy BM and RF)
    - `"BA"` : **Additional** (Add-on service charges)
    - `"BP"` : **Product** (Retail items; maps legacy PR)
    - `"BG"` : **GC Sales** (Gift Certificate voucher sales)
  - **Strict Active In-Service Calculation:** Enforces `status_trans = 'STARTED' AND subtotal > 0`, strictly eliminating draft check-ins with `subtotal = 0`.
  - **Consolidated Payment Tenders:** Merges primary tenders (`payment1` + `vpayment1` + `bank1`), split-bill tenders (`payment2` + `vpayment2` + `bank2`), cash, and vouchers (`payment1 = 'VOUCHER'` and `vgift`).
  - **Systemic Timezone-Drift RCA & Permanent Resolution:**
    - **RCA:** Browser-local `Date` methods (`now.getHours()`, `now.toISOString()`, `now.toLocaleTimeString()`) caused operational shift boundaries and queries to drift based on client device geography. Simultaneously, `ot_pos_trans_reject` was the only transaction table lacking a native `tanggal DATE` column, causing local timestamp strings pushed by `SyncAgent` to be interpreted as UTC and queried with client timezone offsets.
      - **Resolution:**
        - Added native `tanggal DATE` column, composite index `(tanggal, kode_outlet)`, and `NOT NULL` constraint to `ot_pos_trans_reject` across Local, Staging, and Production Supabase (`20261017140000` & `20261017150000`).
        - Implemented PostgreSQL trigger `trg_ensure_tanggal_reject` that auto-calculates `tanggal` in `Asia/Jakarta` time from `reject_date` on every INSERT/UPDATE if omitted, guaranteeing zero nulls at the storage engine level.
        - Implemented [`dateUtils.ts`](file:///d:/BEN/Zen/WORK_SPACE/frontend/dashboard/src/lib/dateUtils.ts) establishing `Asia/Jakarta` (WIB, UTC+7) as the authoritative master business clock.
        - Updated `Header.tsx` to display true live WIB clock via `getWIBLiveClockString()`, with an interactive "Today" reset button when viewing historical dates.
        - Unified `useDashboardData.ts` to query `ot_pos_trans_reject` via strict indexed `.eq('tanggal', localDateStr)`.
        - Enforced active outlet membership (`if (!outletMap.has(entity.kode_outlet)) continue;`) and strict operational date guards across master, detail, payment, and rejection aggregation loops.
- **Live Sync & Telemetry:** 30-second auto-refresh countdown with visibility-pause detection and manual trigger.

## 4. Visual Design & Zen Brand Identity
- **Branding Assets:** Integrated company logo (`Logo150x150.png`, `Logo150x150.jpg`) and application favicon (`favicon.ico`) directly from `desktop\ZenSystem`.
- **Palette Tokens:** `zen-matcha` (#889D35), `zen-sand` (#D2C0A7), `zen-paper` (#F8F5F1), `zen-charcoal` (#3C3C32), `zen-moss` (#6E8027).
- **Core Visual Modules:**
  1. **Header:** Live WIB clock, operational date picker with "Today" reset action, active branch filter dropdown, auto-refresh countdown, brand logo, and streamlined subtitle ("Executive Multi-Outlet Real-time").
  2. **The Zen Garden Summary:** Primary Hero KPIs (Gross Sales, Cash on Hand, Active Guests In-Service, Completed Treatments, 5-card Services & Products Breakdown).
  3. **Branch Panorama Grid:** Active outlet cards featuring daily target revenue progress bars, 4-pill treatment service mix (`BJ`, `BA`, `BP`, `BG`), and walk-in rejection counts.
  4. **Finance & Promo Matrix:** Consolidated tender breakdown (Cash, Card/EDC, QRIS, Voucher) and promotion / discount absorption.
  5. **Rejection & Bottleneck Analysis:** Capacity bottleneck diagnostics on walk-in cancellations.

## 5. Verification & Build
- Production bundle compiled with zero type or build errors (`dist/index.html`, `dist/assets/`).
- Validated against live production Supabase database (`ihdlwogvjfgawgsalgng.supabase.co`).
- Pushed live to GitHub repository `borist-nababan-cloud/zen-dashboard:main`.
