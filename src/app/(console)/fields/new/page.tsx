'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '@/context/FarmContext';
import { RegisterFieldWorkspaceView } from '@/components/dashboard/RegisterFieldWorkspaceView';
import { FarmProfile } from '@/types/farm';

function NewFieldContent() {
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

export default function NewFieldPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Loading registration wizard...</div>}>
      <NewFieldContent />
    </Suspense>
  );
}
