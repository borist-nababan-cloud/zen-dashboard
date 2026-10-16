# Zen Dashboard Development Rules

## 1. Technical Stack
- Framework: React (Vite)
- Language: TypeScript (Strict)
- Styling: Tailwind CSS
- Icons: Lucide React
- Charts: Recharts (Clean, Zen aesthetic)
- Data Fetching: Supabase-js (Client side)

## 2. Branding & Aesthetic (Zen Philosophy)
- Palette: 
  - Primary: #889D35 (Bamboo Green - Action/Success)
  - Stone: #D2C0A7 (Warm Sand - Accents)
  - Background: #F8F5F1 (Linen White - Base)
  - Text: #3C3C32 (River Stone - Contrast)
- UI: Use soft rounded corners (2xl), ample white space, and subtle shadows to reflect a "calm spa" atmosphere.

## 3. Data Integrity
- Timezone: Queries must calculate "Today" based on the user's local timezone and filter UTC timestamps in Supabase accordingly.
- Multi-Tenancy: Every calculation must be scoped by `kode_outlet`.
- Filtering: Only show data where `master_outlet.active = true`.