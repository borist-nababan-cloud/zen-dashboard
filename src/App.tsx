import React, { useState } from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import { useAutoScroll } from './hooks/useAutoScroll';
import { Header } from './components/Header';
import { ZenGardenSummary } from './components/ZenGardenSummary';
import { OutletPanoramaGrid } from './components/OutletPanoramaGrid';
import { FinancePromoAnalysis } from './components/FinancePromoAnalysis';
import { RejectionAnalysis } from './components/RejectionAnalysis';
import { AlertCircle, RefreshCw, Sparkles, Building2, ShieldCheck, Tv, Play, Pause } from 'lucide-react';

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
    selectedDate,
    setSelectedDate,
    isOvernightWindow,
    resetToAutoDate,
  } = useDashboardData(selectedOutlet);

  // Big screen auto-scroll enabled on All Outlets network view
  const {
    isActive: isAutoScrollOn,
    isInteracting,
    toggleAutoScroll,
  } = useAutoScroll({
    enabled: selectedOutlet === 'ALL' && !loading,
    speed: 0.7,
  });

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
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        isOvernightWindow={isOvernightWindow}
        onResetDate={resetToAutoDate}
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
            {/* 1. Zen Family Spa & Reflexology Global KPI Summary */}
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

      {/* Floating Kiosk / Head Office TV Auto-Scroll Controller */}
      {selectedOutlet === 'ALL' && !loading && (
        <div className="fixed bottom-5 right-5 z-40">
          <button
            onClick={toggleAutoScroll}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md shadow-lg border transition-all duration-300 ${
              isAutoScrollOn
                ? 'bg-zen-matcha/90 text-white border-zen-moss/40 hover:bg-zen-matcha'
                : 'bg-white/90 text-zen-charcoal border-zen-sand/60 hover:bg-white'
            }`}
            title={isAutoScrollOn ? 'Click to pause auto-scroll' : 'Click to resume auto-scroll'}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>
              {isAutoScrollOn
                ? isInteracting
                  ? 'Auto-Scroll: Paused (User Active)'
                  : 'Big Screen Scroll: Active'
                : 'Auto-Scroll: Paused'}
            </span>
            {isAutoScrollOn ? (
              <Pause className="w-3 h-3 ml-0.5 opacity-80" />
            ) : (
              <Play className="w-3 h-3 ml-0.5 opacity-80" />
            )}
          </button>
        </div>
      )}

      {/* Zen Footer */}
      <footer className="bg-white border-t border-zen-sand/40 py-6 mt-12 text-center text-xs text-zen-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <img src="/Logo150x150.png" alt="Logo" className="w-5 h-5 object-contain" />
            <span className="font-serif font-bold text-zen-charcoal">Zen Family Spa and Reflexology</span>
            <span>&copy; nababancloud.com 2026</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Zen Hybrid Application
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
