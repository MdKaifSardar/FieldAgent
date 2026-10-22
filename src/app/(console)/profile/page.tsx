'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '@/context/FarmContext';
import { ProfileOverviewView } from '@/components/dashboard/ProfileOverviewView';

function ProfileContent() {
  const router = useRouter();
  const { authSession, parcels, activeParcel, selectParcel } = useFarm();

  const handleSelectParcel = (id: string) => {
    selectParcel(id);
    router.push(`/fields/${id}`);
  };

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
