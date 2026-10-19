'use client';

import React, { useState } from 'react';
import { ConsoleHeader } from './ConsoleHeader';
import { ConsoleSidebar } from './ConsoleSidebar';
import { FarmProfile } from '../../types/farm';
import { AuthSession } from '../../adapters/cognitoAdapter';

interface ConsoleLayoutProps {
  currentView: 'profile' | 'fields' | 'advisory';
  onNavigate: (view: 'profile' | 'fields' | 'advisory') => void;
  parcels: FarmProfile[];
  activeParcel: FarmProfile | null;
  onSelectParcel: (parcelId: string) => void;
  onOpenNewParcelWizard: () => void;
  authSession: AuthSession | null;
  onSignOut: () => void;
  children: React.ReactNode;
}

export function ConsoleLayout({
  currentView,
  onNavigate,
  parcels,
  activeParcel,
  onSelectParcel,
  onOpenNewParcelWizard,
  authSession,
  onSignOut,
  children,
}: ConsoleLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#F6F8F5] dark:bg-[#06131D] text-[#121C15] dark:text-[#F0F9FF] flex transition-colors duration-200">
      {/* 1. Left Persistent Sidebar (Desktop & Tablet) + Rich Mobile Drawer */}
      <ConsoleSidebar
        currentView={currentView}
        onNavigate={onNavigate}
        parcels={parcels}
        activeParcel={activeParcel}
        onSelectParcel={onSelectParcel}
        onOpenNewParcelWizard={onOpenNewParcelWizard}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        authSession={authSession}
        onSignOut={onSignOut}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 pb-6">
        {/* Universal Top Console Bar */}
        <ConsoleHeader
          currentView={currentView}
          onNavigate={onNavigate}
          activeParcel={activeParcel}
          parcels={parcels}
          onSelectParcel={onSelectParcel}
          authSession={authSession}
          onSignOut={onSignOut}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Viewport Workspace */}
        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-5 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
