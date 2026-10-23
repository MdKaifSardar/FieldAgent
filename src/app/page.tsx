'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../components/Header';
import { LandingPage } from '../components/landing/LandingPage';
import { useFarm } from '../context/FarmContext';

export default function RootLandingPage() {
  const router = useRouter();
  const { authSession, signOut, parcels } = useFarm();

  const handleOpenOnboarding = () => {
    if (authSession) {
      router.push('/fields/new');
    } else {
      router.push('/register');
    }
  };

  const handleExploreDashboard = () => {
    if (authSession) {
      router.push('/fields');
    } else {
      router.push('/login');
    }
  };

  const handleViewChange = (view: 'landing' | 'dashboard') => {
    if (view === 'dashboard') {
      router.push('/fields');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-main)] selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <Header
        authSession={authSession}
        onLogout={signOut}
        parcelsCount={parcels.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8">
        <LandingPage
          onOpenOnboarding={handleOpenOnboarding}
          onExploreDashboard={handleExploreDashboard}
          hasCustomFarm={parcels.length > 0}
          authSession={authSession}
        />
      </main>

      <footer className="w-full border-t border-[#E1E8DE] dark:border-[#1F2D24] bg-white/70 dark:bg-[#0D1310]/70 py-5 text-center text-xs text-[#4D6653] dark:text-[#8FA894]">
        <p className="px-4">
          FieldGuard — Autonomous Agronomic Decision Cockpit & Field Telemetry • Built with Next.js & AWS Serverless
        </p>
      </footer>
    </div>
  );
}
