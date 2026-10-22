'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '@/context/FarmContext';
import { FieldsDirectoryView } from '@/components/dashboard/FieldsDirectoryView';
import { FarmProfile } from '@/types/farm';

function FieldsContent() {
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

export default function FieldsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Loading fields directory...</div>}>
      <FieldsContent />
    </Suspense>
  );
}
