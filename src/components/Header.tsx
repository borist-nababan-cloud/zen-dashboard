import React, { useState, useEffect } from 'react';
import { RefreshCw, MapPin, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { MasterOutlet } from '../types/dashboard';

interface HeaderProps {
  outlets: MasterOutlet[];
  selectedOutlet: string;
  onSelectOutlet: (code: string) => void;
  countdown: number;
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: Date | null;
}

export const Header: React.FC<HeaderProps> = ({
  outlets,
  selectedOutlet,
  onSelectOutlet,
  countdown,
  onRefresh,
  loading,
  lastUpdated,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-zen-paper/95 backdrop-blur-md border-b border-zen-sand/30 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3.5 w-full md:w-auto">
            <div className="relative group flex-shrink-0">
              <img
                src="/Logo150x150.png"
                alt="Zen Family Spa"
                className="w-11 h-11 object-contain rounded-xl p-0.5 bg-white shadow-zen ring-1 ring-zen-sand/40 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  // Fallback if image fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-zen-matcha rounded-full border-2 border-white ring-1 ring-zen-matcha/50 animate-pulse"></div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-zen-charcoal tracking-tight">
                  Zen Family Spa and Reflexology
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zen-matcha/10 text-zen-moss border border-zen-matcha/20">
                  <Sparkles className="w-3 h-3 mr-1 text-zen-matcha" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-zen-muted font-medium">
                Executive Multi-Outlet Real-time Panorama
              </p>
            </div>
          </div>

          {/* Controls: Branch Filter, Live Clock, Refresh */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
            
            {/* Outlet Selector */}
            <div className="relative flex items-center">
              <MapPin className="absolute left-3 w-4 h-4 text-zen-moss pointer-events-none" />
              <select
                value={selectedOutlet}
                onChange={(e) => onSelectOutlet(e.target.value)}
                className="pl-9 pr-8 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white border border-zen-sand/50 text-zen-charcoal shadow-sm hover:border-zen-matcha focus:outline-none focus:ring-2 focus:ring-zen-matcha/40 transition-all cursor-pointer"
              >
                <option value="ALL">All Outlets ({outlets.length} Active)</option>
                {outlets.map((o) => (
                  <option key={o.kode_outlet} value={o.kode_outlet}>
                    {o.kode_outlet} - {o.name_outlet}
                  </option>
                ))}
              </select>
            </div>

            {/* Local Clock */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-2 bg-white rounded-xl border border-zen-sand/40 shadow-sm text-xs text-zen-charcoal font-medium">
              <Clock className="w-3.5 h-3.5 text-zen-muted" />
              <span className="font-mono">{currentTime}</span>
              <span className="text-[10px] text-zen-muted font-bold ml-0.5">WIB</span>
            </div>

            {/* Refresh Button & Countdown */}
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Click to refresh instantly"
              className="flex items-center space-x-1.5 px-3 py-2 bg-zen-matcha text-white rounded-xl shadow-sm hover:bg-zen-moss active:scale-95 transition-all text-xs font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="bg-black/20 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                {countdown}s
              </span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
