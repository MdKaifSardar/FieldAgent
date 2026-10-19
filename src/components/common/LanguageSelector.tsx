'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { SupportedLanguage } from '../../adapters/speechAdapter';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
];

export function LanguageSelector({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#112B3E] hover:bg-slate-200/80 dark:hover:bg-[#16364D] border border-slate-200 dark:border-[#16364D] text-xs font-semibold text-slate-700 dark:text-[#F0F9FF] transition-all cursor-pointer shadow-2xs"
      >
        <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
        <span className="font-medium">{activeOption.nativeLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Custom Designed Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-[#0D2232] border border-slate-200 dark:border-[#16364D] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 border-b border-slate-100 dark:border-[#16364D] mb-1">
            Interface Language
          </div>
          {LANGUAGES.map((opt) => {
            const isSelected = opt.code === language;
            return (
              <button
                key={opt.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.code)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-sky-500/15 text-sky-600 dark:text-[#38BDF8] font-bold'
                    : 'text-slate-700 dark:text-[#F0F9FF] hover:bg-slate-100 dark:hover:bg-[#112B3E]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="leading-tight">{opt.nativeLabel}</span>
                  {opt.nativeLabel !== opt.label && (
                    <span className="text-[10px] text-slate-400 leading-tight">{opt.label}</span>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-sky-500 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
