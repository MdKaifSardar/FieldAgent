'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFarm } from '@/context/FarmContext';
import { FieldAdvisoryView } from '@/components/dashboard/FieldAdvisoryView';
import { FarmProfile } from '@/types/farm';

export default function FieldAdvisoryPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = typeof params?.farmId === 'string' ? params.farmId : Array.isArray(params?.farmId) ? params.farmId[0] : '';
  
  const {
    parcels,
    activeParcelId,
    activeParcel,
    selectParcel,
    currentForecast,
    decision,
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

  // If activeParcel does not match farmId from URL, sync active parcel
  useEffect(() => {
    if (farmId && activeParcelId !== farmId && parcels.some(p => p.id === farmId)) {
      selectParcel(farmId);
    }
  }, [farmId, activeParcelId, parcels, selectParcel]);

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
