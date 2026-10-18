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
  User, 
  LogOut, 
  Sprout,
  Globe
} from 'lucide-react';

interface ConsoleHeaderProps {
  currentView: 'profile' | 'fields' | 'cockpit';
  onNavigate: (view: 'profile' | 'fields' | 'cockpit') => void;
  activeParcel: FarmProfile | null;
  parcels: FarmProfile[];
  onSelectParcel: (parcelId: string) => void;
  authSession: AuthSession | null;
  onSignOut: () => void;
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
  onToggleMobileSidebar,
}: ConsoleHeaderProps) {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#141D17]/95 backdrop-blur-md border-b border-[#E1E8DE] dark:border-[#1F2D24] px-3 sm:px-6 flex items-center justify-between transition-colors">
      {/* 1. LEFT: Hamburger (Mobile) + Title (Mobile) OR Dynamic Breadcrumbs (Desktop) */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open Navigation Menu"
          className="md:hidden p-2 -ml-1 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Minimal Brand Header */}
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

        {/* Desktop Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 font-bold text-slate-800 dark:text-white flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
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
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0 cursor-pointer"
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
                    className="ml-1 text-[11px] font-semibold py-0.5 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-hidden"
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

      {/* 2. RIGHT: Desktop Dropdown Controls & Profile Avatar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Desktop Language Dropdown */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300">
          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            aria-label="Select Language"
            className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="bn">বাংলা (Bengali)</option>
          </select>
        </div>

        {/* Desktop Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="hidden md:inline-flex p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Profile Avatar Button */}
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
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
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

          {/* Desktop Sign Out Button */}
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign Out"
            className="hidden md:inline-flex ml-1.5 p-2 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
