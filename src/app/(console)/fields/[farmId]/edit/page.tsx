'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFarm } from '@/context/FarmContext';
import { EditFieldWorkspaceView } from '@/components/dashboard/EditFieldWorkspaceView';
import { FarmProfile } from '@/types/farm';

export default function EditFieldPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = typeof params?.farmId === 'string' ? params.farmId : Array.isArray(params?.farmId) ? params.farmId[0] : '';
  
  const { parcels, activeParcel, selectParcel, saveParcel, deleteParcel } = useFarm();

  const targetFarm = parcels.find(p => p.id === farmId) || (activeParcel?.id === farmId ? activeParcel : null);

  useEffect(() => {
    if (farmId && targetFarm && targetFarm.id !== activeParcel?.id) {
      selectParcel(farmId);
    }
  }, [farmId, targetFarm, activeParcel, selectParcel]);

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
      initialFarm={targetFarm}
      onCancel={() => router.push(`/fields/${targetFarm.id}`)}
      onSubmit={handleSubmit}
      onDeleteParcel={handleDelete}
    />
  );
}
