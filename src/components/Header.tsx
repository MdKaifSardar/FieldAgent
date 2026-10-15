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
  Home, 
  Sprout,
  Menu,
  ChevronDown,
  Check,
  Layers
} from 'lucide-react';
import { useLanguage } from './common/LanguageContext';
import { useTheme } from './common/ThemeContext';
import { SupportedLanguage } from '../adapters/speechAdapter';
import { AuthSession } from '../adapters/cognitoAdapter';

interface HeaderProps {
  authSession: AuthSession | null;
  onLogout: () => void;
  activeView: 'landing' | 'dashboard';
  onViewChange: (view: 'landing' | 'dashboard') => void;
  onOpenSideDrawer: () => void;
  parcelsCount?: number;
}

export function Header({
  authSession,
  onLogout,
  activeView,
  onViewChange,
  onOpenSideDrawer,
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
    <header className="w-full border-b border-[#E1E8DE] dark:border-[#1F2D24] bg-white/95 dark:bg-[#0D1310]/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Left: Logo & Direct Brand Navigation */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={() => onViewChange('landing')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="h-9 w-9 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shadow-xs shrink-0">
                <Sprout className="h-5 w-5" />
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
            </button>

            {/* Dashboard Link - ONLY visible when authenticated */}
            {authSession && (
              <nav className="flex items-center bg-[#F0F4ED] dark:bg-[#1B2720] p-0.5 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] text-xs">
                <button
                  type="button"
                  onClick={() => onViewChange('landing')}
                  className={`min-h-[34px] px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'landing'
                      ? 'bg-white dark:bg-[#141D17] text-[#16A34A] dark:text-[#4ADE80] shadow-xs'
                      : 'text-[#526356] dark:text-[#9BAEA0] hover:text-[#121C15] dark:hover:text-[#F0F4F1]'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.overview}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onViewChange('dashboard')}
                  className={`min-h-[34px] px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'dashboard'
                      ? 'bg-white dark:bg-[#141D17] text-[#16A34A] dark:text-[#4ADE80] shadow-xs'
                      : 'text-[#526356] dark:text-[#9BAEA0] hover:text-[#121C15] dark:hover:text-[#F0F4F1]'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>{t.fieldAdvisor}</span>
                </button>
              </nav>
            )}
          </div>

          {/* Right: Controls & Profile Action */}
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

            {/* Authenticated User Menu & Enterprise Side Drawer Trigger */}
            {authSession ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Enterprise Parcels Drawer Button */}
                <button
                  type="button"
                  onClick={onOpenSideDrawer}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  title="Open Farm Command Center & Parcels"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">My Fields</span>
                  <span className="bg-emerald-800/60 px-1.5 py-0.2 rounded-full text-[10px]">
                    {parcelsCount}
                  </span>
                </button>

                {/* Profile Pill & Logout */}
                <div className="flex items-center gap-1.5 p-1 px-2.5 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] text-xs">
                  <button
                    type="button"
                    onClick={onOpenSideDrawer}
                    className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors cursor-pointer"
                    title="View Profile Details"
                  >
                    <User className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
                    <span className="hidden md:inline text-[#121C15] dark:text-[#F0F4F1] font-medium truncate max-w-[100px]">
                      {authSession.displayName}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="ml-1 p-0.5 text-[#526356] hover:text-rose-500 transition-colors cursor-pointer"
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
