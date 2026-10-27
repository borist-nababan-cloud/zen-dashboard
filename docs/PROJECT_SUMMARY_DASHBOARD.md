# Zen Panorama Dashboard Project Summary (Updated Oct 26, 2026)

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
- **Human Resources & On-Duty Staff Analytics (`ot_hrd_absen_harian` + `ot_hrd_karyawan_info`):**
  - Evaluates biometric fingerprint scans with standard shift completion logic: if `(fp_out - fp_in) >= 2 hours`, employee is marked off-duty and excluded from active count.
  - Dynamically resolves department codes from employee master records and tracks specialized rosters:
    - `"TR"` : Therapist Foot / Reflexology roster (`activeTR`)
    - `"TB"` : Therapist Body Massage roster (`activeTB`)
    - Full distribution across supporting departments (`FO`, `KASIR`, `HK`, `OB`, `SC`, `SPV`).
- **Room & Therapist Capacity & Velocity Engine (`RoomTherapistAnalysis`):**
  - **Room Analytics (`ot_master_room`):** Real-time mapping against active `STARTED` transactions, calculating registered, in-use, and available rooms split into Body Massage (`BM`) and Foot/Reflexology (`RF`), with live Occupancy % and daily turnover velocity.
  - **Therapist Analytics:** Compares in-charge therapists (`TR` & `TB`) with therapists currently serving guests in `ot_pos_trans_master` (`TR = RF`, `TB = BM`), providing instant live utilization %, idle therapist availability, and daily productivity ratios.
  - **Branch Grid Live Capacity:** Individual branch cards in `OutletPanoramaGrid` display live staff and room availability indicators.
- **Complete Treatments & Products Catalog:**
  - Removed top-6 limit; displays 100% of distinct services and retail items rendered today, strictly sorted by QTY descending within a responsive scrollable grid.
- **Operational Date Lock:** Locked header date picker (`readOnly` and `disabled`) to prevent client-side calendar manipulation, permanently tethered to authoritative Indonesian WIB operational shifts.
- **Prominent Outlet Hero Banner:** High-contrast `[ KODE_OUTLET ]` bamboo green badge, large serif typography, and instant one-click `"← Back to All Outlets"` navigation.

## 4. Visual Design & Zen Brand Identity
- **Branding Assets:** Integrated company logo (`Logo150x150.png`, `Logo150x150.jpg`) and application favicon (`favicon.ico`) directly from `desktop\ZenSystem`.
- **Palette Tokens:** `zen-matcha` (#889D35), `zen-sand` (#D2C0A7), `zen-paper` (#F8F5F1), `zen-charcoal` (#3C3C32), `zen-moss` (#6E8027).
- **Core Visual Modules:**
  1. **Header:** Live WIB clock, locked operational date indicator, active branch filter dropdown, auto-refresh countdown, brand logo, and streamlined subtitle ("Executive Multi-Outlet Real-time").
  2. **The Zen Garden Summary:** Primary Hero KPIs (Gross Sales, Cash on Hand, GC Payment, Active Guests In-Service, Completed Treatments, 5-card Services & Products Breakdown, Full Catalog QTY Ranking).
  3. **Room & Therapist Analytics:** Real-time staffing, capacity meters, room availability split (BM vs RF), and therapist utilization (TR vs TB).
  4. **Branch Panorama Grid:** Active outlet cards featuring daily target revenue progress bars, live staff & room indicators, 4-pill treatment service mix (`BJ`, `BA`, `BP`, `BG`), and walk-in rejection counts.
  5. **Finance & Promo Matrix:** Consolidated tender breakdown (Cash, Card/EDC, QRIS, Voucher) and promotion / discount absorption.
  6. **Rejection & Bottleneck Analysis:** Capacity bottleneck diagnostics on walk-in cancellations.

## 5. Verification & Build
- Production bundle compiled with zero type or build errors (`dist/index.html`, `dist/assets/`).
- Validated against live production Supabase database (`ihdlwogvjfgawgsalgng.supabase.co`).
- Pushed live to GitHub repository `borist-nababan-cloud/zen-dashboard:main`.
- **Database Hardening & Local/Staging Parity (Oct 20, 2026):**
  - Confirmed zero disruption to dashboard data feeds after enabling RLS on `pos_trans_point_member` and setting views to `security_invoker`.
  - Local (`127.0.0.1:54322`) and Staging (`okchlapizmhoueeeldrh`) environments now replicate 100% of live production records via `sync_prod_to_env.ps1`, allowing full offline executive dashboard preview with realistic transaction volumes.
- **Staging Transaction & Attendance Sync Parity (Oct 22, 2026):**
  - Staging Cloud environment now matches live Production POS and HRD data 100% via `restore_prod_tables_to_staging.ps1`, enabling realistic dashboard validation without impacting authentication or user state.
- **Cross-App Ecosystem Harmonization (Oct 23, 2026):**
  - The executive dashboard's 4-category service mix (`BJ` Foot & Body, `BA` Additional) and live therapist roster (`TR` Reflexology, `TB` Body) directly harmonize with Zen Internal Super-App's therapist commission calculations (`master_komisi_rate`) and biometric attendance modules, ensuring multi-outlet managers and staff review identical numbers.
- **Warehouse & Finance Decoupling Stability (Oct 24, 2026):**
  - Schema evolutions and RLS policy activations on warehouse tables (`purchase_orders`, `master_financial_accounts`, `finance_transaction_categories`, `stock_opname_headers`) operate in complete isolation from the executive dashboard's real-time queries.
  - Live WIB operational date filtering, therapist capacity velocity, and multi-outlet revenue progress tracking maintain 100% stability.
- **Master Outlet Metadata & Zen Brand Design Alignment (Oct 26, 2026):**
  - **Enhanced Outlet Metadata:** Coordinate data (`location` JSON), contact numbers, and operational flags (`can_sto`) maintained via WHMS Role 6 "Info Outlet" module are available to enrich executive branch overview cards with interactive Google Maps links.
  - **Design System Harmonization:** The Zen Natural Dark Mode tokens (`#191914` River Stone, `#22221B` Dark Stone Surface, `#9BB33B` Luminous Matcha) established in WHMS provide a proven design system reference for future dark mode implementation in the Panorama Dashboard.
  - **Database Parity & View Isolation:** The 7 new STO reporting views and UUID audit field triggers operate cleanly without interfering with dashboard real-time aggregation queries on `ot_pos_trans_master`, `detail`, `payment`, and `reject`.
- **Production Parity & Warehouse Live Independence (Oct 27, 2026):**
  - WHMS live deployment on Coolify (`https://latihan-whmapp.zenfamilyspa.id` and `https://whmapp.zenfamilyspa.id/`) runs alongside the dashboard with complete microservice decoupling.
  - Seeding of all 20 outlets in Production (`ihdlwogvjfgawgsalgng`) guarantees that Dashboard outlet queries on `master_outlet` reflect authoritative branch details.
- **Progressive Web App (PWA) Transformation & Native Install Shortcut (Oct 27, 2026):**
  - **Vite PWA Integration (`vite-plugin-pwa`):** Upgraded build configuration to generate standalone Web App Manifest and Workbox Service Worker (`sw.js`, `registerSW.js`) with cache-first strategy for Google Fonts (`Playfair Display`, `Plus Jakarta Sans`) and local application shell assets.
  - **Flexible Multi-Device Orientation:** Manifest configured with `orientation: 'any'` and `display: 'standalone'` supporting seamless responsive usage across executive smartphones (portrait) as well as executive tablets, laptops, and Head Office TV Wall displays (landscape).
  - **High-Resolution Icon Suite:** Integrated full icon set in `public/` (`pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, `apple-touch-icon.png`, `masked-icon.svg`, and `logo.png`) with Zen brand `#889D35` theme color.
  - **PWA Installation Hook & Banner (`usePWAInstall.ts`, `PWAInstallBanner.tsx`):**
    - Dual platform support: native one-click install for Android, Windows, and Chromium Edge/Chrome (`beforeinstallprompt`), plus interactive 3-step modal guide for iOS Safari ("Add to Home Screen").
    - Collision-free positioning: Docked at bottom-left (`fixed bottom-5 left-4 sm:left-6 sm:max-w-md`) to ensure zero visual overlap with the TV Auto-Scroll controller (`bottom-5 right-5`).
    - Smart dismissal: Persists 24-hour snooze preference in `localStorage` (`zen_dashboard_pwa_dismissed_until`).
  - **Nginx Web Server Hardening (`nginx.conf`):** Added zero-stale cache directives for `sw.js`, `registerSW.js`, and `manifest.webmanifest` (`no-cache, no-store, must-revalidate`) and enabled `application/manifest+json` compression.
  - **Build Verification:** 100% verified with `vite build` generating 27 precached entries (~1.1 MB), 0 linter or build errors.

