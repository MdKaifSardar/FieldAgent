'use client';

import React from 'react';
import { 
  Droplets, 
  SlidersHorizontal, 
  Globe, 
  User, 
  LogIn, 
  LogOut,
  Sun,
  Moon,
  LayoutDashboard,
  Home,
  Sprout
} from 'lucide-react';
import { useLanguage } from './common/LanguageContext';
import { useTheme } from './common/ThemeContext';
import { SupportedLanguage } from '../adapters/speechAdapter';
import { AuthSession } from '../adapters/cognitoAdapter';

interface HeaderProps {
  onOpenOnboarding: () => void;
  onOpenAuth: () => void;
  authSession: AuthSession | null;
  onLogout: () => void;
  hasCustomFarm?: boolean;
  onResetFarm?: () => void;
  activeView: 'landing' | 'dashboard';
  onViewChange: (view: 'landing' | 'dashboard') => void;
}

export function Header({
  onOpenOnboarding,
  onOpenAuth,
  authSession,
  onLogout,
  hasCustomFarm = false,
  activeView,
  onViewChange,
}: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="w-full border-b border-[#E1E5DC] dark:border-[#1E2F24] bg-white/95 dark:bg-[#0B130E]/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Logo & Navigation Tabs */}
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => onViewChange('landing')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="h-9 w-9 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center shadow-sm shrink-0">
                <Sprout className="h-5 w-5" />
              </div>
              <div className="hidden xs:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-[#111C15] dark:text-[#ECF2EC] font-['Outfit'] group-hover:text-[#2D6A4F] dark:group-hover:text-[#52B788] transition-colors">
                    {t.appName}
                  </span>
                  <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#52B788] border border-[#2D6A4F]/25">
                    AI Telemetry
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#5A6B60] dark:text-[#8E9F93] truncate max-w-[150px] sm:max-w-none">
                  {t.tagline}
                </p>
              </div>
            </button>

            {/* Navigation View Switcher (Landing vs Field Dashboard) */}
            <nav className="flex items-center bg-stone-100 dark:bg-[#121D16] p-0.5 rounded-lg border border-[#E1E5DC] dark:border-[#1E2F24] text-xs">
              <button
                type="button"
                onClick={() => onViewChange('landing')}
                className={`min-h-[32px] px-2.5 sm:px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'landing'
                    ? 'bg-white dark:bg-[#1E2F24] text-[#2D6A4F] dark:text-[#52B788] shadow-xs'
                    : 'text-[#5A6B60] dark:text-[#8E9F93] hover:text-[#111C15] dark:hover:text-[#ECF2EC]'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.overview}</span>
              </button>

              <button
                type="button"
                onClick={() => onViewChange('dashboard')}
                className={`min-h-[32px] px-2.5 sm:px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'dashboard'
                    ? 'bg-white dark:bg-[#1E2F24] text-[#2D6A4F] dark:text-[#52B788] shadow-xs'
                    : 'text-[#5A6B60] dark:text-[#8E9F93] hover:text-[#111C15] dark:hover:text-[#ECF2EC]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{t.fieldAdvisor}</span>
              </button>
            </nav>
          </div>

          {/* Right Action Controls: Theme + Language + Configure + Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[36px] w-9 h-9 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-[#121D16] dark:hover:bg-[#1E2F24] border border-[#E1E5DC] dark:border-[#1E2F24] text-stone-700 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-stone-700" />
              )}
            </button>

            {/* Language Switcher */}
            <div className="hidden sm:flex items-center bg-stone-100 dark:bg-[#121D16] border border-[#E1E5DC] dark:border-[#1E2F24] rounded-lg p-0.5">
              <Globe className="w-3.5 h-3.5 text-stone-400 ml-1 mr-0.5" />
              {(['en', 'hi', 'bn'] as SupportedLanguage[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    language === l
                      ? 'bg-[#2D6A4F] text-white shadow-xs'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {l === 'en' ? 'EN' : l === 'hi' ? 'हिंदी' : 'বাংলা'}
                </button>
              ))}
            </div>

            {/* Farm Profile Configurator Button */}
            <button
              type="button"
              onClick={onOpenOnboarding}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${
                hasCustomFarm
                  ? 'bg-stone-100 hover:bg-stone-200 dark:bg-[#1A291E] dark:hover:bg-[#243A2B] border border-[#E1E5DC] dark:border-[#2A4333] text-stone-800 dark:text-[#ECF2EC]'
                  : 'bg-[#2D6A4F] hover:bg-[#23533E] text-white shadow-sm font-bold'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{hasCustomFarm ? t.editFarm : t.setUpFarm}</span>
              <span className="sm:hidden">{hasCustomFarm ? 'Edit' : '+ Farm'}</span>
            </button>

            {/* Auth Badge / Button */}
            <div>
              {authSession ? (
                <div className="flex items-center gap-1.5 p-1 px-2.5 rounded-lg bg-emerald-50 dark:bg-[#1A291E] border border-emerald-300 dark:border-[#2A4333] text-xs">
                  <User className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
                  <span className="text-stone-900 dark:text-white font-medium truncate max-w-[80px] sm:max-w-[130px]">
                    {authSession.displayName}
                  </span>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="ml-1 p-0.5 text-stone-400 hover:text-rose-500 cursor-pointer"
                    title={t.signOut}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-[#121D16] dark:hover:bg-[#1E2F24] border border-[#E1E5DC] dark:border-[#1E2F24] text-stone-800 dark:text-stone-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{t.signIn}</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
