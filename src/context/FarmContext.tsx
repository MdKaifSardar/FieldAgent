'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { FarmProfile } from '../types/farm';
import { DailyWeatherForecast } from '../types/weather';
import { DecisionResponse } from '../types/decision';
import { AuthSession } from '../adapters/cognitoAdapter';
import { 
  getFarmsByUserId, 
  saveFarmProfileToDynamo, 
  deleteFarmFromDynamo,
  logDecisionToDynamo 
} from '../adapters/dynamoDbAdapter';
import { fetchLiveWeatherForecast } from '../adapters/openMeteoAdapter';
import { runFeasibilityPlanner } from '../core/feasibilityPlanner';
import { PRESET_1_RAIN_AVOIDANCE, PRESET_2_RESOURCE_DEFICIT } from '../core/demoPresets';

interface FarmContextType {
  parcels: FarmProfile[];
  activeParcelId: string | null;
  activeParcel: FarmProfile | null;
  currentForecast: DailyWeatherForecast | null;
  decision: DecisionResponse | null;
  authSession: AuthSession | null;
  isLoadingParcels: boolean;
  isRefreshingWeather: boolean;
  weatherErrorMessage?: string;
  isDemoMode: boolean;
  // Simulation
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  interactiveRainMm: number;
  setInteractiveRainMm: (val: number) => void;
  interactiveTankLiters: number;
  setInteractiveTankLiters: (val: number) => void;
  handleRainSliderChange: (val: number) => void;
  handleTankSliderChange: (val: number) => void;
  // Alexa Modal
  isAlexaModalOpen: boolean;
  alexaInitialPrompt?: string;
  openAlexaModal: (initialPrompt?: string) => void;
  closeAlexaModal: () => void;
  // Actions
  selectParcel: (parcelId: string) => void;
  saveParcel: (parcel: FarmProfile) => Promise<void>;
  deleteParcel: (parcelId: string) => Promise<void>;
  refreshWeather: () => Promise<void>;
  onFarmStateModified: (updatedFarm?: FarmProfile, newDecision?: DecisionResponse) => void;
  signOut: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const isDemoMode = process.env.NEXT_PUBLIC_ENABLE_DEMO_SANDBOX === 'true';

  const [parcels, setParcels] = useState<FarmProfile[]>([]);
  const [activeParcelId, setActiveParcelId] = useState<string | null>(null);
  const [currentForecast, setCurrentForecast] = useState<DailyWeatherForecast | null>(null);
  const currentForecastRef = useRef<DailyWeatherForecast | null>(null);
  const lastLoggedDecisionKeyRef = useRef<string | null>(null);
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isLoadingParcels, setIsLoadingParcels] = useState<boolean>(true);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState<boolean>(false);
  const [weatherErrorMessage, setWeatherErrorMessage] = useState<string | undefined>(undefined);

  // Simulation levers
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [interactiveTankLiters, setInteractiveTankLiters] = useState<number>(3200);
  const [interactiveRainMm, setInteractiveRainMm] = useState<number>(22.0);

  // Alexa Modal
  const [isAlexaModalOpen, setIsAlexaModalOpen] = useState<boolean>(false);
  const [alexaInitialPrompt, setAlexaInitialPrompt] = useState<string | undefined>(undefined);

  const activeParcel = parcels.find((p) => p.id === activeParcelId) || parcels[0] || null;

  // Run calculation on a farm profile
  const runFarmPlanning = useCallback(async (farm: FarmProfile) => {
    setIsRefreshingWeather(true);
    setWeatherErrorMessage(undefined);
    try {
      const wRes = await fetchLiveWeatherForecast(
        farm.location.latitude,
        farm.location.longitude
      );
      setCurrentForecast(wRes.forecast);
      currentForecastRef.current = wRes.forecast;
      setInteractiveRainMm(wRes.forecast.rainfall_mm);
      setInteractiveTankLiters(farm.reserve.currentAvailable_liters);
      if (wRes.errorMessage) {
        setWeatherErrorMessage(wRes.errorMessage);
      }

      const planRes = runFeasibilityPlanner({
        plots: farm.plots,
        awc_mm_per_m: farm.soil.awc_mm_per_m,
        reserve: farm.reserve,
        forecast: wRes.forecast,
      });

      setDecision(planRes);

      // Deduplicated logging
      const logKey = `${farm.id}:${planRes.decision}:${Math.round(planRes.totalFarmDemand_liters)}`;
      if (lastLoggedDecisionKeyRef.current !== logKey) {
        lastLoggedDecisionKeyRef.current = logKey;
        logDecisionToDynamo(farm.id, planRes).catch((e) => {
          console.warn('Background DynamoDB logging notice:', e);
        });
      }
    } catch (e: any) {
      console.error('Failed to run farm planning:', e);
      setWeatherErrorMessage('Weather forecast unavailable. Using cached meteorological baselines.');
    } finally {
      setIsRefreshingWeather(false);
    }
  }, []);

  // Initialize Auth & Parcels
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let loadedParcels: FarmProfile[] = [];
    const savedAuth = localStorage.getItem('fieldguard_auth');
    let parsedAuth: AuthSession | null = null;
    if (savedAuth) {
      try {
        parsedAuth = JSON.parse(savedAuth) as AuthSession;
        setAuthSession(parsedAuth);
      } catch (e) {}
    }

    // 1. Read local parcels
    const savedParcelsJson = localStorage.getItem('fieldguard_user_parcels');
    if (savedParcelsJson) {
      try {
        loadedParcels = JSON.parse(savedParcelsJson) as FarmProfile[];
      } catch (e) {}
    }

    // Backward compatibility for single saved farm
    if (!loadedParcels.length) {
      const singleFarmJson = localStorage.getItem('fieldguard_saved_farm');
      if (singleFarmJson) {
        try {
          const single = JSON.parse(singleFarmJson) as FarmProfile;
          if (single && single.id && !single.id.startsWith('farm-bardhaman') && single.userId !== 'farmer-ramesh') {
            loadedParcels = [single];
          }
        } catch (e) {}
      }
    }

    // If still no parcels, inject demo presets for instant demo evaluator access
    if (!loadedParcels.length) {
      loadedParcels = [PRESET_1_RAIN_AVOIDANCE.farm, PRESET_2_RESOURCE_DEFICIT.farm];
    }

    setParcels(loadedParcels);
    const savedActiveId = localStorage.getItem('fieldguard_active_parcel_id');
    const targetParcel = loadedParcels.find((p) => p.id === savedActiveId) || loadedParcels[0];
    setActiveParcelId(targetParcel.id);
    runFarmPlanning(targetParcel);
    setIsLoadingParcels(false);

    // 2. Background sync from DynamoDB if authenticated
    if (parsedAuth?.userId) {
      getFarmsByUserId(parsedAuth.userId).then((remoteFarms) => {
        if (remoteFarms && remoteFarms.length > 0) {
          setParcels(remoteFarms);
          localStorage.setItem('fieldguard_user_parcels', JSON.stringify(remoteFarms));
          if (!remoteFarms.some((f) => f.id === targetParcel.id)) {
            setActiveParcelId(remoteFarms[0].id);
            runFarmPlanning(remoteFarms[0]);
          }
        }
      }).catch((err) => {
        console.warn('Background sync of user parcels notice:', err);
      });
    }
  }, [runFarmPlanning]);

  const selectParcel = useCallback((parcelId: string) => {
    setActiveParcelId(parcelId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fieldguard_active_parcel_id', parcelId);
    }
    const target = parcels.find((p) => p.id === parcelId);
    if (target) {
      runFarmPlanning(target);
    }
  }, [parcels, runFarmPlanning]);

  const saveParcel = useCallback(async (farm: FarmProfile) => {
    setParcels((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === farm.id);
      let updated: FarmProfile[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = farm;
      } else {
        updated = [farm, ...prev];
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('fieldguard_user_parcels', JSON.stringify(updated));
      }
      return updated;
    });

    setActiveParcelId(farm.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fieldguard_active_parcel_id', farm.id);
    }

    await saveFarmProfileToDynamo(farm);
    runFarmPlanning(farm);
  }, [runFarmPlanning]);

  const deleteParcel = useCallback(async (parcelId: string) => {
    setParcels((prev) => {
      const remaining = prev.filter((p) => p.id !== parcelId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fieldguard_user_parcels', JSON.stringify(remaining));
      }
      return remaining;
    });

    try {
      await deleteFarmFromDynamo(parcelId);
    } catch (e) {
      console.warn('DynamoDB delete notice:', e);
    }

    if (activeParcelId === parcelId) {
      const fallback = parcels.find((p) => p.id !== parcelId);
      if (fallback) {
        selectParcel(fallback.id);
      }
    }
  }, [activeParcelId, parcels, selectParcel]);

  const refreshWeather = useCallback(async () => {
    if (activeParcel) {
      await runFarmPlanning(activeParcel);
    }
  }, [activeParcel, runFarmPlanning]);

  const openAlexaModal = useCallback((initialPrompt?: string) => {
    setAlexaInitialPrompt(initialPrompt);
    setIsAlexaModalOpen(true);
  }, []);

  const closeAlexaModal = useCallback(() => {
    setIsAlexaModalOpen(false);
    setAlexaInitialPrompt(undefined);
  }, []);

  const onFarmStateModified = useCallback((updatedFarm?: FarmProfile, newDecision?: DecisionResponse) => {
    if (updatedFarm) {
      setParcels((prev) => {
        const idx = prev.findIndex((p) => p.id === updatedFarm.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = updatedFarm;
          if (typeof window !== 'undefined') {
            localStorage.setItem('fieldguard_user_parcels', JSON.stringify(updated));
          }
          return updated;
        }
        return prev;
      });

      if (updatedFarm.reserve?.currentAvailable_liters !== undefined) {
        setInteractiveTankLiters(updatedFarm.reserve.currentAvailable_liters);
      }
    }

    if (newDecision) {
      setDecision(newDecision);
    }
  }, []);

  const handleTankSliderChange = useCallback((newTank: number) => {
    setInteractiveTankLiters(newTank);
    if (!activeParcel || !currentForecast) return;

    const res = runFeasibilityPlanner({
      plots: activeParcel.plots,
      awc_mm_per_m: activeParcel.soil.awc_mm_per_m,
      reserve: {
        ...activeParcel.reserve,
        currentAvailable_liters: newTank,
      },
      forecast: currentForecast,
      isDemoPreset: false,
    });

    setDecision(res);
  }, [activeParcel, currentForecast]);

  const handleRainSliderChange = useCallback((newRain: number) => {
    setInteractiveRainMm(newRain);
    if (!activeParcel || !currentForecast) return;

    const updatedForecast = {
      ...currentForecast,
      rainfall_mm: newRain,
      precipitation_probability_pct: newRain > 0 ? 80 : 10,
    };
    setCurrentForecast(updatedForecast);

    const res = runFeasibilityPlanner({
      plots: activeParcel.plots,
      awc_mm_per_m: activeParcel.soil.awc_mm_per_m,
      reserve: {
        ...activeParcel.reserve,
        currentAvailable_liters: interactiveTankLiters,
      },
      forecast: updatedForecast,
      isDemoPreset: false,
    });

    setDecision(res);
  }, [activeParcel, currentForecast, interactiveTankLiters]);

  const signOut = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fieldguard_auth');
    }
    setAuthSession(null);
  }, []);

  return (
    <FarmContext.Provider
      value={{
        parcels,
        activeParcelId,
        activeParcel,
        currentForecast,
        decision,
        authSession,
        isLoadingParcels,
        isRefreshingWeather,
        weatherErrorMessage,
        isDemoMode,
        isSimulating,
        setIsSimulating,
        interactiveRainMm,
        setInteractiveRainMm,
        interactiveTankLiters,
        setInteractiveTankLiters,
        handleRainSliderChange,
        handleTankSliderChange,
        isAlexaModalOpen,
        alexaInitialPrompt,
        openAlexaModal,
        closeAlexaModal,
        selectParcel,
        saveParcel,
        deleteParcel,
        refreshWeather,
        onFarmStateModified,
        signOut,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
}
