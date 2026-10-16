import React from 'react';
import { DollarSign, Wallet, Users, CheckCircle2, TrendingUp, AlertTriangle, Tag } from 'lucide-react';
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

  return (
    <section className="mb-8">
      {/* Section Sub-heading */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold font-serif text-zen-charcoal flex items-center gap-2">
            <span>The Zen Garden</span>
            <span className="text-xs font-sans font-normal text-zen-muted bg-white px-2.5 py-0.5 rounded-full border border-zen-sand/40">
              {selectedOutletName}
            </span>
          </h2>
          <p className="text-xs text-zen-muted">Today's high-level operational velocity and financial liquidity</p>
        </div>
      </div>

      {/* 4 Primary Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Total Sales */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-zen-sand/40 shadow-zen hover:shadow-zen-hover transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-zen-muted uppercase tracking-wider mb-1">
                Gross Revenue
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-zen-charcoal tracking-tight">
                {formatIDR(summary.totalSales)}
              </h3>
            </div>
            <div className="p-2.5 bg-zen-matcha/10 text-zen-matcha rounded-xl border border-zen-matcha/20 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5 text-zen-moss" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zen-stone/60 flex items-center justify-between text-xs">
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
        <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-zen-sand/40 shadow-zen hover:shadow-zen-hover transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-zen-muted uppercase tracking-wider mb-1">
                Cash on Hand
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-zen-charcoal tracking-tight">
                {formatIDR(summary.cashOnHand)}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zen-stone/60 flex items-center justify-between text-xs">
            <span className="text-zen-muted">Physical Drawer Share</span>
            <span className="font-semibold text-zen-bark">
              {summary.totalSales > 0
                ? `${Math.round((summary.cashOnHand / summary.totalSales) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

        {/* Card 3: Active Check-ins */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-zen-sand/40 shadow-zen hover:shadow-zen-hover transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-zen-muted uppercase tracking-wider mb-1">
                Active In-Service
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-zen-charcoal tracking-tight flex items-baseline">
                {summary.activeCheckIns}
                <span className="text-xs font-normal text-zen-muted ml-2">guests</span>
              </h3>
            </div>
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zen-stone/60 flex items-center justify-between text-xs">
            <span className="text-zen-muted flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Live in Rooms
            </span>
            <span className="font-semibold text-emerald-700">Currently Serving</span>
          </div>
        </div>

        {/* Card 4: Completed Transactions */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-zen-sand/40 shadow-zen hover:shadow-zen-hover transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-zen-muted uppercase tracking-wider mb-1">
                Completed Treatments
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-zen-charcoal tracking-tight flex items-baseline">
                {summary.completedTransactions}
                <span className="text-xs font-normal text-zen-muted ml-2">paid orders</span>
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zen-stone/60 flex items-center justify-between text-xs">
            <span className="text-zen-muted flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Rejections / Missed
            </span>
            <span className="font-semibold text-amber-700">
              {summary.totalRejections} walk-ins
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
