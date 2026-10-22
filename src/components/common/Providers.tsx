'use client';

import React from 'react';
import { ThemeProvider } from './ThemeContext';
import { LanguageProvider } from './LanguageContext';
import { FarmProvider } from '../../context/FarmContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <FarmProvider>
          {children}
        </FarmProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
