'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Globe, 
  User, 
  LogIn, 
  LogOut, 
  Sun, 
  Moon, 
  LayoutDashboard, 
  ChevronDown, 
  Check 
} from 'lucide-react';
import { useLanguage } from './common/LanguageContext';
import { useTheme } from './common/ThemeContext';
import { SupportedLanguage } from '../adapters/speechAdapter';
import { AuthSession } from '../adapters/cognitoAdapter';

export interface HeaderProps {
  authSession: AuthSession | null;
  onLogout: () => void;
  activeView?: 'landing' | 'dashboard';
  onViewChange?: (view: 'landing' | 'dashboard') => void;
  onOpenSideDrawer?: () => void;
  parcelsCount?: number;
}

export function Header({
  authSession,
  onLogout,
  parcelsCount = 0,
}: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    }
    if (isLangDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isLangDropdownOpen]);

  return (
    <header className="w-full border-b border-[#E1E8DE] dark:border-[#1F2D24] bg-white/95 dark:bg-[#0D1310]/95 backdrop-blur-md sticky top-0 z-30 transition-colors select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Left: Logo & Direct Brand Navigation */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-xs border border-emerald-500/30 bg-white dark:bg-[#0D2232] p-0.5">
                <img src="/icon.png" alt="FieldGuard Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-[#121C15] dark:text-[#F0F4F1] font-['Outfit'] group-hover:text-[#16A34A] dark:group-hover:text-[#4ADE80] transition-colors">
                    {t.appName}
                  </span>
                  <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#16A34A]/10 text-[#16A34A] dark:text-[#4ADE80] border border-[#16A34A]/25">
                    AI Telemetry
                  </span>
                </div>
                <p className="hidden sm:block text-[10px] sm:text-[11px] text-[#526356] dark:text-[#9BAEA0] truncate max-w-[200px] sm:max-w-none">
                  {t.tagline}
                </p>
              </div>
            </Link>
          </div>

          {/* Right: Controls, Farm Dashboard & Profile Action */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[36px] w-9 h-9 rounded-xl bg-[#F0F4ED] hover:bg-[#E4EBE0] dark:bg-[#1B2720] dark:hover:bg-[#23322A] border border-[#E1E8DE] dark:border-[#2A3E31] text-[#121C15] dark:text-[#F0F4F1] flex items-center justify-center transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Sunlit Paper Theme' : 'Switch to Mineral Night Theme'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#526356]" />
              )}
            </button>

            {/* Language Dropdown Selector */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#F0F4ED] hover:bg-[#E4EBE0] dark:bg-[#1B2720] dark:hover:bg-[#23322A] border border-[#E1E8DE] dark:border-[#2A3E31] text-[#121C15] dark:text-[#F0F4F1] flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
                aria-label="Select Language"
                aria-expanded={isLangDropdownOpen}
              >
                <Globe className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
                <span className="hidden sm:inline">
                  {language === 'en' ? 'English' : language === 'hi' ? 'हिन्दी' : 'বাংলা'}
                </span>
                <span className="sm:hidden uppercase">{language}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#526356] dark:text-[#9BAEA0] transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#2A3E31] shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {[
                    { code: 'en' as SupportedLanguage, label: 'English' },
                    { code: 'hi' as SupportedLanguage, label: 'हिन्दी' },
                    { code: 'bn' as SupportedLanguage, label: 'বাংলা' },
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLanguage(item.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        language === item.code
                          ? 'bg-[#16A34A]/10 text-[#16A34A] dark:text-[#4ADE80]'
                          : 'text-[#121C15] dark:text-[#F0F4F1] hover:bg-[#F0F4ED] dark:hover:bg-[#1B2720]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {language === item.code && (
                        <Check className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Authenticated User Menu & Farm Dashboard Action */}
            {authSession ? (
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Primary Farm Dashboard CTA */}
                <Link
                  href="/fields"
                  className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  title="Open Farm Dashboard & Parcels"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Farm Dashboard</span>
                  {parcelsCount > 0 && (
                    <span className="bg-emerald-800/70 text-emerald-100 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                      {parcelsCount}
                    </span>
                  )}
                </Link>

                {/* Profile Pill & Logout */}
                <div className="flex items-center gap-1.5 p-1 px-2.5 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] text-xs">
                  <Link
                    href="/profile"
                    className="flex items-center gap-1.5 text-[#121C15] dark:text-[#F0F4F1] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    title="View Farmer Profile"
                  >
                    <User className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
                    <span className="hidden md:inline font-medium truncate max-w-[110px]">
                      {authSession.displayName}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="ml-1 p-1 text-[#526356] hover:text-rose-500 dark:text-[#9BAEA0] dark:hover:text-rose-400 transition-colors cursor-pointer rounded-md hover:bg-black/5 dark:hover:bg-white/5"
                    title={t.signOut}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.signIn}</span>
              </Link>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
