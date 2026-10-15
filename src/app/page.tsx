'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../components/Header';
import { DecisionCard } from '../components/DecisionCard';
import { EnvironmentalLedgerCard } from '../components/EnvironmentalLedgerCard';
import { WaterBudgetCard } from '../components/WaterBudgetCard';
import { AwsProofDrawer } from '../components/AwsProofDrawer';
import { StepperWizard } from '../components/onboarding/StepperWizard';
import { LiveClimateStation } from '../components/climate/LiveClimateStation';
import { DemoSandboxDock } from '../components/demo/DemoSandboxDock';
import { LandingPage } from '../components/landing/LandingPage';
import { LanguageProvider, useLanguage } from '../components/common/LanguageContext';
import { ThemeProvider } from '../components/common/ThemeContext';
import { executePreset, DEMO_PRESETS, PRESET_1_RAIN_AVOIDANCE } from '../core/demoPresets';
import { runFeasibilityPlanner } from '../core/feasibilityPlanner';
import { fetchLiveWeatherForecast } from '../adapters/openMeteoAdapter';
import { 
  saveFarmProfileToDynamo, 
  logDecisionToDynamo,
  getFarmsByUserId,
  deleteFarmFromDynamo
} from '../adapters/dynamoDbAdapter';
import { AuthSession } from '../adapters/cognitoAdapter';
import { DecisionResponse } from '../types/decision';
import { FarmProfile } from '../types/farm';
import { DailyWeatherForecast } from '../types/weather';
import { EnterpriseSideDrawer } from '../components/common/EnterpriseSideDrawer';
import { 
  Sliders, 
  RefreshCw, 
  Sprout, 
  MapPin, 
  Layers, 
  Droplets, 
  SlidersHorizontal,
  Plus,
  Zap,
  Waves,
  Cylinder,
  Edit3
} from 'lucide-react';

function FieldGuardApp() {
  const router = useRouter();
  const { t } = useLanguage();
  
  // Navigation View State: 'landing' vs 'dashboard'
  const [activeView, setActiveView] = useState<'landing' | 'dashboard'>('landing');

  // Multi-Parcel Portfolio State
  const [parcels, setParcels] = useState<FarmProfile[]>([]);
  const [activeParcelId, setActiveParcelId] = useState<string | null>(null);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState<boolean>(false);
  const [editingParcel, setEditingParcel] = useState<FarmProfile | null>(null);

  // Real User Farm state vs Demo Sandbox Preset ID (null = viewing user's own real farm or empty dashboard)
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [hasCustomFarm, setHasCustomFarm] = useState<boolean>(false);
  const [currentFarm, setCurrentFarm] = useState<FarmProfile | null>(null);
  const [currentForecast, setCurrentForecast] = useState<DailyWeatherForecast | null>(null);
  const currentForecastRef = useRef<DailyWeatherForecast | null>(null);
  const lastLoggedDecisionKeyRef = useRef<string | null>(null);
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [storageStatus, setStorageStatus] = useState<string>('aws_dynamodb');
  
  // Modals
  const [isParcelWizardOpen, setIsParcelWizardOpen] = useState<boolean>(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  
  // Loading & Diagnostics
  const [isRefreshingWeather, setIsRefreshingWeather] = useState<boolean>(false);
  const [weatherErrorMessage, setWeatherErrorMessage] = useState<string | undefined>(undefined);

  // Simulation mode toggling (strictly for developer what-if levers)
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [interactiveTankLiters, setInteractiveTankLiters] = useState<number>(3200);
  const [interactiveRainMm, setInteractiveRainMm] = useState<number>(22.0);

  // Master Demo Mode Gate: Strictly controlled by process.env.NEXT_PUBLIC_ENABLE_DEMO_SANDBOX
  // Only the developer with access to .env / deployment configuration can toggle this.
  const isDemoMode = process.env.NEXT_PUBLIC_ENABLE_DEMO_SANDBOX === 'true';

  // Function to run calculation on a real live farm profile
  const runLiveFarmPlanning = useCallback(async (farm: FarmProfile) => {
    setIsRefreshingWeather(true);
    setWeatherErrorMessage(undefined);
    try {
      // 1. Fetch live weather for the farmer's coordinates
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

      // 2. Run deterministic FAO-56 feasibility planner
      const planRes = runFeasibilityPlanner({
        plots: farm.plots,
        awc_mm_per_m: farm.soil.awc_mm_per_m,
        reserve: farm.reserve,
        forecast: wRes.forecast,
        isDemoPreset: false,
      });

      setDecision(planRes);
      setStorageStatus('aws_dynamodb');

      // 3. Log decision to Amazon DynamoDB in background (deduplicated by farm & decision)
      const logKey = `${farm.id}:${planRes.decision}:${Math.round(planRes.totalFarmDemand_liters)}`;
      if (lastLoggedDecisionKeyRef.current !== logKey) {
        lastLoggedDecisionKeyRef.current = logKey;
        logDecisionToDynamo(farm.id, planRes).catch((e) => {
          console.warn('Background DynamoDB logging notice:', e);
        });
      }
    } catch (err: any) {
      console.warn('Live calculation error:', err);
      // Fallback calculation using existing forecast if available
      if (currentForecastRef.current) {
        const planRes = runFeasibilityPlanner({
          plots: farm.plots,
          awc_mm_per_m: farm.soil.awc_mm_per_m,
          reserve: farm.reserve,
          forecast: currentForecastRef.current,
          isDemoPreset: false,
        });
        setDecision(planRes);
      }
    } finally {
      setIsRefreshingWeather(false);
    }
  }, []);

  // ON MOUNT: Enforce strict auth gate. Dashboard is only accessible with an active auth session!
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('fieldguard_auth');
      if (savedAuth) {
        try {
          const parsedAuth = JSON.parse(savedAuth) as AuthSession;
          setAuthSession(parsedAuth);

          // 1. Check local parcels array first
          let loadedParcels: FarmProfile[] = [];
          const savedParcelsJson = localStorage.getItem('fieldguard_user_parcels');
          if (savedParcelsJson) {
            try {
              loadedParcels = JSON.parse(savedParcelsJson) as FarmProfile[];
            } catch (e) {}
          }

          // Backward compatibility check for single saved farm
          if (!loadedParcels.length) {
            const singleFarmJson = localStorage.getItem('fieldguard_saved_farm');
            if (singleFarmJson) {
              try {
                const singleFarm = JSON.parse(singleFarmJson) as FarmProfile;
                if (singleFarm && singleFarm.id && !singleFarm.id.startsWith('farm-bardhaman') && singleFarm.userId !== 'farmer-ramesh') {
                  loadedParcels = [singleFarm];
                }
              } catch (e) {}
            }
          }

          if (loadedParcels.length > 0) {
            setParcels(loadedParcels);
            setHasCustomFarm(true);
            setActiveView('dashboard');

            // Pick active parcel from saved active ID or first parcel
            const savedActiveId = localStorage.getItem('fieldguard_active_parcel_id');
            const targetParcel = loadedParcels.find(p => p.id === savedActiveId) || loadedParcels[0];
            setActiveParcelId(targetParcel.id);
            setCurrentFarm(targetParcel);
            runLiveFarmPlanning(targetParcel);
          } else {
            setActiveView('dashboard');
          }

          // 2. Background sync from DynamoDB by userId
          if (parsedAuth.userId) {
            getFarmsByUserId(parsedAuth.userId).then((remoteFarms) => {
              if (remoteFarms && remoteFarms.length > 0) {
                setParcels(remoteFarms);
                setHasCustomFarm(true);
                localStorage.setItem('fieldguard_user_parcels', JSON.stringify(remoteFarms));

                // If no current parcel was selected, select the first remote farm
                if (!currentFarm) {
                  const target = remoteFarms[0];
                  setActiveParcelId(target.id);
                  setCurrentFarm(target);
                  runLiveFarmPlanning(target);
                }
              }
            }).catch((err) => {
              console.warn('Background sync of user parcels notice:', err);
            });
          }

          return;
        } catch (e) {
          console.error('Failed to parse saved auth:', e);
        }
      }

      // Unauthenticated visitor: STRICTLY single landing page
      setActiveView('landing');
      setCurrentFarm(null);
      setHasCustomFarm(false);
      setDecision(null);
    }
  }, [runLiveFarmPlanning]);

  // Auth-gated View Switcher Handler: Unauthenticated clicks direct to /login
  const handleViewChange = (view: 'landing' | 'dashboard') => {
    if (view === 'dashboard' && !authSession) {
      router.push('/login');
      return;
    }
    setActiveView(view);
  };

  const handleLogout = () => {
    setAuthSession(null);
    setCurrentFarm(null);
    setHasCustomFarm(false);
    setActivePresetId(null);
    setDecision(null);
    setActiveView('landing');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fieldguard_auth');
    }
  };

  // Called when the user configures or edits a farm parcel via the wizard
  const handleCustomFarmSubmit = (submittedFarm: FarmProfile) => {
    const farmWithUser: FarmProfile = {
      ...submittedFarm,
      userId: authSession?.userId || submittedFarm.userId,
    };

    let updatedParcels: FarmProfile[];
    const existingIndex = parcels.findIndex(p => p.id === farmWithUser.id);
    if (existingIndex >= 0) {
      // Edit existing parcel
      updatedParcels = [...parcels];
      updatedParcels[existingIndex] = farmWithUser;
    } else {
      // Add new parcel
      updatedParcels = [farmWithUser, ...parcels];
    }

    setParcels(updatedParcels);
    setActiveParcelId(farmWithUser.id);
    setCurrentFarm(farmWithUser);
    setHasCustomFarm(true);
    setActivePresetId(null);
    setActiveView('dashboard');
    setIsParcelWizardOpen(false);
    setEditingParcel(null);

    // 1. Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('fieldguard_user_parcels', JSON.stringify(updatedParcels));
      localStorage.setItem('fieldguard_active_parcel_id', farmWithUser.id);
      localStorage.setItem('fieldguard_saved_farm', JSON.stringify(farmWithUser));
    }

    // 2. Persist to Amazon DynamoDB strictly under authenticated userId
    saveFarmProfileToDynamo(farmWithUser)
      .then((res) => {
        setStorageStatus(res.storage);
      })
      .catch((err) => {
        console.error('DynamoDB save error:', err);
      });

    // 3. Run planning with fresh weather for this parcel
    runLiveFarmPlanning(farmWithUser);
  };

  const handleSelectParcel = (parcelId: string) => {
    const found = parcels.find(p => p.id === parcelId);
    if (found) {
      setActiveParcelId(parcelId);
      setCurrentFarm(found);
      setActivePresetId(null);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fieldguard_active_parcel_id', parcelId);
      }
      runLiveFarmPlanning(found);
    }
  };

  const handleAddNewParcel = () => {
    setEditingParcel(null);
    setIsParcelWizardOpen(true);
  };

  const handleEditParcel = (parcel: FarmProfile) => {
    setEditingParcel(parcel);
    setIsParcelWizardOpen(true);
  };

  const handleDeleteParcel = (parcelId: string) => {
    const remaining = parcels.filter(p => p.id !== parcelId);
    setParcels(remaining);

    if (typeof window !== 'undefined') {
      localStorage.setItem('fieldguard_user_parcels', JSON.stringify(remaining));
    }

    deleteFarmFromDynamo(parcelId).catch((err) => {
      console.warn('Failed to delete farm from DynamoDB:', err);
    });

    if (activeParcelId === parcelId) {
      if (remaining.length > 0) {
        const next = remaining[0];
        setActiveParcelId(next.id);
        setCurrentFarm(next);
        if (typeof window !== 'undefined') {
          localStorage.setItem('fieldguard_active_parcel_id', next.id);
        }
        runLiveFarmPlanning(next);
      } else {
        setActiveParcelId(null);
        setCurrentFarm(null);
        setHasCustomFarm(false);
        setDecision(null);
      }
    }
  };

  // Developer Sandbox: Load a benchmark scenario
  const handleSelectDemoPreset = (presetId: string) => {
    setActivePresetId(presetId);
    setActiveView('dashboard');
    const preset = DEMO_PRESETS[presetId];
    if (preset) {
      setCurrentFarm(preset.farm);
      setCurrentForecast(preset.forecast);
      setInteractiveTankLiters(preset.farm.reserve.currentAvailable_liters);
      setInteractiveRainMm(preset.forecast.rainfall_mm);
      setWeatherErrorMessage(undefined);

      const res = executePreset(presetId);
      setDecision(res);
      setStorageStatus('aws_dynamodb');
    }
  };

  // Developer Sandbox: Exit demo and restore the user's real saved farm
  const handleExitDemo = () => {
    setActivePresetId(null);
    if (typeof window !== 'undefined') {
      const savedFarmJson = localStorage.getItem('fieldguard_saved_farm');
      if (savedFarmJson) {
        try {
          const parsed = JSON.parse(savedFarmJson) as FarmProfile;
          if (parsed && parsed.id && !parsed.id.startsWith('farm-bardhaman') && parsed.userId !== 'farmer-ramesh') {
            setCurrentFarm(parsed);
            setHasCustomFarm(true);
            runLiveFarmPlanning(parsed);
            return;
          }
        } catch (e) {}
      }
    }
    // Return cleanly to empty dashboard if no custom farm configured
    setCurrentFarm(null);
    setCurrentForecast(null);
    setHasCustomFarm(false);
    setDecision(null);
  };

  // Reset active farm profile to return to clean empty dashboard
  const handleResetFarm = () => {
    setCurrentFarm(null);
    setCurrentForecast(null);
    setHasCustomFarm(false);
    setActivePresetId(null);
    setDecision(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fieldguard_saved_farm');
    }
  };



  // Weather Refresh button handler
  const handleRefreshWeather = () => {
    if (currentFarm) {
      runLiveFarmPlanning(currentFarm);
    }
  };

  // Interactive levers handler (only used during what-if tests)
  const handleTankSliderChange = (newVal: number) => {
    setInteractiveTankLiters(newVal);
    if (!currentFarm || !currentForecast) return;

    const updatedFarm: FarmProfile = {
      ...currentFarm,
      reserve: {
        ...currentFarm.reserve,
        currentAvailable_liters: newVal,
      },
    };
    setCurrentFarm(updatedFarm);

    const res = runFeasibilityPlanner({
      plots: updatedFarm.plots,
      awc_mm_per_m: updatedFarm.soil.awc_mm_per_m,
      reserve: updatedFarm.reserve,
      forecast: {
        ...currentForecast,
        rainfall_mm: interactiveRainMm,
      },
      isDemoPreset: activePresetId !== null,
    });

    setDecision(res);
  };

  const handleRainSliderChange = (newRain: number) => {
    setInteractiveRainMm(newRain);
    if (!currentFarm || !currentForecast) return;

    const updatedForecast = {
      ...currentForecast,
      rainfall_mm: newRain,
      precipitation_probability_pct: newRain > 0 ? 80 : 10,
    };
    setCurrentForecast(updatedForecast);

    const res = runFeasibilityPlanner({
      plots: currentFarm.plots,
      awc_mm_per_m: currentFarm.soil.awc_mm_per_m,
      reserve: {
        ...currentFarm.reserve,
        currentAvailable_liters: interactiveTankLiters,
      },
      forecast: updatedForecast,
      isDemoPreset: activePresetId !== null,
    });

    setDecision(res);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-main)] selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      
      {/* 1. Clean Enterprise Header */}
      <Header
        authSession={authSession}
        onLogout={handleLogout}
        activeView={activeView}
        onViewChange={handleViewChange}
        onOpenSideDrawer={() => setIsSideDrawerOpen(true)}
        parcelsCount={parcels.length}
      />

      {/* 2. Top Banner if currently testing a demo preset */}
      {activePresetId && (
        <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 truncate">
            <span className="px-1.5 py-0.5 rounded bg-black/20 text-white font-mono text-[10px] uppercase">
              Demo Active
            </span>
            <span className="text-white">
              Currently simulating: <strong>{activePresetId === 'preset_rain_avoidance' ? 'Scenario A (Rain Avoidance)' : 'Scenario B (Tank Deficit)'}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleExitDemo}
            className="px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 ml-2"
          >
            Exit Demo & Return to My Field
          </button>
        </div>
      )}

      {/* 3. Main View: Landing Page OR Field Advisor Dashboard */}
      {activeView === 'landing' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8">
          <LandingPage
            onOpenOnboarding={() => {
              if (authSession) {
                setIsParcelWizardOpen(true);
              } else {
                router.push('/register');
              }
            }}
            onExploreDashboard={() => {
              if (authSession) {
                setActiveView('dashboard');
              } else {
                router.push('/login');
              }
            }}
            hasCustomFarm={hasCustomFarm}
            authSession={authSession}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          
          {/* Loading Spinner while fetching live weather & planning */}
          {isRefreshingWeather && !decision && (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-emerald-500">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Retrieving live climate & soil-water balance...
              </span>
            </div>
          )}

          {/* EMPTY STATE DASHBOARD: Displayed when no custom parcel is configured */}
          {!currentFarm && !activePresetId && !isRefreshingWeather && (
            <div className="max-w-3xl mx-auto py-8 sm:py-16 px-2 sm:px-4">
              <div className="p-6 sm:p-10 border border-[#E1E8DE] dark:border-[#1F2D24] bg-white dark:bg-[#141D17] shadow-xl rounded-3xl text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#16A34A]/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#16A34A]/10 border border-[#16A34A]/25 flex items-center justify-center text-[#16A34A] dark:text-[#22C55E] shadow-sm">
                  <Sprout className="w-8 h-8" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-[#121C15] dark:text-[#F0F4F1] font-['Outfit'] mb-2.5">
                  No Farm Parcel Configured
                </h2>
                <p className="text-sm sm:text-base text-[#4D6653] dark:text-[#8FA894] max-w-lg mx-auto mb-8">
                  Your dashboard is currently empty. Configure your parcel to receive live Open-Meteo weather and precision irrigation decisions tailored to your exact soil texture and crop stage.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8 text-left">
                  <div className="p-4 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#0284C7] dark:text-[#38BDF8] text-xs font-bold mb-1">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>1. Geo-Location</span>
                      </div>
                      <p className="text-[11px] text-[#4D6653] dark:text-[#8FA894]">
                        GPS or village pin code lookup for live meteorological forecasts.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#16A34A] dark:text-[#22C55E] text-xs font-bold mb-1">
                        <Layers className="w-4 h-4 shrink-0" />
                        <span>2. Soil & Crop</span>
                      </div>
                      <p className="text-[11px] text-[#4D6653] dark:text-[#8FA894]">
                        Soil texture AWC capacity and crop root zone depletion dynamics.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#D97706] dark:text-[#FBBF24] text-xs font-bold mb-1">
                        <Droplets className="w-4 h-4 shrink-0" />
                        <span>3. Water Reserve</span>
                      </div>
                      <p className="text-[11px] text-[#4D6653] dark:text-[#8FA894]">
                        Sump or tank capacity calculation to eliminate pump dry-run risk.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsParcelWizardOpen(true)}
                  className="px-6 py-3.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm shadow-md transition-all transform hover:scale-[1.02] cursor-pointer inline-flex items-center gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Configure My Field Parcel</span>
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE DASHBOARD: Displayed when a farm profile or demo scenario is active */}
          {currentFarm && currentForecast && decision && (
            <div className="space-y-5 sm:space-y-6">
              {/* Active Field Profile Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-xs text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center shrink-0">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#4D6653] dark:text-[#8FA894] font-medium">Active Field:</span>{' '}
                      <strong className="text-[#121C15] dark:text-[#F0F4F1] font-bold text-sm">{currentFarm.farmName}</strong>
                      <button
                        type="button"
                        onClick={() => setIsSideDrawerOpen(true)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] transition-colors cursor-pointer"
                        title="Switch between your managed fields"
                      >
                        <Layers className="w-3 h-3" />
                        <span>Switch ({parcels.length})</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#0284C7] dark:text-[#38BDF8] font-medium mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{currentFarm.location.displayName || currentFarm.location.villageOrPincode}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                  {/* Dedicated Water Supply Pill */}
                  <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 font-semibold flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                    <span>
                      {currentFarm.reserve.storageType === 'borewell_hours'
                        ? `${currentFarm.reserve.pumpPower_hp || 5} HP Tube-well`
                        : currentFarm.reserve.storageType === 'custom_sump'
                        ? 'Rain Pond'
                        : 'Sintex Tank'}
                    </span>
                  </span>

                  <span className="px-2.5 py-1 rounded-lg bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] text-[#4D6653] dark:text-[#8FA894]">
                    Soil: <strong className="text-[#16A34A] dark:text-[#22C55E] capitalize">{currentFarm.soil.texture}</strong>
                  </span>

                  {hasCustomFarm && (
                    <button
                      type="button"
                      onClick={() => handleEditParcel(currentFarm)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer text-[11px] font-semibold flex items-center gap-1"
                      title="Edit this field configuration"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Field</span>
                    </button>
                  )}
                </div>
              </div>

              {/* COCKPIT TIER 1: Primary Action & Live Climate (Desktop 7:5 Grid / Mobile Stack) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
                {/* Left 7 cols: Hero Decision Card + What-If simulation levers */}
                <div className="lg:col-span-7 flex flex-col space-y-4 sm:space-y-5">
                  <div className="flex-1">
                    <DecisionCard decision={decision} />
                  </div>

                  {/* What-If Simulation Levers (Only visible when demo mode is active via ENV and simulating) */}
                  {isDemoMode && isSimulating && (
                    <div className="p-4 sm:p-5 rounded-2xl border border-[#D97706]/35 bg-[#FEF3C7]/40 dark:bg-[#1F1708] fade-in shadow-xs">
                      <div className="flex items-center gap-2 mb-3">
                        <Sliders className="w-4 h-4 text-[#D97706]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#92400E] dark:text-[#FCD34D]">
                          What-If Scenario Levers (Instant Real-Time Decision Shifts)
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#4D6653] dark:text-[#8FA894]">Simulate Forecast Rain:</span>
                            <strong className="text-[#0284C7] dark:text-[#38BDF8] font-mono text-sm">{interactiveRainMm} mm</strong>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            step="1"
                            value={interactiveRainMm}
                            onChange={(e) => handleRainSliderChange(parseFloat(e.target.value))}
                            className="w-full accent-[#0284C7] cursor-pointer min-h-[36px]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#4D6653] dark:text-[#8FA894]">Simulate Tank Available Reserve:</span>
                            <strong className="text-[#D97706] dark:text-[#FBBF24] font-mono text-sm">{interactiveTankLiters.toLocaleString()} L</strong>
                          </div>
                          <input
                            type="range"
                            min="200"
                            max="5000"
                            step="200"
                            value={interactiveTankLiters}
                            onChange={(e) => handleTankSliderChange(parseInt(e.target.value))}
                            className="w-full accent-[#D97706] cursor-pointer min-h-[36px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right 5 cols: Live Climate Station */}
                <div className="lg:col-span-5 flex flex-col">
                  <LiveClimateStation
                    forecast={currentForecast}
                    locationName={currentFarm.location.displayName || currentFarm.location.villageOrPincode}
                    latitude={currentFarm.location.latitude}
                    longitude={currentFarm.location.longitude}
                    isSimulating={isSimulating}
                    onToggleSimulation={setIsSimulating}
                    onRefreshWeather={handleRefreshWeather}
                    isRefreshing={isRefreshingWeather}
                    errorMessage={weatherErrorMessage}
                    showDevLevers={isDemoMode}
                  />
                </div>
              </div>

              {/* COCKPIT TIER 2: Water Budget Matrix & Environmental Ledger (Desktop 7:5 Grid / Mobile Stack) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
                {/* Left 7 cols: Multi-Crop Water Budget & Plot Stress Matrix */}
                <div className="lg:col-span-7 flex flex-col">
                  <WaterBudgetCard
                    totalDemand_liters={decision.totalFarmDemand_liters}
                    netDemand_liters={decision.netFarmDemand_liters}
                    availableReserve_liters={decision.availableWater_liters}
                    waterShortfall_liters={decision.waterShortfall_liters}
                    plots={decision.plots}
                  />
                </div>

                {/* Right 5 cols: Environmental Impact Ledger */}
                <div className="lg:col-span-5 flex flex-col">
                  <EnvironmentalLedgerCard ledger={decision.environmentalLedger} />
                </div>
              </div>

              {/* AWS Architecture Demonstration Drawer (Only visible in Demo/Proto mode for video rubric proof) */}
              {isDemoMode && (
                <AwsProofDrawer decision={decision} storageStatus={storageStatus} />
              )}
            </div>
          )}

        </main>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-[#E1E8DE] dark:border-[#1F2D24] bg-white/70 dark:bg-[#0D1310]/70 py-5 text-center text-xs text-[#4D6653] dark:text-[#8FA894]">
        <p className="px-4">
          FieldGuard — Autonomous Agronomic Decision Cockpit & Field Telemetry • Built with Next.js & AWS Serverless
        </p>
      </footer>

      {/* 9. Enterprise Multi-Parcel Command Center Drawer */}
      <EnterpriseSideDrawer
        isOpen={isSideDrawerOpen}
        onClose={() => setIsSideDrawerOpen(false)}
        parcels={parcels}
        activeParcelId={activeParcelId}
        onSelectParcel={handleSelectParcel}
        onAddNewParcel={handleAddNewParcel}
        onEditParcel={handleEditParcel}
        onDeleteParcel={handleDeleteParcel}
        authSession={authSession}
      />

      {/* 10. Farm Parcel Configuration Wizard */}
      <StepperWizard
        isOpen={isParcelWizardOpen}
        onClose={() => {
          setIsParcelWizardOpen(false);
          setEditingParcel(null);
        }}
        onSubmit={handleCustomFarmSubmit}
        initialFarm={editingParcel}
      />

      {/* 12. Isolated Developer Demo Sandbox Dock (Strictly controlled by NEXT_PUBLIC_ENABLE_DEMO_SANDBOX env var) */}
      {isDemoMode && (
        <DemoSandboxDock
          activePresetId={activePresetId}
          onSelectPreset={handleSelectDemoPreset}
          onExitDemo={handleExitDemo}
          hasCustomFarm={hasCustomFarm}
          isSimulating={isSimulating}
          onToggleSimulation={setIsSimulating}
        />
      )}

    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <FieldGuardApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}
