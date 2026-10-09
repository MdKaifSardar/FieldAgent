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
  Home
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
    <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Logo & Navigation Tabs */}
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => onViewChange('landing')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <div className="hidden xs:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white font-['Outfit'] group-hover:text-emerald-500 transition-colors">
                    {t.appName}
                  </span>
                  <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    AI Telemetry
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px] sm:max-w-none">
                  {t.tagline}
                </p>
              </div>
            </button>

            {/* Navigation View Switcher (Landing vs Field Dashboard) */}
            <nav className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => onViewChange('landing')}
                className={`min-h-[32px] px-2.5 sm:px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'landing'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Overview</span>
              </button>

              <button
                type="button"
                onClick={() => onViewChange('dashboard')}
                className={`min-h-[32px] px-2.5 sm:px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'dashboard'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Field Advisor</span>
              </button>
            </nav>
          </div>

          {/* Right Action Controls: Theme + Language + Configure + Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[36px] w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Language Switcher */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
              {(['en', 'hi', 'bn'] as SupportedLanguage[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    language === l
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0 ${
                hasCustomFarm
                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/20 font-bold'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{hasCustomFarm ? t.editFarm : '+ Set Up Farm'}</span>
              <span className="sm:hidden">{hasCustomFarm ? 'Edit' : '+ Farm'}</span>
            </button>

            {/* Auth Badge / Button */}
            <div>
              {authSession ? (
                <div className="flex items-center gap-1.5 p-1 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-xs">
                  <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-slate-900 dark:text-white font-medium truncate max-w-[80px] sm:max-w-[130px]">
                    {authSession.displayName}
                  </span>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="ml-1 p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Sign In</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
