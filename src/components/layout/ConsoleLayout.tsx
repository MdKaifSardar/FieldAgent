'use client';

import React, { useState, Suspense } from 'react';
import { ConsoleHeader } from './ConsoleHeader';
import { ConsoleSidebar } from './ConsoleSidebar';
import { FarmProfile } from '../../types/farm';
import { AuthSession } from '../../adapters/cognitoAdapter';
import { useFarm } from '../../context/FarmContext';
import { AlexaAdvisorModal } from '../alexa/AlexaAdvisorModal';
import { Sparkles } from 'lucide-react';

export interface ConsoleLayoutProps {
  currentView?: 'profile' | 'fields' | 'advisory' | 'register-field' | 'edit-field';
  onNavigate?: (view: 'profile' | 'fields' | 'advisory' | 'register-field' | 'edit-field') => void;
  parcels?: FarmProfile[];
  activeParcel?: FarmProfile | null;
  onSelectParcel?: (parcelId: string) => void;
  onOpenNewParcelWizard?: () => void;
  authSession?: AuthSession | null;
  onSignOut?: () => void;
  onOpenAlexaModal?: () => void;
  children: React.ReactNode;
}

export function ConsoleLayout(props: ConsoleLayoutProps) {
  const farmCtx = useFarm();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const parcels = props.parcels ?? farmCtx.parcels;
  const activeParcel = props.activeParcel !== undefined ? props.activeParcel : farmCtx.activeParcel;
  const onSelectParcel = props.onSelectParcel ?? farmCtx.selectParcel;
  const authSession = props.authSession !== undefined ? props.authSession : farmCtx.authSession;
  const onSignOut = props.onSignOut ?? farmCtx.signOut;
  const onOpenAlexaModal = props.onOpenAlexaModal ?? (() => farmCtx.openAlexaModal());

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F6F8F5] dark:bg-[#06131D] text-[#121C15] dark:text-[#F0F9FF] flex transition-colors duration-200">
      {/* 1. Left Persistent Sidebar (Fixed in place, non-scrolling rail) */}
      <Suspense fallback={<aside className="hidden md:flex w-64 h-screen border-r border-[#E1E8DE] dark:border-[#16364D] bg-white dark:bg-[#0A1C2A]" />}>
        <ConsoleSidebar
          currentView={props.currentView}
          onNavigate={props.onNavigate}
          parcels={parcels}
          activeParcel={activeParcel}
          onSelectParcel={onSelectParcel}
          onOpenNewParcelWizard={props.onOpenNewParcelWizard}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          authSession={authSession}
          onSignOut={onSignOut}
        />
      </Suspense>

      {/* 2. Main Workspace Canvas: Dedicated Smooth Scroll Area */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-y-auto">
        {/* Universal Top Console Bar (Sticky) */}
        <Suspense fallback={<header className="sticky top-0 z-30 h-16 shrink-0 bg-white dark:bg-[#0A1C2A] border-b border-[#E1E8DE] dark:border-[#16364D]" />}>
          <ConsoleHeader
            currentView={props.currentView}
            onNavigate={props.onNavigate}
            activeParcel={activeParcel}
            parcels={parcels}
            onSelectParcel={onSelectParcel}
            authSession={authSession}
            onSignOut={onSignOut}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            onOpenAlexaModal={onOpenAlexaModal}
          />
        </Suspense>

        {/* Viewport Workspace */}
        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-5 max-w-7xl w-full mx-auto pb-12">
          {props.children}
        </main>
      </div>

      {/* Floating Alexa+ Copilot Quick-Access Button */}
      <button
        type="button"
        onClick={() => farmCtx.openAlexaModal()}
        className="fixed bottom-6 right-6 z-40 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-sky-600 via-cyan-500 to-blue-600 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-2 shadow-xl hover:shadow-cyan-500/30 transition-all cursor-pointer border border-cyan-400/40 group select-none"
        title="Ask Alexa+ Field Advisor"
      >
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-['Outfit'] tracking-wide">Ask Alexa+</span>
      </button>

      {/* Alexa+ Simulated Field Advisor Modal */}
      <Suspense fallback={null}>
        <AlexaAdvisorModal
          isOpen={farmCtx.isAlexaModalOpen}
          onClose={farmCtx.closeAlexaModal}
          farmId={activeParcel?.id || 'farm-bardhaman-01'}
          farmName={activeParcel?.farmName || 'Your Farm'}
          initialPrompt={farmCtx.alexaInitialPrompt}
          onFarmStateModified={farmCtx.onFarmStateModified}
        />
      </Suspense>
    </div>
  );
}
