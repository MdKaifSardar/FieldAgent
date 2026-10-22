'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '@/context/FarmContext';
import { RegisterFieldWorkspaceView } from '@/components/dashboard/RegisterFieldWorkspaceView';
import { FarmProfile } from '@/types/farm';

export default function NewFieldPage() {
  const router = useRouter();
  const { parcels, saveParcel } = useFarm();

  const handleCancel = () => {
    if (parcels.length > 0) {
      router.push('/fields');
    } else {
      router.push('/profile');
    }
  };

  const handleSubmit = async (farm: FarmProfile) => {
    await saveParcel(farm);
    router.push(`/fields/${farm.id}`);
  };

  return (
    <RegisterFieldWorkspaceView
      onCancel={handleCancel}
      onSubmit={handleSubmit}
    />
  );
}
