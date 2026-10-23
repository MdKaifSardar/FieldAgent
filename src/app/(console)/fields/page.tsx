'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '@/context/FarmContext';
import { FieldsDirectoryView } from '@/components/dashboard/FieldsDirectoryView';
import { FarmProfile } from '@/types/farm';

function FieldsContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { parcels, activeParcelId, selectParcel, deleteParcel, isLoadingParcels } = useFarm();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectParcel = (parcelId: string) => {
    selectParcel(parcelId);
    router.push(`/fields/${parcelId}`);
  };

  const handleEditParcel = (parcel: FarmProfile) => {
    selectParcel(parcel.id);
    router.push(`/fields/${parcel.id}/edit`);
  };

  if (!mounted || isLoadingParcels) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto py-8">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

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
