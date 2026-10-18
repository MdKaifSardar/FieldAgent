'use client';

import React, { useState } from 'react';
import { useLanguage } from '../common/LanguageContext';
import { useTheme } from '../common/ThemeContext';
import { SupportedLanguage } from '../../adapters/speechAdapter';
import { FarmProfile } from '../../types/farm';
import { AuthSession } from '../../adapters/cognitoAdapter';
import { 
  User, 
  Sprout, 
  Zap, 
  Droplets, 
  CloudSun, 
  ScrollText, 
  Plus, 
  ChevronLeft, 
  Layers,
  X,
  Sun,
  Moon,
  LogOut,
  Mail,
  Phone,
  CheckCircle2,
  Globe
} from 'lucide-react';

interface ConsoleSidebarProps {
  currentView: 'profile' | 'fields' | 'cockpit';
  onNavigate: (view: 'profile' | 'fields' | 'cockpit') => void;
  parcels: FarmProfile[];
  activeParcel: FarmProfile | null;
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
  onOpenNewParcelWizard,
  isMobileOpen,
  onCloseMobile,
  authSession,
  onSignOut,
}: ConsoleSidebarProps) {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const tOverview = language === 'hi' ? 'खाता सारांश' : language === 'bn' ? 'অ্যাকাউন্ট ওভারভিউ' : 'Profile & Overview';
  const tFields = language === 'hi' ? 'खेत निर्देशिका' : language === 'bn' ? 'জমির ডিরেক্টরি' : 'My Fields Directory';
  const tCockpit = language === 'hi' ? 'सिंचाई निर्णय केंद्र' : language === 'bn' ? 'সেচ সিদ্ধান্ত কেন্দ্র' : 'Field Cockpit';
  const tWater = language === 'hi' ? 'जल भंडार व संप' : language === 'bn' ? 'জল সঞ্চয় ও পাম্প' : 'Water Reserves';
  const tClimate = language === 'hi' ? 'मौसम स्टेशन' : language === 'bn' ? 'আবহাওয়া স্টেশন' : 'Micro-Climate';
  const tLedger = language === 'hi' ? 'पर्यावरण खाता' : language === 'bn' ? 'পরিবেশগত খতিয়ান' : 'Environmental Ledger';

  return (
    <>
      {/* 1. DESKTOP PERSISTENT NAVIGATION RAIL (PERFECTLY ALIGNED) */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-[#E1E8DE] dark:border-[#1F2D24] bg-white dark:bg-[#121A15] transition-all duration-200 select-none ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center border-b border-[#E1E8DE] dark:border-[#1F2D24] px-3.5">
          {!isCollapsed ? (
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Sprout className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white block leading-tight font-['Outfit'] truncate">
                    FieldGuard
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none block">
                    Agronomic Console
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 ml-1 cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
              title="Expand Sidebar"
            >
              <Sprout className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Primary Workspace Navigation */}
        <div className="flex-1 py-4 px-2 space-y-6 overflow-y-auto">
          {/* Section 1: Workspace */}
          <div>
            {!isCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Workspace
              </p>
            )}
            <nav className="space-y-1">
              {/* Profile */}
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className={`transition-all cursor-pointer ${
                  isCollapsed
                    ? `w-10 h-10 mx-auto flex items-center justify-center rounded-xl ${
                        currentView === 'profile'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`
                    : `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        currentView === 'profile'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`
                }`}
                title={tOverview}
              >
                <User className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {!isCollapsed && <span className="truncate">{tOverview}</span>}
              </button>

              {/* My Fields */}
              <button
                type="button"
                onClick={() => onNavigate('fields')}
                className={`transition-all cursor-pointer ${
                  isCollapsed
                    ? `w-10 h-10 mx-auto flex items-center justify-center rounded-xl relative ${
                        currentView === 'fields'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`
                    : `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        currentView === 'fields'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`
                }`}
                title={tFields}
              >
                <Layers className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="truncate">{tFields}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      {parcels.length}
                    </span>
                  </div>
                )}
                {isCollapsed && parcels.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              {/* Cockpit */}
              <button
                type="button"
                onClick={() => onNavigate('cockpit')}
                className={`transition-all cursor-pointer ${
                  isCollapsed
                    ? `w-10 h-10 mx-auto flex items-center justify-center rounded-xl ${
                        currentView === 'cockpit'
                          ? 'bg-emerald-500/15 text-amber-500 border border-emerald-500/30 font-bold'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`
                    : `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        currentView === 'cockpit'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`
                }`}
                title={tCockpit}
              >
                <Zap className="w-4 h-4 shrink-0 text-amber-500" />
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="truncate">{tCockpit}</span>
                    {activeParcel && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[70px]">
                        {activeParcel.farmName}
                      </span>
                    )}
                  </div>
                )}
              </button>
            </nav>
          </div>

          {/* Section 2: Irrigation Management Suite */}
          <div>
            {!isCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Irrigation Suite
              </p>
            )}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onNavigate('cockpit');
                  document.getElementById('water-budget-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={
                  isCollapsed
                    ? 'w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer'
                    : 'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer'
                }
                title={tWater}
              >
                <Droplets className="w-4 h-4 shrink-0 text-cyan-500" />
                {!isCollapsed && <span className="truncate">{tWater}</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('cockpit');
                  document.getElementById('climate-station-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={
                  isCollapsed
                    ? 'w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer'
                    : 'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer'
                }
                title={tClimate}
              >
                <CloudSun className="w-4 h-4 shrink-0 text-sky-500" />
                {!isCollapsed && <span className="truncate">{tClimate}</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('cockpit');
                  document.getElementById('environmental-ledger-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={
                  isCollapsed
                    ? 'w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer'
                    : 'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer'
                }
                title={tLedger}
              >
                <ScrollText className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                {!isCollapsed && <span className="truncate">{tLedger}</span>}
              </button>
            </nav>
          </div>

          {/* Action: Add Field */}
          <div className="pt-2 flex justify-center">
            {isCollapsed ? (
              <button
                type="button"
                onClick={onOpenNewParcelWizard}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer"
                title="Register New Field Parcel"
              >
                <Plus className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenNewParcelWizard}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Field</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. RICH MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile} 
          />
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-[#121A15] h-full shadow-2xl flex flex-col z-10 border-r border-[#E1E8DE] dark:border-[#1F2D24]">
            {/* Drawer Header: Farmer Identity Banner */}
            <div className="p-4 border-b border-[#E1E8DE] dark:border-[#1F2D24] bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
                    <Sprout className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-['Outfit']">
                    FieldGuard
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User profile card */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  {authSession?.displayName?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {authSession?.displayName || 'Farmer User'}
                    </p>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      Verified
                    </span>
                  </div>
                  {authSession?.emailOrPhone && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      {authSession.emailOrPhone.includes('@') ? (
                        <Mail className="w-2.5 h-2.5" />
                      ) : (
                        <Phone className="w-2.5 h-2.5" />
                      )}
                      <span>{authSession.emailOrPhone}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Body: Navigation & Tools */}
            <div className="flex-1 py-3 px-3 space-y-4 overflow-y-auto text-xs">
              <div>
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Workspace
                </p>
                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('profile');
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
                      currentView === 'profile'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>{tOverview}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('fields');
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
                      currentView === 'fields'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>{tFields}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-bold">
                      {parcels.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('cockpit');
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
                      currentView === 'cockpit'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>{tCockpit}</span>
                    </div>
                    {activeParcel && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-bold truncate max-w-[80px]">
                        {activeParcel.farmName}
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              {/* Drawer Irrigation Suite */}
              <div>
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Irrigation Suite
                </p>
                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('cockpit');
                      onCloseMobile();
                      document.getElementById('water-budget-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
                  >
                    <Droplets className="w-4 h-4 text-cyan-500" />
                    <span>{tWater}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('cockpit');
                      onCloseMobile();
                      document.getElementById('climate-station-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
                  >
                    <CloudSun className="w-4 h-4 text-sky-500" />
                    <span>{tClimate}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('cockpit');
                      onCloseMobile();
                      document.getElementById('environmental-ledger-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
                  >
                    <ScrollText className="w-4 h-4 text-amber-500" />
                    <span>{tLedger}</span>
                  </button>
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
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Field</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer: Settings, Language Dropdown, Theme & Sign Out */}
            <div className="p-3.5 border-t border-[#E1E8DE] dark:border-[#1F2D24] bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              {/* Language Dropdown Selector */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block px-1">
                  Language / भाषा
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                    aria-label="Select Language"
                    className="w-full bg-transparent border-none text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                  </select>
                </div>
              </div>

              {/* Theme Toggle */}
              <div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                    <span>Theme Mode</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
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
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors cursor-pointer"
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
