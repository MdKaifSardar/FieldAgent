'use client';

import React from 'react';
import { Droplets, CloudRain, AlertTriangle, MapPin, Sparkles, PlusCircle } from 'lucide-react';

interface HeaderProps {
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  onOpenOnboarding: () => void;
  isLiveLoading: boolean;
  onTriggerLiveLocation: () => void;
}

export function Header({
  activePresetId,
  onSelectPreset,
  onOpenOnboarding,
  isLiveLoading,
  onTriggerLiveLocation,
}: HeaderProps) {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Hackathon AI Telemetryadge */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-['Outfit']">
                  FieldGuard
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  AI Telemetry: Water Resilience
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Built on AWS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Weather-Aware Irrigation Decision-Support System
              </p>
            </div>
          </div>

          {/* Quick Scenario & Live Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSelectPreset('preset_rain_avoidance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activePresetId === 'preset_rain_avoidance'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-900/60 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scenario A: Rain Avoidance</span>
            </button>

            <button
              onClick={() => onSelectPreset('preset_resource_deficit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activePresetId === 'preset_resource_deficit'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-900/60 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Scenario B: Tank Deficit</span>
            </button>

            <button
              onClick={onTriggerLiveLocation}
              disabled={isLiveLoading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activePresetId === 'live_gps'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900/60 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isLiveLoading ? 'Fetching GPS...' : '📍 Live GPS Mode'}</span>
            </button>

            <button
              onClick={onOpenOnboarding}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/30 ml-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Configure Field</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
