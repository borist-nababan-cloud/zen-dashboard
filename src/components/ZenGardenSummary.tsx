import React from 'react';
import {
  DollarSign,
  Wallet,
  Users,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Tag,
  Sparkles,
  ShoppingBag,
  Award,
  Layers,
  Footprints,
  HeartHandshake,
  Gift
} from 'lucide-react';
import { GlobalGardenSummary } from '../types/dashboard';

interface ZenGardenSummaryProps {
  summary: GlobalGardenSummary;
  selectedOutletName?: string;
}

export const ZenGardenSummary: React.FC<ZenGardenSummaryProps> = ({
  summary,
  selectedOutletName = 'All Active Outlets',
}) => {
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const { categoryMix, topItems } = summary;

  return (
    <section className="mb-8">
      {/* Section Sub-heading */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold font-serif text-zen-charcoal flex items-center gap-2">
            <span>Zen Family Spa & Reflexology</span>
            <span className="text-xs font-sans font-normal text-zen-muted bg-white px-2.5 py-0.5 rounded-full border border-zen-sand/40">
              {selectedOutletName}
            </span>
          </h2>
          <p className="text-xs text-zen-muted">Today's high-level operational velocity and financial liquidity</p>
        </div>
      </div>

      {/* 5 Primary Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-4 mb-5">
        
        {/* Card 1: Total Sales */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-4 sm:p-5 border border-zen-sand/40 shadow-zen hover:shadow-zen-hover transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zen-muted uppercase tracking-wider mb-1">
                Gross Revenue
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-zen-charcoal tracking-tight">
                {formatIDR(summary.totalSales)}
              </h3>
            </div>
            <div className="p-2 bg-zen-matcha/10 text-zen-matcha rounded-xl border border-zen-matcha/20 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-zen-moss" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zen-stone/60 flex items-center justify-between text-xs">
            <span className="text-zen-muted flex items-center">
              <Tag className="w-3.5 h-3.5 mr-1 text-zen-muted" />
              Discounts / Promos
            </span>
            <span className="font-semibold text-zen-bark">
              {formatIDR(summary.totalDiscounts)}
            </span>
          </div>
        </div>

        {/* Card 2: Cash on Hand */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-4 sm:p-5 border border-zen-sand/40 shadow-zen hover:shadow-zen-hover transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zen-muted uppercase tracking-wider mb-1">
                Cash on Hand
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-zen-charcoal tracking-tight">
                {formatIDR(summary.cashOnHand)}
              </h3>
            </div>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zen-stone/60 flex items-center justify-between text-xs">
            <span className="text-zen-muted">Physical Drawer Share</span>
            <span className="font-semibold text-zen-bark">
              {summary.totalSales > 0
                ? `${Math.round((summary.cashOnHand / summary.totalSales) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

        {/* Card 3: GC Payment (Gift Certificate Redemptions) */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-4 sm:p-5 border border-purple-200/70 shadow-zen hover:shadow-zen-hover transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider mb-1">
                GC Payment
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-purple-900 tracking-tight">
                {formatIDR(summary.gcPayment || 0)}
              </h3>
            </div>
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl border border-purple-200 group-hover:scale-110 transition-transform">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zen-stone/60 flex items-center justify-between text-xs">
            <span className="text-zen-muted">Vouchers Redeemed</span>
            <span className="font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/50">
              {summary.gcPaymentCount || 0} vouchers
            </span>
          </div>
        </div>

        {/* Card 4: Active Check-ins */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-4 sm:p-5 border border-zen-sand/40 shadow-zen hover:shadow-zen-hover transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zen-muted uppercase tracking-wider mb-1">
                Active In-Service
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-zen-charcoal tracking-tight flex items-baseline">
                {summary.activeCheckIns}
                <span className="text-xs font-normal text-zen-muted ml-1.5">guests</span>
              </h3>
            </div>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zen-stone/60 flex items-center justify-between text-xs">
            <span className="text-zen-muted flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Live in Rooms
            </span>
            <span className="font-semibold text-emerald-700">Currently Serving</span>
          </div>
        </div>

        {/* Card 5: Completed Transactions */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-4 sm:p-5 border border-zen-sand/40 shadow-zen hover:shadow-zen-hover transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zen-muted uppercase tracking-wider mb-1">
                Completed
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-zen-charcoal tracking-tight flex items-baseline">
                {summary.completedTransactions}
                <span className="text-xs font-normal text-zen-muted ml-1.5">orders</span>
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zen-stone/60 flex items-center justify-between text-xs">
            <span className="text-zen-muted flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Rejections
            </span>
            <span className="font-semibold text-amber-700">
              {summary.totalRejections} walk-ins
            </span>
          </div>
        </div>

      </div>

      {/* Services & Products Operational Mix (ot_pos_trans_detail) */}
      <div className="bg-white rounded-2xl p-5 border border-zen-sand/40 shadow-zen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-zen-stone/60">
          <div>
            <h3 className="text-sm font-bold text-zen-charcoal flex items-center gap-2">
              <Layers className="w-4 h-4 text-zen-matcha" />
              <span>Services & Products Breakdown</span>
            </h3>
            <p className="text-[11px] text-zen-muted">
              Granular detail counts of services, treatments, retail products, and gift certificates
            </p>
          </div>
          <span className="self-start sm:self-auto text-xs font-semibold text-zen-moss bg-zen-paper px-3 py-1 rounded-full border border-zen-sand/40">
            Total {categoryMix.total} items rendered
          </span>
        </div>

        {/* 5 Operational Categories Grid (Foot & Body BJ, Additional BA, Product BP, GC Sales BG & GC Payment GCP) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {/* 1. Foot & Body (BJ) */}
          <div className="p-3.5 rounded-xl bg-zen-paper/70 border border-zen-sand/30 hover:border-zen-matcha/50 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zen-muted">Foot & Body</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zen-matcha/15 text-zen-moss">BJ</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-zen-charcoal">
              {categoryMix.footAndBody}
            </p>
            <span className="text-[10px] text-zen-muted">treatments</span>
          </div>

          {/* 2. Additional (BA) */}
          <div className="p-3.5 rounded-xl bg-zen-paper/70 border border-zen-sand/30 hover:border-zen-matcha/50 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zen-muted">Additional</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-700">BA</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-zen-charcoal">
              {categoryMix.additional}
            </p>
            <span className="text-[10px] text-zen-muted">add-ons</span>
          </div>

          {/* 3. Product (BP) */}
          <div className="p-3.5 rounded-xl bg-zen-paper/70 border border-zen-sand/30 hover:border-zen-matcha/50 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zen-muted">Product</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-700">BP</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-zen-charcoal">
              {categoryMix.product}
            </p>
            <span className="text-[10px] text-zen-muted">retail units</span>
          </div>

          {/* 4. GC Sales (BG) */}
          <div className="p-3.5 rounded-xl bg-zen-paper/70 border border-zen-sand/30 hover:border-zen-matcha/50 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zen-muted">GC Sales</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-700">BG</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-zen-charcoal">
              {categoryMix.gcSales}
            </p>
            <span className="text-[10px] text-zen-muted">vouchers sold</span>
          </div>

          {/* 5. GC Payment (Redeemed) */}
          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80 hover:border-purple-400 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">GC Payment</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-200/80 text-purple-900">GCP</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-purple-900">
              {summary.gcPaymentCount || 0}
            </p>
            <span className="text-[10px] font-medium text-purple-700 truncate block" title={formatIDR(summary.gcPayment || 0)}>
              {formatIDR(summary.gcPayment || 0)}
            </span>
          </div>
        </div>

        {/* Top Treatments & Products (exclude null) */}
        {topItems.length > 0 && (
          <div className="pt-3 border-t border-zen-stone/60">
            <div className="flex items-center justify-between text-xs text-zen-muted mb-2 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zen-matcha" />
                <span>Top Treatments & Products Today (Exclude Null)</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zen-muted">Ranked by Qty</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {topItems.map((item, idx) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-2 rounded-lg bg-zen-paper/50 border border-zen-sand/30 text-xs"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-5 h-5 rounded flex items-center justify-center bg-white text-[10px] font-bold text-zen-moss border border-zen-sand/40">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-zen-charcoal truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <span className="ml-2 font-mono font-bold text-zen-moss bg-white px-2 py-0.5 rounded border border-zen-sand/30 flex-shrink-0">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

