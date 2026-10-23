'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '@/context/FarmContext';
import { ProfileOverviewView } from '@/components/dashboard/ProfileOverviewView';

function ProfileContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { authSession, parcels, activeParcel, selectParcel, isLoadingParcels } = useFarm();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectParcel = (id: string) => {
    selectParcel(id);
    router.push(`/fields/${id}`);
  };

  if (!mounted || isLoadingParcels) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto py-8">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <ProfileOverviewView
      authSession={authSession}
      parcels={parcels}
      activeParcel={activeParcel}
      onSelectParcel={handleSelectParcel}
      onNavigateToFields={() => router.push('/fields')}
      onNavigateToAdvisory={() => {
        if (activeParcel) {
          router.push(`/fields/${activeParcel.id}`);
        } else if (parcels.length > 0) {
          router.push(`/fields/${parcels[0].id}`);
        } else {
          router.push('/fields/new');
        }
      }}
      onOpenNewParcelWizard={() => router.push('/fields/new')}
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
