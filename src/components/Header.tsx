'use client';

import React from 'react';
import { 
  Droplets, 
  CloudRain, 
  AlertTriangle, 
  SlidersHorizontal, 
  Globe, 
  User, 
  LogIn, 
  LogOut 
} from 'lucide-react';
import { useLanguage } from './common/LanguageContext';
import { SupportedLanguage } from '../adapters/speechAdapter';
import { AuthSession } from '../adapters/cognitoAdapter';

interface HeaderProps {
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  onOpenOnboarding: () => void;
  onOpenAuth: () => void;
  authSession: AuthSession | null;
  onLogout: () => void;
  isLiveLoading: boolean;
  onTriggerLiveLocation: () => void;
}

export function Header({
  activePresetId,
  onSelectPreset,
  onOpenOnboarding,
  onOpenAuth,
  authSession,
  onLogout,
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
                <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-none">
                  {t.tagline}
                </p>
              </div>
            </div>

            {/* Mobile Controls Right: Language Switcher */}
            <div className="flex sm:hidden items-center gap-1.5">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
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

              {/* Mobile Auth Button */}
              {authSession ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-400"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-2 py-1 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Controls: Presets + Auth + Language + Configure */}
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

            {/* Desktop Auth Badge / Button */}
            <div className="hidden sm:flex items-center ml-1">
              {authSession ? (
                <div className="flex items-center gap-1.5 p-1 px-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-white font-medium truncate max-w-[120px]">
                    {authSession.displayName}
                  </span>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="ml-1 p-0.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Farmer Sign In</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
