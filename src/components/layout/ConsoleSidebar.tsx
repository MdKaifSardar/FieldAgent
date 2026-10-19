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
  CheckCircle2,
  Globe
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
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isFieldsAccordionOpen, setIsFieldsAccordionOpen] = useState<boolean>(true);

  const tOverview = language === 'hi' ? 'खाता सारांश' : language === 'bn' ? 'অ্যাকাউন্ট ওভারভিউ' : 'Profile & Overview';
  const tFields = language === 'hi' ? 'खेत निर्देशिका' : language === 'bn' ? 'জমির ডিরেক্টরি' : 'My Fields Directory';
  const tAdvisory = language === 'hi' ? 'खेत सलाहकार' : language === 'bn' ? 'জমির পরামর্শ' : 'Field Advisory';

  return (
    <>
      {/* 1. DESKTOP PERSISTENT NAVIGATION RAIL */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-[#E1E8DE] dark:border-[#16364D] bg-white dark:bg-[#0A1C2A] transition-all duration-200 select-none ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center border-b border-[#E1E8DE] dark:border-[#16364D] px-3.5">
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
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#112B3E] transition-colors shrink-0 ml-1 cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
              title="Expand Sidebar"
            >
              <Sprout className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 py-4 px-2 space-y-4 overflow-y-auto">
          <div>
            {!isCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#94A3B8]">
                Management
              </p>
            )}
            <nav className="space-y-1">
              {/* Profile Overview */}
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className={`transition-all duration-150 cursor-pointer ${
                  isCollapsed
                    ? `w-10 h-10 mx-auto flex items-center justify-center rounded-lg border border-transparent ${
                        currentView === 'profile'
                          ? 'bg-sky-500/15 text-sky-600 dark:text-[#38BDF8] border-sky-500/30 font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112B3E]'
                      }`
                    : `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold border border-transparent ${
                        currentView === 'profile'
                          ? 'bg-sky-500/15 text-sky-700 dark:text-[#38BDF8] border-sky-500/30 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112B3E]'
                      }`
                }`}
                title={tOverview}
              >
                <User className="w-4 h-4 shrink-0 text-sky-500 dark:text-[#38BDF8]" />
                {!isCollapsed && <span className="truncate">{tOverview}</span>}
              </button>

              {/* My Fields Directory with Accordion */}
              <div>
                <div
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold border border-transparent transition-all duration-150 ${
                    currentView === 'fields'
                      ? 'bg-sky-500/15 text-sky-700 dark:text-[#38BDF8] border-sky-500/30 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112B3E]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onNavigate('fields')}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                    title={tFields}
                  >
                    <Layers className="w-4 h-4 shrink-0 text-sky-500 dark:text-[#38BDF8]" />
                    {!isCollapsed && <span className="truncate">{tFields}</span>}
                  </button>

                  {!isCollapsed && (
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-[#112B3E] text-slate-600 dark:text-[#94A3B8] font-bold">
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
                          title="Toggle Parcels"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isFieldsAccordionOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Slick Accordion Sub-Items: Registered Fields */}
                {!isCollapsed && isFieldsAccordionOpen && parcels.length > 0 && (
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
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] transition-all duration-150 cursor-pointer text-left border border-transparent ${
                            isActive
                              ? 'bg-sky-500/15 text-sky-600 dark:text-[#38BDF8] font-bold border-sky-500/25'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112B3E]'
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

              {/* Direct Active Field Advisory shortcut */}
              {activeParcel && (
                <button
                  type="button"
                  onClick={() => onNavigate('advisory')}
                  className={`transition-all duration-150 cursor-pointer ${
                    isCollapsed
                      ? `w-10 h-10 mx-auto flex items-center justify-center rounded-lg border border-transparent ${
                          currentView === 'advisory'
                            ? 'bg-sky-500/15 text-amber-500 border-sky-500/30 font-bold'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112B3E]'
                        }`
                      : `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold border border-transparent ${
                          currentView === 'advisory'
                            ? 'bg-sky-500/15 text-sky-700 dark:text-[#38BDF8] border-sky-500/30 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112B3E]'
                        }`
                  }`}
                  title={`${tAdvisory}: ${activeParcel.farmName}`}
                >
                  <Zap className="w-4 h-4 shrink-0 text-amber-500" />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span className="truncate">{tAdvisory}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-sky-500/20 text-sky-600 dark:text-[#38BDF8] font-bold truncate max-w-[80px]">
                        {activeParcel.farmName}
                      </span>
                    </div>
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* Quick Action: Register Field */}
          <div className="pt-2 flex justify-center">
            {isCollapsed ? (
              <button
                type="button"
                onClick={onOpenNewParcelWizard}
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-all cursor-pointer"
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

              {/* User Identity card */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-500 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  {authSession?.displayName?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-xs text-slate-900 dark:text-[#F0F9FF] truncate">
                      {authSession?.displayName || 'Farmer User'}
                    </p>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-[#38BDF8] border border-sky-300 dark:border-sky-800">
                      <CheckCircle2 className="w-2.5 h-2.5 text-sky-600" />
                      Verified
                    </span>
                  </div>
                  {authSession?.emailOrPhone && (
                    <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] truncate flex items-center gap-1 mt-0.5">
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

            {/* Drawer Body: Navigation & Fields */}
            <div className="flex-1 py-3 px-3 space-y-4 overflow-y-auto text-xs">
              <div>
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#94A3B8]">
                  Management
                </p>
                <nav className="space-y-1">
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

                  {activeParcel && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('advisory');
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                        currentView === 'advisory'
                          ? 'bg-sky-500/15 text-sky-700 dark:text-[#38BDF8] font-bold border border-sky-500/30'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#112B3E]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>{tAdvisory}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-600 dark:text-[#38BDF8] font-bold truncate max-w-[80px]">
                        {activeParcel.farmName}
                      </span>
                    </button>
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

            {/* Drawer Footer: Settings */}
            <div className="p-3.5 border-t border-[#E1E8DE] dark:border-[#16364D] bg-slate-50/50 dark:bg-[#0D2232] space-y-2.5">
              {/* Language Dropdown */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#94A3B8] mb-1 block px-1">
                  Language / भाषा
                </label>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0A1C2A] border border-slate-200 dark:border-[#16364D] text-xs">
                  <Globe className="w-4 h-4 text-sky-500 shrink-0" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                    aria-label="Select Language"
                    className="w-full bg-transparent border-none text-xs font-semibold text-slate-800 dark:text-[#F0F9FF] focus:outline-hidden cursor-pointer"
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
