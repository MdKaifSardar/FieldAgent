'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../components/Header';
import { DemoSandboxDock } from '../components/demo/DemoSandboxDock';
import { LandingPage } from '../components/landing/LandingPage';
import { LanguageProvider } from '../components/common/LanguageContext';
import { ThemeProvider } from '../components/common/ThemeContext';
import { executePreset, DEMO_PRESETS } from '../core/demoPresets';
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
import { ConsoleLayout } from '../components/layout/ConsoleLayout';
import { ProfileOverviewView } from '../components/dashboard/ProfileOverviewView';
import { FieldsDirectoryView } from '../components/dashboard/FieldsDirectoryView';
import { FieldAdvisoryView } from '../components/dashboard/FieldAdvisoryView';
import { RegisterFieldWorkspaceView } from '../components/dashboard/RegisterFieldWorkspaceView';
import { EditFieldWorkspaceView } from '../components/dashboard/EditFieldWorkspaceView';
import { X } from 'lucide-react';

function FieldGuardApp() {
  const router = useRouter();
  
  // High-level navigation: 'landing' (unauth / marketing) vs 'dashboard' (authenticated enterprise console)
  const [activeView, setActiveView] = useState<'landing' | 'dashboard'>('landing');

  // Enterprise Console Subview: 'profile' | 'fields' | 'advisory' | 'register-field' | 'edit-field'
  const [dashboardView, setDashboardView] = useState<'profile' | 'fields' | 'advisory' | 'register-field' | 'edit-field'>('profile');

  // Multi-Parcel Portfolio State
  const [parcels, setParcels] = useState<FarmProfile[]>([]);
  const [activeParcelId, setActiveParcelId] = useState<string | null>(null);
  const [editingParcel, setEditingParcel] = useState<FarmProfile | null>(null);

  // Real User Farm state vs Demo Sandbox Preset ID
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [hasCustomFarm, setHasCustomFarm] = useState<boolean>(false);
  const [currentFarm, setCurrentFarm] = useState<FarmProfile | null>(null);
  const [currentForecast, setCurrentForecast] = useState<DailyWeatherForecast | null>(null);
  const currentForecastRef = useRef<DailyWeatherForecast | null>(null);
  const lastLoggedDecisionKeyRef = useRef<string | null>(null);
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [storageStatus, setStorageStatus] = useState<string>('aws_dynamodb');
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  
  // Loading & Diagnostics
  const [isRefreshingWeather, setIsRefreshingWeather] = useState<boolean>(false);
  const [weatherErrorMessage, setWeatherErrorMessage] = useState<string | undefined>(undefined);

  // Simulation mode toggling (strictly for developer what-if levers)
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [interactiveTankLiters, setInteractiveTankLiters] = useState<number>(3200);
  const [interactiveRainMm, setInteractiveRainMm] = useState<number>(22.0);

  // Master Demo Mode Gate: Controlled by process.env.NEXT_PUBLIC_ENABLE_DEMO_SANDBOX
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

      // 3. Log decision to Amazon DynamoDB in background (deduplicated)
      const logKey = `${farm.id}:${planRes.decision}:${Math.round(planRes.totalFarmDemand_liters)}`;
      if (lastLoggedDecisionKeyRef.current !== logKey) {
        lastLoggedDecisionKeyRef.current = logKey;
        logDecisionToDynamo(farm.id, planRes).catch((e) => {
          console.warn('Background DynamoDB logging notice:', e);
        });
      }
    } catch (e: any) {
      console.error('Failed to run live farm planning:', e);
      setWeatherErrorMessage('Weather forecast unavailable. Using cached meteorological baselines.');
    } finally {
      setIsRefreshingWeather(false);
    }
  }, []);

  // Check authentication & multi-parcel portfolio on mount
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
            // By default, authenticated user lands on Profile Overview!
            setDashboardView('profile');

            // Set active parcel from saved active ID or first parcel
            const savedActiveId = localStorage.getItem('fieldguard_active_parcel_id');
            const targetParcel = loadedParcels.find(p => p.id === savedActiveId) || loadedParcels[0];
            setActiveParcelId(targetParcel.id);
            setCurrentFarm(targetParcel);
            runLiveFarmPlanning(targetParcel);
          } else {
            setActiveView('dashboard');
            setDashboardView('profile');
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
    if (view === 'dashboard') {
      setDashboardView('profile');
    }
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
    // Open the Advisory for the newly created or edited field
    setDashboardView('advisory');
    setEditingParcel(null);

    // 1. Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('fieldguard_user_parcels', JSON.stringify(updatedParcels));
      localStorage.setItem('fieldguard_active_parcel_id', farmWithUser.id);
      localStorage.setItem('fieldguard_saved_farm', JSON.stringify(farmWithUser));
    }

    // 2. Persist to Amazon DynamoDB under authenticated userId
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
    setDashboardView('register-field');
  };

  const handleEditParcel = (parcel: FarmProfile) => {
    setEditingParcel(parcel);
    setDashboardView('edit-field');
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
    setDashboardView('advisory');
    const preset = DEMO_PRESETS[presetId];
    if (preset) {
      setCurrentFarm(preset.farm);
      setCurrentForecast(preset.forecast);
      setInteractiveRainMm(preset.forecast.rainfall_mm);
      setInteractiveTankLiters(preset.farm.reserve.currentAvailable_liters);
      const res = executePreset(presetId);
      setDecision(res);
      setStorageStatus('aws_dynamodb');
    }
  };

  const handleExitDemo = () => {
    setActivePresetId(null);
    if (hasCustomFarm && parcels.length > 0) {
      const active = parcels.find(p => p.id === activeParcelId) || parcels[0];
      setCurrentFarm(active);
      runLiveFarmPlanning(active);
    } else {
      setCurrentFarm(null);
      setCurrentForecast(null);
      setDecision(null);
    }
  };

  const handleRefreshWeather = () => {
    if (currentFarm) {
      runLiveFarmPlanning(currentFarm);
    }
  };

  const handleTankSliderChange = (newTank: number) => {
    setInteractiveTankLiters(newTank);
    if (!currentFarm || !currentForecast) return;

    const res = runFeasibilityPlanner({
      plots: currentFarm.plots,
      awc_mm_per_m: currentFarm.soil.awc_mm_per_m,
      reserve: {
        ...currentFarm.reserve,
        currentAvailable_liters: newTank,
      },
      forecast: currentForecast,
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

  // 1. PUBLIC MARKETING LANDING PAGE VIEW
  if (activeView === 'landing') {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-main)] selection:bg-emerald-500 selection:text-white transition-colors duration-200">
        <Header
          authSession={authSession}
          onLogout={handleLogout}
          activeView={activeView}
          onViewChange={handleViewChange}
          onOpenSideDrawer={() => {}}
          parcelsCount={parcels.length}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8">
          <LandingPage
            onOpenOnboarding={() => {
              if (authSession) {
                setActiveView('dashboard');
                setDashboardView('register-field');
              } else {
                router.push('/register');
              }
            }}
            onExploreDashboard={() => {
              if (authSession) {
                setActiveView('dashboard');
                setDashboardView('profile');
              } else {
                router.push('/login');
              }
            }}
            hasCustomFarm={hasCustomFarm}
            authSession={authSession}
          />
        </main>

        <footer className="w-full border-t border-[#E1E8DE] dark:border-[#1F2D24] bg-white/70 dark:bg-[#0D1310]/70 py-5 text-center text-xs text-[#4D6653] dark:text-[#8FA894]">
          <p className="px-4">
            FieldGuard — Autonomous Agronomic Decision Cockpit & Field Telemetry • Built with Next.js & AWS Serverless
          </p>
        </footer>
      </div>
    );
  }

  // 2. AUTHENTICATED ENTERPRISE CONSOLE VIEW
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-main)] transition-colors duration-200">
      <ConsoleLayout
        currentView={dashboardView}
        onNavigate={setDashboardView}
        parcels={parcels}
        activeParcel={currentFarm}
        onSelectParcel={handleSelectParcel}
        onOpenNewParcelWizard={handleAddNewParcel}
        authSession={authSession}
        onSignOut={handleLogout}
      >
        {/* Top Demo Banner (Only visible if running benchmark scenario) */}
        {activePresetId && (
          <div className="mb-4 w-full rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 truncate">
              <span className="px-2 py-0.5 rounded-md bg-black/25 text-white font-mono text-[10px] uppercase">
                Demo Benchmark Active
              </span>
              <span>
                Simulating: {activePresetId === 'preset_rain_avoidance' ? 'Scenario A (Rain Avoidance)' : 'Scenario B (Tank Deficit)'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleExitDemo}
              className="px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 ml-2"
            >
              Exit Demo
            </button>
          </div>
        )}

        {/* WORKSPACE VIEW 1: Profile & Account Overview (DEFAULT LANDING) */}
        {dashboardView === 'profile' && (
          <ProfileOverviewView
            authSession={authSession}
            parcels={parcels}
            activeParcel={currentFarm}
            onSelectParcel={(id) => {
              handleSelectParcel(id);
              setDashboardView('advisory');
            }}
            onNavigateToFields={() => setDashboardView('fields')}
            onNavigateToAdvisory={() => setDashboardView('advisory')}
            onOpenNewParcelWizard={handleAddNewParcel}
          />
        )}

        {/* WORKSPACE VIEW 2: My Fields Directory */}
        {dashboardView === 'fields' && (
          <FieldsDirectoryView
            parcels={parcels}
            activeParcelId={activeParcelId}
            onSelectParcel={handleSelectParcel}
            onNavigateToAdvisory={() => setDashboardView('advisory')}
            onOpenNewParcelWizard={handleAddNewParcel}
            onEditParcel={handleEditParcel}
            onDeleteParcel={handleDeleteParcel}
          />
        )}

        {/* WORKSPACE VIEW 3: Field Decision Advisory */}
        {dashboardView === 'advisory' && (
          <FieldAdvisoryView
            currentFarm={currentFarm}
            currentForecast={currentForecast}
            decision={decision}
            parcels={parcels}
            onSelectParcel={handleSelectParcel}
            onEditParcel={handleEditParcel}
            onOpenNewParcelWizard={handleAddNewParcel}
            isRefreshingWeather={isRefreshingWeather}
            weatherErrorMessage={weatherErrorMessage}
            onRefreshWeather={handleRefreshWeather}
            isDemoMode={isDemoMode}
            isSimulating={isSimulating}
            onToggleSimulation={setIsSimulating}
            interactiveRainMm={interactiveRainMm}
            onRainSliderChange={handleRainSliderChange}
            interactiveTankLiters={interactiveTankLiters}
            onTankSliderChange={handleTankSliderChange}
          />
        )}

        {/* WORKSPACE VIEW 4: Register Field Workspace (Full Canvas) */}
        {dashboardView === 'register-field' && (
          <RegisterFieldWorkspaceView
            onCancel={() => setDashboardView(parcels.length > 0 ? 'fields' : 'profile')}
            onSubmit={handleCustomFarmSubmit}
          />
        )}

        {/* WORKSPACE VIEW 5: Edit Field Settings Workspace (Direct Tabbed Access) */}
        {dashboardView === 'edit-field' && (
          editingParcel ? (
            <EditFieldWorkspaceView
              initialFarm={editingParcel}
              onCancel={() => setDashboardView('advisory')}
              onSubmit={handleCustomFarmSubmit}
              onDeleteParcel={(id) => {
                handleDeleteParcel(id);
                setDashboardView('fields');
              }}
            />
          ) : (
            <RegisterFieldWorkspaceView
              onCancel={() => setDashboardView(parcels.length > 0 ? 'fields' : 'profile')}
              onSubmit={handleCustomFarmSubmit}
            />
          )
        )}
      </ConsoleLayout>

      {/* Developer Demo Sandbox Dock */}
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
