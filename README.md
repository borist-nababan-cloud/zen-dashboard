# Zen Family Spa and Reflexology - Executive Panorama Dashboard

A real-time, high-performance executive dashboard for **Zen Family Spa and Reflexology**, providing continuous visibility into multi-outlet daily operations, revenue velocity, service mix distribution, and walk-in guest demand across all active branches.

---

## Key Highlights & Architectural Strengths

- **Direct Cloud Integration:** Consumes the centralized Supabase PostgreSQL database populated in real time by the Delphi `SyncAgent` daemon across 10+ operational outlets.
- **Timezone-Aware Intelligence:** Automatically computes today's local operational window (WIB/WITA) and queries UTC timestamps with zero boundary drift.
- **$O(N)$ Linear-Stream Aggregation:** Single-pass processing in `useDashboardData` combines master check-ins, split payment tenders (`payment1` + `payment2`), member points, and rejection metrics in sub-millisecond execution time.
- **Zen Design Language:** Tailored Zen palette (`#889D35` Matcha, `#D2C0A7` Bamboo Sand, `#F8F5F1` Rice Paper canvas, `#3C3C32` Charcoal typography) with subtle animations and fluid responsiveness.
- **The Zen Garden Hero:** Real-time visibility into Gross Sales, Physical Cash on Hand, Active In-Room Treatments, and Completed Services.
- **Branch Panorama Cards:** Multi-tenant cards with target revenue progress tracks, treatment category mix, and walk-in rejection counts.
- **Finance & Promo Matrix:** Comprehensive tender breakdown resolving multi-tender and split-bill payments, discount absorption, and promo campaign ROI.

---

## Tech Stack

- **Framework:** React 18 + TypeScript + Vite 6
- **Runtime & Tooling:** Bun 1.3 / Node
- **Styling:** Tailwind CSS with Zen custom design tokens
- **Data Engine:** `@supabase/supabase-js`
- **Icons:** `lucide-react`
- **Date / Time:** `date-fns`

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (Recommended) or Node.js (v18+)

### Installation
```bash
# Install dependencies
bun install
```

### Development Server
```bash
# Launch live dev server at http://localhost:5174
bun run dev
```

### Production Build
```bash
# Compile optimized production bundle
bun run build
```

---

## Deployment & Repository Sync

```bash
git init
git add .
git commit -m "feat: initial dashboard structure with Zen branding and Supabase config"
git branch -M main
git remote add origin https://github.com/borist-nababan-cloud/zen-dashboard.git
git push -u origin main
```

---

&copy; 2026 Zen Family Spa and Reflexology. All rights reserved.
