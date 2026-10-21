'use client';

import React from 'react';
import Link from 'next/link';
import { 
  X, 
  Sprout, 
  Home, 
  LayoutDashboard, 
  Globe, 
  Sun, 
  Moon, 
  SlidersHorizontal, 
  User, 
  LogIn, 
  LogOut, 
  Check,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { SupportedLanguage } from '../../adapters/speechAdapter';
import { AuthSession } from '../../adapters/cognitoAdapter';

interface MobileSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOnboarding: () => void;
  onOpenAuth: () => void;
  authSession: AuthSession | null;
  onLogout: () => void;
  hasCustomFarm?: boolean;
  onResetFarm?: () => void;
  activeView: 'landing' | 'dashboard';
  onViewChange: (view: 'landing' | 'dashboard') => void;
}

export function MobileSideDrawer({
  isOpen,
  onClose,
  onOpenOnboarding,
  onOpenAuth,
  authSession,
  onLogout,
  hasCustomFarm = false,
  onResetFarm,
  activeView,
  onViewChange,
}: MobileSideDrawerProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside 
        className="relative w-[85vw] max-w-sm h-full bg-[#FFFFFF] dark:bg-[#141D17] border-l border-[#E1E8DE] dark:border-[#1F2D24] shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-250 text-[#121C15] dark:text-[#F0F4F1]"
      >
        <div className="space-y-6">
          
          {/* Top Bar with Brand & Close Button */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E1E8DE] dark:border-[#1F2D24]">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-xs border border-emerald-500/30 bg-white dark:bg-[#071724] p-0.5">
                <img src="/icon.png" alt="FieldGuard" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-[#121C15] dark:text-[#F0F4F1] font-['Outfit'] block">
                  {t.appName}
                </span>
                <span className="text-[10px] text-[#526356] dark:text-[#9BAEA0]">
                  Autonomous Precision Irrigation
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-[#526356] dark:text-[#9BAEA0] hover:text-[#121C15] dark:hover:text-white hover:bg-[#F0F4ED] dark:hover:bg-[#1B2720] transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Close Navigation Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary View Switcher */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#526356] dark:text-[#9BAEA0] uppercase tracking-wider block">
              Navigation
            </span>
            <div className={`grid ${authSession ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
              <button
                type="button"
                onClick={() => {
                  onViewChange('landing');
                  onClose();
                }}
                className={`min-h-[48px] px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  activeView === 'landing'
                    ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs'
                    : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#526356] dark:text-[#9BAEA0]'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{t.overview}</span>
              </button>

              {authSession && (
                <button
                  type="button"
                  onClick={() => {
                    onViewChange('dashboard');
                    onClose();
                  }}
                  className={`min-h-[48px] px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    activeView === 'dashboard'
                      ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs'
                      : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#526356] dark:text-[#9BAEA0]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t.fieldAdvisor}</span>
                </button>
              )}
            </div>
          </div>

          {/* Farm Parcel Management - ONLY accessible after sign-in */}
          {authSession && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#526356] dark:text-[#9BAEA0] uppercase tracking-wider block">
                Field Parcel
              </span>
              <button
                type="button"
                onClick={() => {
                  onOpenOnboarding();
                  onClose();
                }}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{hasCustomFarm ? t.editFarm : t.setUpFarm}</span>
              </button>

              {hasCustomFarm && onResetFarm && (
                <button
                  type="button"
                  onClick={() => {
                    onResetFarm();
                    onClose();
                  }}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#E5484D]/10 hover:bg-[#E5484D]/20 text-[#C92A2A] dark:text-[#FFA8A8] border border-[#E5484D]/25 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset Field Parcel
                </button>
              )}
            </div>
          )}

          {/* Multilingual Selector (Full Touch Targets) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#526356] dark:text-[#9BAEA0] uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Language / भाषा / ভাষা</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'en' as SupportedLanguage, label: 'English', sub: 'EN' },
                { code: 'hi' as SupportedLanguage, label: 'हिन्दी', sub: 'Hindi' },
                { code: 'bn' as SupportedLanguage, label: 'বাংলা', sub: 'Bengali' },
              ].map((item) => {
                const isActive = language === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLanguage(item.code)}
                    className={`min-h-[48px] p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isActive
                        ? 'bg-[#16A34A]/10 border-[#16A34A] text-[#16A34A] dark:text-[#4ADE80] font-bold shadow-xs'
                        : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#526356] dark:text-[#9BAEA0]'
                    }`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-[10px] text-[#7E9284]">{item.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Switcher Toggle */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#526356] dark:text-[#9BAEA0] uppercase tracking-wider block">
              Display Theme
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { if (theme !== 'light') toggleTheme(); }}
                className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-800 font-bold shadow-xs'
                    : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#526356] dark:text-[#9BAEA0]'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Sunlit Paper</span>
              </button>

              <button
                type="button"
                onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#16A34A]/15 border-[#16A34A] text-[#4ADE80] font-bold shadow-xs'
                    : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#526356] dark:text-[#9BAEA0]'
                }`}
              >
                <Moon className="w-4 h-4 text-[#4ADE80]" />
                <span>Mineral Night</span>
              </button>
            </div>
          </div>

          {/* Farmer Account & Authentication */}
          <div className="space-y-2 pt-2 border-t border-[#E1E8DE] dark:border-[#1F2D24]">
            {authSession ? (
              <div className="p-3.5 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 rounded-lg bg-[#16A34A]/10 text-[#16A34A] shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{authSession.displayName}</span>
                    <span className="text-[10px] text-[#526356] dark:text-[#9BAEA0] block">AWS Cognito Verified</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="min-h-[40px] px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.signOut}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={onClose}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>{t.signIn} (AWS Cognito OTP)</span>
              </Link>
            )}
          </div>

        </div>

        {/* Footer Badge */}
        <div className="pt-4 border-t border-[#E1E8DE] dark:border-[#1F2D24] text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-[#16A34A]/10 text-[#16A34A] dark:text-[#4ADE80] border border-[#16A34A]/25">
            <ShieldCheck className="w-3 h-3" /> Autonomous Agronomic Intelligence
          </span>
        </div>
      </aside>
    </div>
  );
}
