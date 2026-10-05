'use client';

import React from 'react';
import { Droplets, CloudRain, AlertTriangle, MapPin, Sparkles, SlidersHorizontal, Globe } from 'lucide-react';
import { useLanguage } from './common/LanguageContext';
import { SupportedLanguage } from '../adapters/speechAdapter';

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
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Logo & Badges */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-['Outfit']">
                    {t.appName}
                  </span>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    AI Telemetry: Water Resilience
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-none">
                  {t.tagline}
                </p>
              </div>
            </div>

            {/* Language Switcher on Mobile Top-Right */}
            <div className="flex sm:hidden items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              {(['en', 'hi', 'bn'] as SupportedLanguage[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    language === l
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l === 'en' ? 'EN' : l === 'hi' ? 'हिंदी' : 'বাংলা'}
                </button>
              ))}
            </div>
          </div>

          {/* Controls: Preset Switcher + Language + Configure */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0">
            
            {/* Desktop Language Switcher */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 mr-1">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
              {(['en', 'hi', 'bn'] as SupportedLanguage[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    language === l
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l === 'en' ? 'English' : l === 'hi' ? 'हिंदी' : 'বাংলা'}
                </button>
              ))}
            </div>

            {/* Scenario buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => onSelectPreset('preset_rain_avoidance')}
                className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                  activePresetId === 'preset_rain_avoidance'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'bg-slate-900/60 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5 text-emerald-400" />
                <span>Scenario A (Rain)</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectPreset('preset_resource_deficit')}
                className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                  activePresetId === 'preset_resource_deficit'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'bg-slate-900/60 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Scenario B (Deficit)</span>
              </button>
            </div>

            {/* Farm Profile Configurator Button */}
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-cyan-600/30 shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t.editFarm}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
