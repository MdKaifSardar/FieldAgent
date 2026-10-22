'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '@/context/FarmContext';
import { FieldsDirectoryView } from '@/components/dashboard/FieldsDirectoryView';
import { FarmProfile } from '@/types/farm';

export default function FieldsPage() {
  const router = useRouter();
  const { parcels, activeParcelId, selectParcel, deleteParcel } = useFarm();

  const handleSelectParcel = (parcelId: string) => {
    selectParcel(parcelId);
    router.push(`/fields/${parcelId}`);
  };

  const handleEditParcel = (parcel: FarmProfile) => {
    selectParcel(parcel.id);
    router.push(`/fields/${parcel.id}/edit`);
  };

  return (
    <FieldsDirectoryView
      parcels={parcels}
      activeParcelId={activeParcelId}
      onSelectParcel={handleSelectParcel}
      onNavigateToAdvisory={() => {
        if (activeParcelId) {
          router.push(`/fields/${activeParcelId}`);
        } else if (parcels.length > 0) {
          router.push(`/fields/${parcels[0].id}`);
        } else {
          router.push('/fields/new');
        }
      }}
      onOpenNewParcelWizard={() => router.push('/fields/new')}
      onEditParcel={handleEditParcel}
      onDeleteParcel={(parcelId) => deleteParcel(parcelId)}
    />
  );
}
