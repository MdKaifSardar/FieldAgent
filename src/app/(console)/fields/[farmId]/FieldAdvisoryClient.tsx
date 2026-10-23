'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '@/context/FarmContext';
import { FieldAdvisoryView } from '@/components/dashboard/FieldAdvisoryView';
import { CockpitSkeleton } from '@/components/skeletons/CockpitSkeleton';
import { FarmProfile } from '@/types/farm';

export default function FieldAdvisoryClient({ farmId }: { farmId: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  const {
    parcels,
    activeParcelId,
    activeParcel,
    selectParcel,
    currentForecast,
    decision,
    isLoadingParcels,
    isRefreshingWeather,
    weatherErrorMessage,
    refreshWeather,
    isDemoMode,
    isSimulating,
    setIsSimulating,
    interactiveRainMm,
    handleRainSliderChange,
    interactiveTankLiters,
    handleTankSliderChange,
    openAlexaModal,
  } = useFarm();

  useEffect(() => {
    setMounted(true);
  }, []);

  // If activeParcel does not match farmId from URL, sync active parcel
  useEffect(() => {
    if (farmId && activeParcelId !== farmId && parcels.some(p => p.id === farmId)) {
      selectParcel(farmId);
    }
  }, [farmId, activeParcelId, parcels, selectParcel]);

  if (!mounted || isLoadingParcels) {
    return <CockpitSkeleton />;
  }

  const targetFarm = parcels.find(p => p.id === farmId) || activeParcel;

  return (
    <FieldAdvisoryView
      currentFarm={targetFarm}
      currentForecast={currentForecast}
      decision={decision}
      parcels={parcels}
      onSelectParcel={(id) => {
        selectParcel(id);
        router.push(`/fields/${id}`);
      }}
      onEditParcel={(farm: FarmProfile) => {
        selectParcel(farm.id);
        router.push(`/fields/${farm.id}/edit`);
      }}
      onOpenNewParcelWizard={() => router.push('/fields/new')}
      isRefreshingWeather={isRefreshingWeather}
      weatherErrorMessage={weatherErrorMessage}
      onRefreshWeather={refreshWeather}
      isDemoMode={isDemoMode}
      isSimulating={isSimulating}
      onToggleSimulation={setIsSimulating}
      interactiveRainMm={interactiveRainMm}
      onRainSliderChange={handleRainSliderChange}
      interactiveTankLiters={interactiveTankLiters}
      onTankSliderChange={handleTankSliderChange}
      onOpenAlexaModal={openAlexaModal}
    />
  );
}
