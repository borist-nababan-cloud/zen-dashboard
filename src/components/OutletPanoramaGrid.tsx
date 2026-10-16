import React from 'react';
import { OutletCardMetrics } from '../types/dashboard';
import { Store, UserCheck, AlertCircle, Sparkles, MapPin, TrendingUp } from 'lucide-react';

interface OutletPanoramaGridProps {
  outlets: OutletCardMetrics[];
  selectedOutletCode: string;
  onSelectOutlet: (code: string) => void;
}

export const OutletPanoramaGrid: React.FC<OutletPanoramaGridProps> = ({
  outlets,
  selectedOutletCode,
  onSelectOutlet,
}) => {
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredList =
    selectedOutletCode === 'ALL'
      ? outlets
      : outlets.filter((o) => o.outlet.kode_outlet === selectedOutletCode);

  return (
    <section className="mb-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-bold font-serif text-zen-charcoal flex items-center gap-2">
            <Store className="w-5 h-5 text-zen-matcha" />
            <span>Branch Panorama</span>
            <span className="text-xs font-sans font-medium text-zen-muted bg-white px-2 py-0.5 rounded-full border border-zen-sand/40">
              {filteredList.length} Outlets
            </span>
          </h2>
          <p className="text-xs text-zen-muted">
            Individual branch target progress, service composition, and floor occupancy
          </p>
        </div>
      </div>

      {/* Grid of Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredList.map((item) => {
          const { outlet, totalSales, targetSales = 10000000, progressPercent, activeGuests, completedGuests, rejectionCount, serviceMix } = item;
          const serviceEntries = Object.entries(serviceMix).sort((a, b) => b[1] - a[1]);
          const totalServices = serviceEntries.reduce((sum, [, count]) => sum + count, 0);

          return (
            <div
              key={outlet.kode_outlet}
              onClick={() => onSelectOutlet(outlet.kode_outlet)}
              className={`group bg-white rounded-2xl p-5 border transition-all duration-300 cursor-pointer relative overflow-hidden shadow-zen hover:shadow-zen-hover ${
                selectedOutletCode === outlet.kode_outlet
                  ? 'border-zen-matcha ring-2 ring-zen-matcha/30'
                  : 'border-zen-sand/40 hover:border-zen-matcha/60'
              }`}
            >
              {/* Header: Outlet Code & Name */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-zen-paper flex items-center justify-center border border-zen-sand/40 text-xs font-mono font-bold text-zen-moss group-hover:bg-zen-matcha group-hover:text-white transition-colors">
                    {outlet.kode_outlet}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zen-charcoal group-hover:text-zen-moss transition-colors line-clamp-1">
                      {outlet.name_outlet}
                    </h3>
                    <p className="text-[11px] text-zen-muted flex items-center">
                      <MapPin className="w-3 h-3 mr-0.5 text-zen-sand" />
                      {outlet.city || outlet.province || 'Indonesia'}
                    </p>
                  </div>
                </div>

                {/* Live Activity Dot */}
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{activeGuests} Active</span>
                </span>
              </div>

              {/* Metric A: Revenue & Target Progress Bar */}
              <div className="my-3.5 p-3 bg-zen-paper/60 rounded-xl border border-zen-sand/30">
                <div className="flex items-baseline justify-between mb-1.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zen-muted tracking-wider">
                      Today's Revenue
                    </span>
                    <p className="text-base sm:text-lg font-extrabold text-zen-charcoal">
                      {formatIDR(totalSales)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zen-muted">Daily Target</span>
                    <p className="text-xs font-semibold text-zen-bark">
                      {progressPercent}%
                    </p>
                  </div>
                </div>

                {/* Progress Track */}
                <div className="w-full bg-zen-stone rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-zen-sand to-zen-matcha h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(progressPercent, 4))}%` }}
                  ></div>
                </div>
              </div>

              {/* Metric B: Service Mix (Category Distribution) */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] text-zen-muted mb-1.5 font-medium">
                  <span>Service Mix</span>
                  <span>{totalServices} treatments</span>
                </div>

                {serviceEntries.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {serviceEntries.slice(0, 3).map(([cat, count]) => (
                      <span
                        key={cat}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-zen-cream text-zen-charcoal border border-zen-sand/40"
                      >
                        <span className="truncate max-w-[100px]">{cat}</span>
                        <span className="ml-1 px-1 rounded bg-white text-[9px] font-bold text-zen-moss">
                          {count}
                        </span>
                      </span>
                    ))}
                    {serviceEntries.length > 3 && (
                      <span className="text-[10px] text-zen-muted font-medium self-center">
                        +{serviceEntries.length - 3} more
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-zen-muted italic">No treatments recorded yet today</p>
                )}
              </div>

              {/* Metric C: Guest Flow & Rejection Counter */}
              <div className="pt-2.5 border-t border-zen-stone/60 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-zen-muted">
                  <UserCheck className="w-3.5 h-3.5 text-zen-matcha" />
                  <span>{completedGuests} Completed</span>
                </div>

                <div className="flex items-center space-x-1 font-medium">
                  {rejectionCount > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />
                      {rejectionCount} Rejected
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-medium">
                      0 Walk-in Rejects
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
