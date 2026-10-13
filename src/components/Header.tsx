import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  Sprout,
  Menu,
  ChevronDown,
  Check
} from 'lucide-react';
import { useLanguage } from './common/LanguageContext';
import { useTheme } from './common/ThemeContext';
import { SupportedLanguage } from '../adapters/speechAdapter';
import { AuthSession } from '../adapters/cognitoAdapter';
import { MobileSideDrawer } from './common/MobileSideDrawer';

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
  onResetFarm,
  activeView,
  onViewChange,
}: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
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
    <>
      <header className="w-full border-b border-[#E1E8DE] dark:border-[#1F2D24] bg-white/95 dark:bg-[#0D1310]/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2.5 sm:gap-4">
            
            {/* Logo & Navigation Tabs */}
            <div className="flex items-center gap-3 sm:gap-5">
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

              {/* Navigation View Switcher (Landing vs Field Dashboard) - Only accessible when authenticated */}
              {authSession && (
                <nav className="hidden sm:flex items-center bg-[#F0F4ED] dark:bg-[#1B2720] p-0.5 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] text-xs">
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
                    <span>{t.overview}</span>
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

            {/* Desktop Action Controls */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              
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
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#F0F4ED] hover:bg-[#E4EBE0] dark:bg-[#1B2720] dark:hover:bg-[#23322A] border border-[#E1E8DE] dark:border-[#2A3E31] text-[#121C15] dark:text-[#F0F4F1] flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  aria-label="Select Language"
                  aria-expanded={isLangDropdownOpen}
                  aria-haspopup="true"
                >
                  <Globe className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
                  <span>
                    {language === 'en' ? 'English' : language === 'hi' ? 'हिन्दी' : 'বাংলা'}
                  </span>
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

              {/* Farm Profile Configurator Button - ONLY accessible after sign-in */}
              {authSession && (
                <button
                  type="button"
                  onClick={onOpenOnboarding}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${
                    hasCustomFarm
                      ? 'bg-[#F0F4ED] hover:bg-[#E4EBE0] dark:bg-[#1B2720] dark:hover:bg-[#23322A] border border-[#E1E8DE] dark:border-[#2A3E31] text-[#121C15] dark:text-[#F0F4F1]'
                      : 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm font-bold'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{hasCustomFarm ? t.editFarm : t.setUpFarm}</span>
                </button>
              )}

              {/* Auth Badge / Sign In Button */}
              <div>
                {authSession ? (
                  <div className="flex items-center gap-1.5 p-1 px-2.5 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] text-xs">
                    <User className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
                    <span className="text-[#121C15] dark:text-[#F0F4F1] font-medium truncate max-w-[120px]">
                      {authSession.displayName}
                    </span>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="ml-1 p-0.5 text-[#526356] hover:text-rose-500 cursor-pointer"
                      title={t.signOut}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
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

            {/* Mobile Header Actions */}
            <div className="flex md:hidden items-center gap-2 shrink-0">
              {authSession ? (
                <button
                  type="button"
                  onClick={onOpenOnboarding}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold bg-[#16A34A] text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{hasCustomFarm ? 'Parcel' : '+ Farm'}</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold bg-[#16A34A] text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.signIn}</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] text-[#121C15] dark:text-[#F0F4F1] flex items-center justify-center cursor-pointer shadow-xs"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 text-[#16A34A]" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Slide-over Mobile Side Menu Drawer */}
      <MobileSideDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onOpenOnboarding={onOpenOnboarding}
        onOpenAuth={onOpenAuth}
        authSession={authSession}
        onLogout={onLogout}
        hasCustomFarm={hasCustomFarm}
        onResetFarm={onResetFarm}
        activeView={activeView}
        onViewChange={onViewChange}
      />
    </>
  );
}
