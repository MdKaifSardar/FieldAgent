'use client';

import React, { useState } from 'react';
import { useLanguage } from '../common/LanguageContext';
import { useTheme } from '../common/ThemeContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { FarmProfile } from '../../types/farm';
import { AuthSession } from '../../adapters/cognitoAdapter';
import { 
  User, 
  Sprout, 
  Plus, 
  ChevronLeft, 
  ChevronDown,
  Layers,
  X,
  Sun,
  Moon,
  LogOut,
  Mail,
  Phone,
  CheckCircle2
} from 'lucide-react';

interface ConsoleSidebarProps {
  currentView: 'profile' | 'fields' | 'advisory';
  onNavigate: (view: 'profile' | 'fields' | 'advisory') => void;
  parcels: FarmProfile[];
  activeParcel: FarmProfile | null;
  onSelectParcel: (parcelId: string) => void;
  onOpenNewParcelWizard: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  authSession?: AuthSession | null;
  onSignOut?: () => void;
}

export function ConsoleSidebar({
  currentView,
  onNavigate,
  parcels,
  activeParcel,
  onSelectParcel,
  onOpenNewParcelWizard,
  isMobileOpen,
  onCloseMobile,
  authSession,
  onSignOut,
}: ConsoleSidebarProps) {
  const { language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isFieldsAccordionOpen, setIsFieldsAccordionOpen] = useState<boolean>(true);

  const tOverview = language === 'hi' ? 'खाता सारांश' : language === 'bn' ? 'অ্যাকাউন্ট ওভারভিউ' : 'Profile & Overview';
  const tFields = language === 'hi' ? 'खेत निर्देशिका' : language === 'bn' ? 'জমির ডিরেক্টরি' : 'My Fields Directory';

  return (
    <>
      {/* 1. DESKTOP PERSISTENT NAVIGATION RAIL (Fixed in place, non-scrolling) */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 border-r border-[#E1E8DE] dark:border-[#16364D] bg-white dark:bg-[#0A1C2A] transition-all duration-200 select-none z-30 ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center border-b border-[#E1E8DE] dark:border-[#16364D] px-3 shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Sprout className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-[#F0F9FF] block leading-tight font-['Outfit'] truncate">
                    FieldGuard
                  </span>
                  <span className="text-[10px] font-semibold text-sky-600 dark:text-[#38BDF8] uppercase tracking-widest leading-none block">
                    Irrigation Console
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#112B3E] transition-colors shrink-0 cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer shrink-0"
              title="Expand Sidebar"
            >
              <Sprout className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Primary Navigation Rail */}
        <div className="flex-1 py-4 px-2 space-y-4 overflow-y-auto overflow-x-hidden">
          <div>
            {!isCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#94A3B8]">
                Management
              </p>
            )}

            <nav className="space-y-1.5">
              {/* Menu Item 1: Profile & Account Overview */}
              {isCollapsed ? (
                <button
                  type="button"
                  onClick={() => onNavigate('profile')}
                  className={`w-10 h-10 mx-auto flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
                    currentView === 'profile'
                      ? 'bg-sky-500/15 text-sky-600 dark:text-[#38BDF8] border-sky-500/40 font-bold'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112B3E]'
                  }`}
                  title={tOverview}
                >
                  <User className="w-4 h-4 shrink-0 text-sky-500 dark:text-[#38BDF8]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('profile')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    currentView === 'profile'
                      ? 'bg-sky-500/15 text-sky-700 dark:text-[#38BDF8] border-sky-500/40 font-bold'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112B3E]'
                  }`}
                  title={tOverview}
                >
                  <User className="w-4 h-4 shrink-0 text-sky-500 dark:text-[#38BDF8]" />
                  <span className="truncate">{tOverview}</span>
                </button>
              )}

              {/* Menu Item 2: My Fields Directory (with Accordion) */}
              {isCollapsed ? (
                <button
                  type="button"
                  onClick={() => onNavigate('fields')}
                  className={`w-10 h-10 mx-auto flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
                    currentView === 'fields' || currentView === 'advisory'
                      ? 'bg-sky-500/15 text-sky-600 dark:text-[#38BDF8] border-sky-500/40 font-bold'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112B3E]'
                  }`}
                  title={tFields}
                >
                  <Layers className="w-4 h-4 shrink-0 text-sky-500 dark:text-[#38BDF8]" />
                </button>
              ) : (
                <div>
                  <div
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      currentView === 'fields'
                        ? 'bg-sky-500/15 text-sky-700 dark:text-[#38BDF8] border-sky-500/40 font-bold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112B3E]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onNavigate('fields')}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                      title={tFields}
                    >
                      <Layers className="w-4 h-4 shrink-0 text-sky-500 dark:text-[#38BDF8]" />
                      <span className="truncate">{tFields}</span>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-[#112B3E] text-slate-600 dark:text-[#94A3B8] font-bold">
                        {parcels.length}
                      </span>
                      {parcels.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFieldsAccordionOpen(!isFieldsAccordionOpen);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                          title="Toggle Parcels Accordion"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isFieldsAccordionOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Accordion List: 1-Click Parcel Switcher directly into Field Advisory */}
                  {isFieldsAccordionOpen && parcels.length > 0 && (
                    <div className="mt-1 pl-4 pr-1 space-y-0.5 border-l border-slate-200 dark:border-[#16364D] ml-5">
                      {parcels.map((farm) => {
                        const isActive = activeParcel?.id === farm.id && currentView === 'advisory';
                        return (
                          <button
                            key={farm.id}
                            type="button"
                            onClick={() => {
                              onSelectParcel(farm.id);
                              onNavigate('advisory');
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] transition-all cursor-pointer text-left border ${
                              isActive
                                ? 'bg-sky-500/15 text-sky-600 dark:text-[#38BDF8] font-bold border-sky-500/30'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112B3E]'
                            }`}
                            title={`Switch to ${farm.farmName}`}
                          >
                            <span className="truncate">{farm.farmName}</span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 ml-1.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Action: Register Field Button */}
              <div className="pt-2">
                {isCollapsed ? (
                  <button
                    type="button"
                    onClick={onOpenNewParcelWizard}
                    className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-all cursor-pointer"
                    title="Register New Field"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenNewParcelWizard}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Field</span>
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>

        {/* Bottom Rail: Settings & Theme (Fixed bottom) */}
        <div className="p-3 border-t border-[#E1E8DE] dark:border-[#16364D] shrink-0 bg-slate-50/50 dark:bg-[#0A1C2A]">
          {isCollapsed ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112B3E] transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  aria-label="Sign Out"
                  className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#112B3E] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                  <span>Theme</span>
                </span>
                <span className="text-[11px] font-bold text-sky-600 dark:text-[#38BDF8]">
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* 2. RICH MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile} 
          />
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-[#0A1C2A] h-full shadow-2xl flex flex-col z-10 border-r border-[#E1E8DE] dark:border-[#16364D]">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E1E8DE] dark:border-[#16364D] bg-slate-50/50 dark:bg-[#0D2232]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center text-white">
                    <Sprout className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider text-sky-600 dark:text-[#38BDF8] font-['Outfit']">
                    FieldGuard
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Farmer ID Tile in Drawer */}
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-600 dark:text-[#38BDF8] flex items-center justify-center font-bold text-sm">
                  {authSession?.displayName?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-900 dark:text-[#F0F9FF] truncate">
                    {authSession?.displayName || 'Farmer Account'}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-sky-600 dark:text-[#38BDF8] font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Cognito Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div>
                <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Navigation
                </p>
                <nav className="space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('profile');
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                      currentView === 'profile'
                        ? 'bg-sky-500/15 text-sky-700 dark:text-[#38BDF8] font-bold border border-sky-500/30'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#112B3E]'
                    }`}
                  >
                    <User className="w-4 h-4 text-sky-500" />
                    <span>{tOverview}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('fields');
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                      currentView === 'fields'
                        ? 'bg-sky-500/15 text-sky-700 dark:text-[#38BDF8] font-bold border border-sky-500/30'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#112B3E]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-sky-500" />
                      <span>{tFields}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-[#112B3E] font-bold">
                      {parcels.length}
                    </span>
                  </button>

                  {/* Registered Fields in Drawer */}
                  {parcels.length > 0 && (
                    <div className="pl-4 pr-1 space-y-1 border-l border-slate-200 dark:border-[#16364D] ml-5 my-1.5">
                      {parcels.map((farm) => {
                        const isActive = activeParcel?.id === farm.id && currentView === 'advisory';
                        return (
                          <button
                            key={farm.id}
                            type="button"
                            onClick={() => {
                              onSelectParcel(farm.id);
                              onNavigate('advisory');
                              onCloseMobile();
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] transition-all cursor-pointer text-left ${
                              isActive
                                ? 'bg-sky-500/15 text-sky-600 dark:text-[#38BDF8] font-bold'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <span className="truncate">{farm.farmName}</span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 ml-1.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </nav>
              </div>

              {/* Add Field Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onOpenNewParcelWizard();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs bg-sky-600 text-white shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Field</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer: Language & Theme */}
            <div className="p-3.5 border-t border-[#E1E8DE] dark:border-[#16364D] bg-slate-50/50 dark:bg-[#0D2232] space-y-2.5">
              {/* Custom Language Selector */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#94A3B8] mb-1.5 block px-1">
                  Language / भाषा
                </label>
                <LanguageSelector className="w-full" />
              </div>

              {/* Theme Toggle */}
              <div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between py-1.5 px-3 rounded-lg bg-white dark:bg-[#0A1C2A] border border-slate-200 dark:border-[#16364D] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-500" />}
                    <span>Theme Mode</span>
                  </span>
                  <span className="text-[11px] font-bold text-sky-600 dark:text-[#38BDF8]">
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </span>
                </button>
              </div>

              {/* Sign Out Button */}
              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
