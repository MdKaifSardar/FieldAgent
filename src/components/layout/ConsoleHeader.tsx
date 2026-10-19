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
  currentView: 'profile' | 'fields' | 'advisory';
  onNavigate: (view: 'profile' | 'fields' | 'advisory') => void;
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
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#0A1C2A]/95 backdrop-blur-md border-b border-[#E1E8DE] dark:border-[#16364D] px-3 sm:px-6 flex items-center justify-between transition-colors">
      {/* 1. LEFT: Hamburger (Mobile) + Title (Mobile) OR Dynamic Breadcrumbs (Desktop) */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open Navigation Menu"
          className="md:hidden p-2 -ml-1 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#112B3E] transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Minimal Brand Header */}
        <div className="md:hidden flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Sprout className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-900 dark:text-[#F0F9FF] truncate font-['Outfit']">
            {currentView === 'profile' 
              ? 'FieldGuard' 
              : currentView === 'fields' 
              ? (language === 'hi' ? 'खेत निर्देशिका' : 'My Fields') 
              : activeParcel?.farmName || 'Field Advisory'}
          </span>
        </div>

        {/* Desktop Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-[#94A3B8]">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="hover:text-sky-600 dark:hover:text-[#38BDF8] font-bold text-slate-800 dark:text-[#F0F9FF] flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <span>FieldGuard</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-[#1E4765] shrink-0" />

          {currentView === 'profile' && (
            <span className="font-semibold text-slate-900 dark:text-[#38BDF8] truncate">
              {language === 'hi' ? 'खाता सारांश' : language === 'bn' ? 'অ্যাকাউন্ট ওভারভিউ' : 'Profile & Overview'}
            </span>
          )}

          {currentView === 'fields' && (
            <span className="font-semibold text-slate-900 dark:text-[#38BDF8] truncate">
              {language === 'hi' ? 'खेत निर्देशिका' : language === 'bn' ? 'জমির ডিরেক্টরি' : 'My Fields Directory'}
            </span>
          )}

          {currentView === 'advisory' && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('fields')}
                className="hover:text-sky-600 dark:hover:text-[#38BDF8] transition-colors shrink-0 cursor-pointer"
              >
                {language === 'hi' ? 'खेत' : language === 'bn' ? 'জমি' : 'Fields'}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-[#1E4765] shrink-0" />
              <span className="font-bold text-sky-600 dark:text-[#38BDF8] truncate">
                {activeParcel?.farmName || (language === 'hi' ? 'सक्रिय खेत' : 'Field Advisory')}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* 2. RIGHT: Desktop Controls & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Desktop Language Dropdown */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#112B3E] border border-slate-200 dark:border-[#16364D] text-xs text-slate-700 dark:text-[#F0F9FF]">
          <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            aria-label="Select Language"
            className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-[#F0F9FF] focus:outline-hidden cursor-pointer"
          >
            <option value="en" className="dark:bg-[#0A1C2A] dark:text-[#F0F9FF]">English</option>
            <option value="hi" className="dark:bg-[#0A1C2A] dark:text-[#F0F9FF]">हिन्दी (Hindi)</option>
            <option value="bn" className="dark:bg-[#0A1C2A] dark:text-[#F0F9FF]">বাংলা (Bengali)</option>
          </select>
        </div>

        {/* Desktop Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="hidden md:inline-flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#112B3E] transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Profile Avatar Button */}
        <div className="flex items-center md:pl-2 md:border-l md:border-slate-200 md:dark:border-[#16364D]">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                onToggleMobileSidebar();
              } else {
                onNavigate('profile');
              }
            }}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#112B3E] transition-colors text-left cursor-pointer"
            title="Profile Menu & Navigation"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {authSession?.displayName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
            </div>
            <div className="hidden lg:block text-xs">
              <p className="font-semibold text-slate-800 dark:text-[#F0F9FF] leading-tight truncate max-w-[100px]">
                {authSession?.displayName || 'Farmer User'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-[#94A3B8] leading-tight">
                {parcels.length} {parcels.length === 1 ? 'Field' : 'Fields'}
              </p>
            </div>
          </button>

          {/* Desktop Sign Out Button */}
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign Out"
            className="hidden md:inline-flex ml-1.5 p-2 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
