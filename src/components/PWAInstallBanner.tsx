import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Smartphone, Sparkles } from 'lucide-react';

const DISMISS_KEY = 'zen_dashboard_pwa_dismissed_until';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOSSafari, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState<boolean>(true);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  useEffect(() => {
    // Check if dismissed previously within 24 hours
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil) {
      const until = parseInt(dismissedUntil, 10);
      if (Date.now() < until) {
        setDismissed(true);
        return;
      }
    }
    setDismissed(false);
  }, []);

  const handleDismiss = () => {
    // Dismiss for 24 hours
    const dismissExpiry = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, dismissExpiry.toString());
    setDismissed(true);
  };

  if (isInstalled || dismissed) {
    return null;
  }

  // Case 1: Android / Chrome / Edge native install prompt available
  if (isInstallable) {
    return (
      <div className="fixed bottom-5 left-4 right-4 sm:right-auto sm:left-6 sm:max-w-md z-40 transition-all duration-300">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-zen-matcha/30 shadow-2xl shadow-zen-charcoal/15 flex items-start space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-zen-matcha/15 p-1.5 flex items-center justify-center shrink-0 border border-zen-matcha/30">
            <img
              src="/Logo150x150.png"
              alt="Zen Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zen-charcoal font-serif">
                Install Zen Executive
              </h4>
              <button
                onClick={handleDismiss}
                className="text-zen-charcoal/40 hover:text-zen-charcoal p-1 rounded-lg transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zen-charcoal/70 mt-0.5 line-clamp-2">
              Pantau KPI & performa cabang lebih cepat langsung dari layar utama tanpa bilah peramban.
            </p>

            <div className="mt-3 flex items-center space-x-2">
              <button
                onClick={async () => {
                  const success = await promptInstall();
                  if (success) {
                    setDismissed(true);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-zen-matcha hover:bg-zen-moss text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Aplikasi</span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-zen-charcoal/70 text-xs font-medium transition-colors"
              >
                Nanti
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: iOS Safari - manual "Add to Home Screen" instructions
  if (isIOSSafari) {
    return (
      <>
        {/* Floating Mini Banner (Bottom-Left to avoid TV Auto-Scroll controller at bottom-right) */}
        <div className="fixed bottom-5 left-4 right-4 sm:right-auto sm:left-6 sm:max-w-md z-40 transition-all duration-300">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-zen-sand/60 shadow-2xl shadow-zen-charcoal/15 flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-zen-sand/20 flex items-center justify-center shrink-0 text-zen-moss">
              <Smartphone className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-zen-charcoal font-serif">
                  Pasang di iPhone / iPad
                </h4>
                <button
                  onClick={handleDismiss}
                  className="text-zen-charcoal/40 hover:text-zen-charcoal p-1 rounded-lg transition-colors"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] sm:text-xs text-zen-charcoal/70 mt-0.5">
                Tambahkan ke Layar Utama untuk akses full-screen tanpa address bar Safari.
              </p>

              <div className="mt-2.5 flex items-center space-x-2">
                <button
                  onClick={() => setShowIOSModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-zen-matcha hover:bg-zen-moss text-white text-[11px] font-semibold flex items-center space-x-1.5 shadow-sm transition-all active:scale-95"
                >
                  <Share className="w-3 h-3" />
                  <span>Petunjuk Install (iOS)</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-zen-charcoal/60 text-[11px] font-medium transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Guide for iOS Safari */}
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 border border-zen-sand/40 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zen-sand/30 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-zen-matcha/20 flex items-center justify-center text-zen-moss">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-zen-charcoal font-serif">
                    Cara Pasang di iOS Safari
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="p-1 rounded-lg text-zen-charcoal/50 hover:text-zen-charcoal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-zen-charcoal">
                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-zen-paper">
                  <div className="w-6 h-6 rounded-full bg-zen-matcha text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-zen-charcoal">Ketuk Tombol Share</p>
                    <p className="text-[11px] text-zen-charcoal/70 mt-0.5">
                      Ketuk ikon <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white font-mono border border-zen-sand/40 text-[10px]"><Share className="w-3 h-3 inline mr-0.5" /> Bagikan</span> di bilah menu bawah Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-zen-paper">
                  <div className="w-6 h-6 rounded-full bg-zen-matcha text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-zen-charcoal">Pilih "Add to Home Screen"</p>
                    <p className="text-[11px] text-zen-charcoal/70 mt-0.5">
                      Gulir ke bawah pada menu opsi lalu pilih <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white font-medium border border-zen-sand/40 text-[10px]"><PlusSquare className="w-3 h-3 inline mr-0.5 text-zen-moss" /> Tambahkan ke Layar Utama</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-zen-paper">
                  <div className="w-6 h-6 rounded-full bg-zen-matcha text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-zen-charcoal">Konfirmasi "Tambah"</p>
                    <p className="text-[11px] text-zen-charcoal/70 mt-0.5">
                      Ketuk tombol <strong>Tambah (Add)</strong> di kanan atas. Ikon Zen Executive Dashboard akan langsung terpasang di layar utama iPhone/iPad.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowIOSModal(false);
                  handleDismiss();
                }}
                className="w-full py-3 rounded-2xl bg-zen-matcha hover:bg-zen-moss text-white text-xs font-semibold shadow-sm transition-all"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export default PWAInstallBanner;
