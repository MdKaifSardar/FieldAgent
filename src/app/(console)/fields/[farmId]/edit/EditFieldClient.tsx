'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '@/context/FarmContext';
import { EditFieldWorkspaceView } from '@/components/dashboard/EditFieldWorkspaceView';
import { FarmProfile } from '@/types/farm';

export default function EditFieldClient({ farmId }: { farmId: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  const { parcels, activeParcel, selectParcel, saveParcel, deleteParcel, isLoadingParcels } = useFarm();

  useEffect(() => {
    setMounted(true);
  }, []);

  const targetFarm = parcels.find(p => p.id === farmId) || (activeParcel?.id === farmId ? activeParcel : null);

  useEffect(() => {
    if (farmId && targetFarm && targetFarm.id !== activeParcel?.id) {
      selectParcel(farmId);
    }
  }, [farmId, targetFarm, activeParcel, selectParcel]);

  if (!mounted || isLoadingParcels) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto py-8">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
      </div>
    );
  }

  if (!targetFarm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-xl font-bold mb-2">Field Not Found</h2>
        <p className="text-sm opacity-70 mb-4">The field you requested could not be located in your portfolio.</p>
        <button
          type="button"
          onClick={() => router.push('/fields')}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
        >
          Back to Fields
        </button>
      </div>
    );
  }

  const handleSubmit = async (farm: FarmProfile) => {
    await saveParcel(farm);
    router.push(`/fields/${farm.id}`);
  };

  const handleDelete = async (id: string) => {
    await deleteParcel(id);
    router.push('/fields');
  };

  return (
    <EditFieldWorkspaceView
      key={`${targetFarm.id}-${targetFarm.updatedAt || ''}`}
      initialFarm={targetFarm}
      onCancel={() => router.push(`/fields/${targetFarm.id}`)}
      onSubmit={handleSubmit}
      onDeleteParcel={handleDelete}
    />
  );
}
