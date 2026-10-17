'use client';

import React, { useState } from 'react';
import { useLanguage } from '../common/LanguageContext';
import { FarmProfile } from '../../types/farm';
import { 
  User, 
  Sprout, 
  Zap, 
  Droplets, 
  CloudSun, 
  ScrollText, 
  Plus, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  X
} from 'lucide-react';

interface ConsoleSidebarProps {
  currentView: 'profile' | 'fields' | 'cockpit';
  onNavigate: (view: 'profile' | 'fields' | 'cockpit') => void;
  parcels: FarmProfile[];
  activeParcel: FarmProfile | null;
  onOpenNewParcelWizard: () => void;
  onOpenAwsProof: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function ConsoleSidebar({
  currentView,
  onNavigate,
  parcels,
  activeParcel,
  onOpenNewParcelWizard,
  onOpenAwsProof,
  isMobileOpen,
  onCloseMobile,
}: ConsoleSidebarProps) {
  const { language } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const tOverview = language === 'hi' ? 'खाता और सारांश' : language === 'bn' ? 'অ্যাকাউন্ট ওভারভিউ' : 'Profile & Overview';
  const tFields = language === 'hi' ? 'खेत निर्देशिका' : language === 'bn' ? 'জমির ডিরেক্টরি' : 'My Fields Directory';
  const tCockpit = language === 'hi' ? 'सिंचाई निर्णय केंद्र' : language === 'bn' ? 'সেচ সিদ্ধান্ত কেন্দ্র' : 'Field Cockpit';
  const tWater = language === 'hi' ? 'जल भंडार व संप' : language === 'bn' ? 'জল সঞ্চয় ও পাম্প' : 'Water Reserves';
  const tClimate = language === 'hi' ? 'मौसम स्टेशन' : language === 'bn' ? 'আবহাওয়া স্টেশন' : 'Micro-Climate';
  const tLedger = language === 'hi' ? 'पर्यावरण खाता' : language === 'bn' ? 'পরিবেশগত খতিয়ান' : 'Environmental Ledger';

  const navItemClass = (active: boolean) => `
    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer
    ${active 
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30' 
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
    }
  `;

  return (
    <>
      {/* 1. DESKTOP & TABLET PERSISTENT SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-[#E1E8DE] dark:border-[#1F2D24] bg-white dark:bg-[#121A15] transition-all duration-200 select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E1E8DE] dark:border-[#1F2D24]">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
                <Sprout className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white block leading-tight font-['Outfit']">
                  FieldGuard
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none block">
                  Agronomic Console
                </span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <Sprout className="w-4 h-4" />
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Workspace Navigation */}
        <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
          <div>
            {!isCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Workspace
              </p>
            )}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className={navItemClass(currentView === 'profile')}
                title={tOverview}
              >
                <User className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {!isCollapsed && <span className="truncate">{tOverview}</span>}
              </button>

              <button
                type="button"
                onClick={() => onNavigate('fields')}
                className={navItemClass(currentView === 'fields')}
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
              </button>

              <button
                type="button"
                onClick={() => onNavigate('cockpit')}
                className={navItemClass(currentView === 'cockpit')}
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

          {/* Extensible Future Tools Suite (Cleanly Pluggable Modules) */}
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
                  // Smoothly scroll to water reserve card
                  document.getElementById('water-budget-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={navItemClass(false)}
                title={tWater}
              >
                <Droplets className="w-4 h-4 shrink-0 text-cyan-500" />
                {!isCollapsed && <span className="truncate">{tWater}</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('cockpit');
                  // Smoothly scroll to climate card
                  document.getElementById('climate-station-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={navItemClass(false)}
                title={tClimate}
              >
                <CloudSun className="w-4 h-4 shrink-0 text-sky-500" />
                {!isCollapsed && <span className="truncate">{tClimate}</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('cockpit');
                  // Smoothly scroll to environmental ledger card
                  document.getElementById('environmental-ledger-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={navItemClass(false)}
                title={tLedger}
              >
                <ScrollText className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                {!isCollapsed && <span className="truncate">{tLedger}</span>}
              </button>
            </nav>
          </div>

          {/* Quick Action: Register Field */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenNewParcelWizard}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all ${
                isCollapsed ? 'px-0' : 'px-3'
              }`}
              title="Register New Field Parcel"
            >
              <Plus className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Add Field</span>}
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#E1E8DE] dark:border-[#1F2D24]">
          <button
            type="button"
            onClick={onOpenAwsProof}
            className={`w-full flex items-center gap-2 p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="AWS Cloud Architecture Audit"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {!isCollapsed && <span className="truncate">AWS Architecture</span>}
          </button>
        </div>
      </aside>

      {/* 2. MOBILE SLIDE-OUT DRAWER */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile} 
          />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#121A15] h-full shadow-2xl flex flex-col z-10 border-r border-[#E1E8DE] dark:border-[#1F2D24]">
            {/* Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-[#E1E8DE] dark:border-[#1F2D24]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
                  <Sprout className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-slate-900 dark:text-white font-['Outfit']">
                  FieldGuard
                </span>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
              <nav className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('profile');
                    onCloseMobile();
                  }}
                  className={navItemClass(currentView === 'profile')}
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
                  className={navItemClass(currentView === 'fields')}
                >
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <div className="flex items-center justify-between w-full">
                    <span>{tFields}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-bold">
                      {parcels.length}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onNavigate('cockpit');
                    onCloseMobile();
                  }}
                  className={navItemClass(currentView === 'cockpit')}
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <div className="flex items-center justify-between w-full">
                    <span>{tCockpit}</span>
                    {activeParcel && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-bold truncate max-w-[80px]">
                        {activeParcel.farmName}
                      </span>
                    )}
                  </div>
                </button>
              </nav>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenNewParcelWizard();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs bg-emerald-600 text-white shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Field Parcel</span>
                </button>
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-[#E1E8DE] dark:border-[#1F2D24]">
              <button
                type="button"
                onClick={() => {
                  onOpenAwsProof();
                  onCloseMobile();
                }}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-semibold"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>AWS Cloud Architecture</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MOBILE THUMB-FRIENDLY BOTTOM NAVIGATION BAR (< 768px) */}
      <nav 
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-[#141D17]/95 backdrop-blur-md border-t border-[#E1E8DE] dark:border-[#1F2D24] px-4 flex items-center justify-around shadow-lg"
      >
        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors ${
            currentView === 'profile' 
              ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('fields')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors relative ${
            currentView === 'fields' 
              ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span>My Fields</span>
          {parcels.length > 0 && (
            <span className="absolute top-2 right-1/4 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
              {parcels.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onNavigate('cockpit')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors ${
            currentView === 'cockpit' 
              ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span>Cockpit</span>
        </button>
      </nav>
    </>
  );
}
