'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '@/context/FarmContext';
import { ProfileOverviewView } from '@/components/dashboard/ProfileOverviewView';

export default function ProfilePage() {
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
