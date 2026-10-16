import React, { useState } from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import { Header } from './components/Header';
import { ZenGardenSummary } from './components/ZenGardenSummary';
import { OutletPanoramaGrid } from './components/OutletPanoramaGrid';
import { FinancePromoAnalysis } from './components/FinancePromoAnalysis';
import { RejectionAnalysis } from './components/RejectionAnalysis';
import { AlertCircle, RefreshCw, Sparkles, Building2, ShieldCheck } from 'lucide-react';

export function App() {
  const [selectedOutlet, setSelectedOutlet] = useState<string>('ALL');
  const {
    loading,
    error,
    lastUpdated,
    summary,
    outlets,
    paymentBreakdown,
    promoImpact,
    rejectionReasons,
    allActiveOutlets,
    countdown,
    refresh,
  } = useDashboardData(selectedOutlet);

  const selectedOutletObj = allActiveOutlets.find(
    (o) => o.kode_outlet === selectedOutlet
  );
  const selectedOutletName =
    selectedOutlet === 'ALL'
      ? 'All Active Outlets Network'
      : selectedOutletObj
      ? `${selectedOutletObj.kode_outlet} - ${selectedOutletObj.name_outlet}`
      : 'Selected Outlet';

  return (
    <div className="min-h-screen bg-zen-paper flex flex-col font-sans">
      {/* Top Sticky Navigation */}
      <Header
        outlets={allActiveOutlets}
        selectedOutlet={selectedOutlet}
        onSelectOutlet={setSelectedOutlet}
        countdown={countdown}
        onRefresh={refresh}
        loading={loading}
        lastUpdated={lastUpdated}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-800 text-xs sm:text-sm shadow-sm">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Sync Ingestion Notice:</span> {error}
              </div>
            </div>
            <button
              onClick={refresh}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State / Shimmer */}
        {loading && !lastUpdated ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-40 bg-white/70 rounded-2xl border border-zen-sand/30"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white/70 rounded-2xl border border-zen-sand/30"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-white/70 rounded-2xl border border-zen-sand/30"></div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* 1. The Zen Garden Global KPI Summary */}
            <ZenGardenSummary
              summary={summary}
              selectedOutletName={selectedOutletName}
            />

            {/* 2. Outlet Panorama Grid (Progress, Services Mix, Rejections) */}
            <OutletPanoramaGrid
              outlets={outlets}
              selectedOutletCode={selectedOutlet}
              onSelectOutlet={setSelectedOutlet}
            />

            {/* 3. Finance & Promotions Matrix */}
            <FinancePromoAnalysis
              paymentBreakdown={paymentBreakdown}
              promoImpact={promoImpact}
              totalSales={summary.totalSales}
              totalDiscounts={summary.totalDiscounts}
            />

            {/* 4. Walk-in Rejection Analysis */}
            <RejectionAnalysis
              reasons={rejectionReasons}
              totalRejections={summary.totalRejections}
            />
          </>
        )}
      </main>

      {/* Zen Footer */}
      <footer className="bg-white border-t border-zen-sand/40 py-6 mt-12 text-center text-xs text-zen-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <img src="/Logo150x150.png" alt="Logo" className="w-5 h-5 object-contain" />
            <span className="font-serif font-bold text-zen-charcoal">Zen Family Spa and Reflexology</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              PostgreSQL Hybrid Ingestion Active
            </span>
            <span className="hidden sm:inline text-zen-stone">|</span>
            <span>Timezone: Asia/Jakarta (WIB)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
