'use client';

import React from 'react';
import { 
  Droplets, 
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
  onOpenOnboarding: () => void;
  onOpenAuth: () => void;
  authSession: AuthSession | null;
  onLogout: () => void;
  hasCustomFarm?: boolean;
  onResetFarm?: () => void;
}

export function Header({
  onOpenOnboarding,
  onOpenAuth,
  authSession,
  onLogout,
  hasCustomFarm = false,
  onResetFarm,
}: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          
          {/* Logo & Hackathon Badge */}
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

          {/* Right Action Controls: Language + Configure + Auth */}
          <div className="flex items-center gap-2">
            
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 sm:p-1">
              <Globe className="hidden sm:inline-block w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
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

            {/* Farm Profile Configurator Button */}
            <button
              type="button"
              onClick={onOpenOnboarding}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0 ${
                hasCustomFarm
                  ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{hasCustomFarm ? t.editFarm : '+ Set Up Farm'}</span>
              <span className="sm:hidden">{hasCustomFarm ? 'Edit' : '+ Set Up'}</span>
            </button>

            {/* Auth Badge / Button */}
            <div>
              {authSession ? (
                <div className="flex items-center gap-1.5 p-1 px-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-white font-medium truncate max-w-[100px] sm:max-w-[140px]">
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
                  <span className="hidden sm:inline">Farmer Sign In</span>
                  <span className="sm:hidden">Sign In</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
