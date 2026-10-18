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
      {/* 1. LEFT: Hamburger (Mobile) + Clean Title (Mobile) OR Dynamic Breadcrumbs (Desktop) */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open Navigation Menu"
          className="md:hidden p-2 -ml-1 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile-Only Minimal Header Brand Title */}
        <div className="md:hidden flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Sprout className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-900 dark:text-white truncate font-['Outfit']">
            {currentView === 'profile' 
              ? 'FieldGuard' 
              : currentView === 'fields' 
              ? (language === 'hi' ? 'खेत निर्देशिका' : 'My Fields') 
              : activeParcel?.farmName || 'Field Cockpit'}
          </span>
        </div>

        {/* Desktop-Only Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 font-bold text-slate-800 dark:text-white flex items-center gap-1.5 transition-colors shrink-0"
          >
            <span>FieldGuard</span>
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
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
              >
                {language === 'hi' ? 'खेत' : language === 'bn' ? 'জমি' : 'Fields'}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  {activeParcel?.farmName || (language === 'hi' ? 'सक्रिय खेत' : 'Active Field')}
                </span>
                {parcels.length > 1 && (
                  <select
                    value={activeParcel?.id || ''}
                    onChange={(e) => onSelectParcel(e.target.value)}
                    aria-label="Switch active field"
                    className="ml-1 text-[11px] font-semibold py-0.5 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
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

      {/* 2. RIGHT: Desktop Controls OR Clean Single Mobile Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Desktop-Only: AWS Architecture Verification Pill */}
        <button
          type="button"
          onClick={onOpenAwsProof}
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          title="AWS Architecture Verification & Cloud Logs"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>AWS Verified</span>
        </button>

        {/* Desktop-Only: Language Selector */}
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-medium">
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

        {/* Desktop-Only: Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="hidden md:inline-flex p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Profile Avatar Button:
            - On Mobile: Clicking opens the side drawer (where all options, settings & sign out live!)
            - On Desktop: Clicking navigates to Profile Overview */}
        <div className="flex items-center md:pl-2 md:border-l md:border-slate-200 md:dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                onToggleMobileSidebar();
              } else {
                onNavigate('profile');
              }
            }}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            title="Profile Menu & Navigation"
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

          {/* Desktop-Only: Sign Out Button */}
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign Out"
            className="hidden md:inline-flex ml-1 p-2 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
