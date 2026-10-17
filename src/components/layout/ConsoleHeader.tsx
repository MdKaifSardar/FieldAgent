'use client';

import React from 'react';
import { useLanguage } from '../common/LanguageContext';
import { useTheme } from '../common/ThemeContext';
import { SupportedLanguage } from '../../adapters/speechAdapter';
import { AuthSession } from '../../adapters/cognitoAdapter';
import { FarmProfile } from '../../types/farm';
import { 
  ChevronRight, 
  Menu, 
  Sun, 
  Moon, 
  ShieldCheck, 
  User, 
  LogOut, 
  Layers,
  Sprout
} from 'lucide-react';

interface ConsoleHeaderProps {
  currentView: 'profile' | 'fields' | 'cockpit';
  onNavigate: (view: 'profile' | 'fields' | 'cockpit') => void;
  activeParcel: FarmProfile | null;
  parcels: FarmProfile[];
  onSelectParcel: (parcelId: string) => void;
  authSession: AuthSession | null;
  onSignOut: () => void;
  onOpenAwsProof: () => void;
  onToggleMobileSidebar: () => void;
}

export function ConsoleHeader({
  currentView,
  onNavigate,
  activeParcel,
  parcels,
  onSelectParcel,
  authSession,
  onSignOut,
  onOpenAwsProof,
  onToggleMobileSidebar,
}: ConsoleHeaderProps) {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#141D17]/95 backdrop-blur-md border-b border-[#E1E8DE] dark:border-[#1F2D24] px-3 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile hamburger + Dynamic Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open Navigation"
          className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span className="hidden sm:inline font-bold text-slate-800 dark:text-white">FieldGuard</span>
            <span className="sm:hidden font-bold text-slate-800 dark:text-white">Console</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

          {currentView === 'profile' && (
            <span className="font-semibold text-slate-900 dark:text-emerald-400 truncate">
              {language === 'hi' ? 'खाता सारांश' : language === 'bn' ? 'অ্যাকাউন্ট ওভারভিউ' : 'Profile & Overview'}
            </span>
          )}

          {currentView === 'fields' && (
            <span className="font-semibold text-slate-900 dark:text-emerald-400 truncate">
              {language === 'hi' ? 'खेत निर्देशिका' : language === 'bn' ? 'জমির ডিরেক্টরি' : 'My Fields Directory'}
            </span>
          )}

          {currentView === 'cockpit' && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('fields')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors hidden sm:inline shrink-0"
              >
                {language === 'hi' ? 'खेत' : language === 'bn' ? 'জমি' : 'Fields'}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  {activeParcel?.farmName || (language === 'hi' ? 'सक्रिय खेत' : 'Active Field')}
                </span>
                {parcels.length > 1 && (
                  <select
                    value={activeParcel?.id || ''}
                    onChange={(e) => onSelectParcel(e.target.value)}
                    aria-label="Switch active field"
                    className="ml-1 text-[11px] font-semibold py-0.5 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    {parcels.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.farmName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}
        </nav>
      </div>

      {/* Right: Controls & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* AWS Engine Architecture Status Pill */}
        <button
          type="button"
          onClick={onOpenAwsProof}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          title="AWS Architecture Verification & Cloud Logs"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>AWS Verified</span>
        </button>

        {/* Trilingual Language Selector */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-medium">
          {(['en', 'hi', 'bn'] as SupportedLanguage[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`px-2 py-1 rounded-lg transition-all ${
                language === lang
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {lang === 'en' ? 'EN' : lang === 'hi' ? 'HI' : 'BN'}
            </button>
          ))}
        </div>

        {/* Dark/Light Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Profile Avatar / Sign Out */}
        <div className="flex items-center pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            title="View Profile Overview"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {authSession?.displayName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
            </div>
            <div className="hidden lg:block text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[100px]">
                {authSession?.displayName || 'Farmer User'}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                {parcels.length} {parcels.length === 1 ? 'Field' : 'Fields'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign Out"
            className="ml-1 p-2 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
