## 1. Data Integrity
- Timezone: Queries must calculate "Today" based on the user's local timezone and filter UTC timestamps in Supabase accordingly.
- Multi-Tenancy: Every calculation must be scoped by `kode_outlet`.
- Filtering: Only show data where `master_outlet.active = true`.
## 2. Product Requirement Document (PRD)

#### **PRD: Zen Panorama Dashboard**

**1. Objective:** 
Provide a real-time, high-level overview of daily operations across all Zen Family Spa outlets to support executive decision-making.

**2. Key Visual Components:**

*   **Global Summary Card (The "Zen Garden"):**
    *   Total Sales (Sum of `ot_pos_trans_payment_details.total`).
    *   Cash on Hand (Sum of `vcash`).
    *   Active Check-ins (Count `ot_pos_trans_master` where status is `STARTED`).
    *   Completed Transactions (Count `ot_pos_trans_master` where status is `PAID`).
*   **Individual Outlet Cards:**
    *   Loop through `master_outlet` where `active = true`.
    *   Metric A: Revenue Progress bar.
    *   Metric B: Service Mix (Pie chart of `typejasa`).
    *   Metric C: Rejection counter (from `ot_pos_trans_reject`).
*   **Finance & Promo Analysis:**
    *   Payment Method Breakdown: Merged sum of `payment1` + `payment2` amounts.
    *   Promo Impact: List of `namapromo` with total `vpromo` values.
    *   Discount Total: Sum of `vdisc`.

**3. Data Logic (The "Sync" Bridge):**
*   **Time Filtering:** For "Today's Activity," calculate `StartOfDay` and `EndOfDay` in the user's timezone.
*   **Relationship:** Join `ot_pos_trans_payment_details` with `ot_pos_trans_master` via `id_payment`.

---



## 3. Git Push Instructions

Run these commands in `D:\BEN\Zen\WORK_SPACE\frontend\dashboard`:

```bash
# Initialize and push to repository
echo "# Zen Family Spa - Global Panorama Dashboard" >> README.md
git init
git add .
git commit -m "feat: initial dashboard structure with Zen branding and Supabase config"
git branch -M main
git remote add origin https://github.com/borist-nababan-cloud/zen-dashboard.git
git push -u origin main
```

### Recommendation for First Step:
**"Create the Supabase schema types and the base Layout component using the #F8F5F1 background and #3C3C32 text color"** first. This will set the "Zen atmosphere" correctly before you dive into the complex data aggregations.