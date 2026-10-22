'use client';

import React from 'react';
import { useLanguage } from '../common/LanguageContext';
import { useTheme } from '../common/ThemeContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { SupportedLanguage } from '../../adapters/speechAdapter';
import { AuthSession } from '../../adapters/cognitoAdapter';
import { FarmProfile } from '../../types/farm';
import { localizeFieldTitle } from '../../utils/agriculturalLocalization';
import { 
  ChevronRight, 
  Menu, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  Sprout,
  Globe,
  Sparkles
} from 'lucide-react';

interface ConsoleHeaderProps {
  currentView: 'profile' | 'fields' | 'advisory' | 'register-field' | 'edit-field';
  onNavigate: (view: 'profile' | 'fields' | 'advisory' | 'register-field' | 'edit-field') => void;
  activeParcel: FarmProfile | null;
  parcels: FarmProfile[];
  onSelectParcel: (parcelId: string) => void;
  authSession: AuthSession | null;
  onSignOut: () => void;
  onToggleMobileSidebar: () => void;
  onOpenAlexaModal?: () => void;
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
  onOpenAlexaModal,
}: ConsoleHeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 min-h-[64px] bg-white/95 dark:bg-[#0A1C2A]/95 backdrop-blur-md border-b border-[#E1E8DE] dark:border-[#16364D] px-3 sm:px-6 flex items-center justify-between transition-colors">
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
          <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-xs border border-emerald-500/30 bg-white dark:bg-[#071724] p-0.5">
            <img src="/icon.png" alt="FieldGuard" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-sm text-slate-900 dark:text-[#F0F9FF] truncate font-['Outfit']">
            {currentView === 'profile' 
              ? 'FieldGuard' 
              : currentView === 'fields' 
              ? t.myFieldsDirectory 
              : currentView === 'register-field'
              ? t.registerNewField
              : currentView === 'edit-field'
              ? t.editFieldTitle
              : activeParcel ? localizeFieldTitle(activeParcel.farmName, language) : t.fieldAdvisor}
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
              {t.profileOverview}
            </span>
          )}

          {currentView === 'fields' && (
            <span className="font-semibold text-slate-900 dark:text-[#38BDF8] truncate">
              {t.myFieldsDirectory}
            </span>
          )}

          {currentView === 'advisory' && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('fields')}
                className="hover:text-sky-600 dark:hover:text-[#38BDF8] transition-colors shrink-0 cursor-pointer"
              >
                {t.fieldsCountSuffix}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-[#1E4765] shrink-0" />
              <span className="font-bold text-sky-600 dark:text-[#38BDF8] truncate">
                {activeParcel ? localizeFieldTitle(activeParcel.farmName, language) : t.fieldAdvisor}
              </span>
            </>
          )}

          {currentView === 'register-field' && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('fields')}
                className="hover:text-sky-600 dark:hover:text-[#38BDF8] transition-colors shrink-0 cursor-pointer"
              >
                {t.fieldsCountSuffix}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-[#1E4765] shrink-0" />
              <span className="font-bold text-sky-600 dark:text-[#38BDF8] truncate">
                {t.registerNewField}
              </span>
            </>
          )}

          {currentView === 'edit-field' && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('fields')}
                className="hover:text-sky-600 dark:hover:text-[#38BDF8] transition-colors shrink-0 cursor-pointer"
              >
                {t.fieldsCountSuffix}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-[#1E4765] shrink-0" />
              <button
                type="button"
                onClick={() => onNavigate('advisory')}
                className="hover:text-sky-600 dark:hover:text-[#38BDF8] transition-colors shrink-0 cursor-pointer truncate max-w-[140px]"
              >
                {activeParcel ? localizeFieldTitle(activeParcel.farmName, language) : t.fieldAdvisor}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-[#1E4765] shrink-0" />
              <span className="font-bold text-sky-600 dark:text-[#38BDF8] truncate">
                {t.editFieldTitle}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* 2. RIGHT: Desktop Controls & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Alexa+ Voice Advisor Header Button */}
        {onOpenAlexaModal && (
          <button
            type="button"
            onClick={onOpenAlexaModal}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 via-cyan-500 to-blue-600 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow-cyan-500/25 transition-all cursor-pointer"
            title="Open Alexa+ Voice Advisor"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
            <span className="hidden sm:inline">Alexa+ Advisor</span>
          </button>
        )}

        {/* Desktop Custom Language Dropdown */}
        <div className="hidden md:block">
          <LanguageSelector />
        </div>

        {/* Desktop Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={t.themeMode}
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
            title={t.profileOverview}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {authSession?.displayName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
            </div>
            <div className="hidden lg:block text-xs">
              <p className="font-semibold text-slate-800 dark:text-[#F0F9FF] leading-tight truncate max-w-[100px]">
                {authSession?.displayName || t.farmerUser}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-[#94A3B8] leading-tight">
                {parcels.length} {parcels.length === 1 ? t.fieldCountSingular : t.fieldsCountSuffix}
              </p>
            </div>
          </button>

          {/* Desktop Sign Out Button */}
          <button
            type="button"
            onClick={onSignOut}
            aria-label={t.signOut}
            className="hidden md:inline-flex ml-1.5 p-2 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title={t.signOut}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
