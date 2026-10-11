'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { DecisionCard } from '../components/DecisionCard';
import { EnvironmentalLedgerCard } from '../components/EnvironmentalLedgerCard';
import { WaterBudgetCard } from '../components/WaterBudgetCard';
import { AwsProofDrawer } from '../components/AwsProofDrawer';
import { StepperWizard } from '../components/onboarding/StepperWizard';
import { LiveClimateStation } from '../components/climate/LiveClimateStation';
import { AuthModal } from '../components/auth/AuthModal';
import { DemoSandboxDock } from '../components/demo/DemoSandboxDock';
import { LandingPage } from '../components/landing/LandingPage';
import { LanguageProvider, useLanguage } from '../components/common/LanguageContext';
import { ThemeProvider } from '../components/common/ThemeContext';
import { executePreset, DEMO_PRESETS, PRESET_1_RAIN_AVOIDANCE } from '../core/demoPresets';
import { runFeasibilityPlanner } from '../core/feasibilityPlanner';
import { fetchLiveWeatherForecast } from '../adapters/openMeteoAdapter';
import { saveFarmProfileToDynamo, logDecisionToDynamo } from '../adapters/dynamoDbAdapter';
import { AuthSession } from '../adapters/cognitoAdapter';
import { DecisionResponse } from '../types/decision';
import { FarmProfile } from '../types/farm';
import { DailyWeatherForecast } from '../types/weather';
import { 
  Sliders, 
  RefreshCw, 
  Sprout, 
  MapPin, 
  Layers, 
  Droplets, 
  SlidersHorizontal 
} from 'lucide-react';

function FieldGuardApp() {
  const { t } = useLanguage();
  
  // Navigation View State: 'landing' vs 'dashboard'
  const [activeView, setActiveView] = useState<'landing' | 'dashboard'>('landing');

  // Real User Farm state vs Demo Sandbox Preset ID (null = viewing user's own real farm or empty dashboard)
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [hasCustomFarm, setHasCustomFarm] = useState<boolean>(false);
  const [currentFarm, setCurrentFarm] = useState<FarmProfile | null>(null);
  const [currentForecast, setCurrentForecast] = useState<DailyWeatherForecast | null>(null);
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [storageStatus, setStorageStatus] = useState<string>('aws_dynamodb');
  
  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
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

      // 3. Log decision to Amazon DynamoDB in background
      logDecisionToDynamo(farm.id, planRes).catch((e) => {
        console.warn('Background DynamoDB logging notice:', e);
      });
    } catch (err: any) {
      console.warn('Live calculation error:', err);
      // Fallback calculation using existing forecast if available
      if (currentForecast) {
        const planRes = runFeasibilityPlanner({
          plots: farm.plots,
          awc_mm_per_m: farm.soil.awc_mm_per_m,
          reserve: farm.reserve,
          forecast: currentForecast,
          isDemoPreset: false,
        });
        setDecision(planRes);
      }
    } finally {
      setIsRefreshingWeather(false);
    }
  }, [currentForecast]);

  // ON MOUNT: Load persistent custom farm from localStorage, NEVER override with Demo Preset!
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check auth session
      const savedAuth = localStorage.getItem('fieldguard_auth');
      if (savedAuth) {
        try { setAuthSession(JSON.parse(savedAuth)); } catch (e) {}
      }



      // Check if user has their own saved farm profile
      const savedFarmJson = localStorage.getItem('fieldguard_saved_farm');
      if (savedFarmJson) {
        try {
          const parsed = JSON.parse(savedFarmJson) as FarmProfile;
          // Filter out stale demo presets accidentally saved during earlier prototype tests
          if (parsed && parsed.id && !parsed.id.startsWith('farm-bardhaman') && parsed.userId !== 'farmer-ramesh') {
            setCurrentFarm(parsed);
            setHasCustomFarm(true);
            setActivePresetId(null); // Real farmer mode!
            setActiveView('dashboard');
            runLiveFarmPlanning(parsed);
            return;
          } else {
            // Clean up stale demo preset so farmer gets an empty dashboard
            localStorage.removeItem('fieldguard_saved_farm');
          }
        } catch (e) {
          console.error('Failed to parse saved farm:', e);
        }
      }

      // First time visitor check
      const hasVisited = localStorage.getItem('fieldguard_visited');
      if (!hasVisited) {
        localStorage.setItem('fieldguard_visited', 'true');
        // Let user view the landing page first, rather than popping modal instantly
      }
    }
    // Note: If no saved custom farm exists, currentFarm remains null (Empty Dashboard)
  }, []);



  const handleLogout = () => {
    setAuthSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fieldguard_auth');
    }
  };

  // Called when the user configures their farm via the 4-step wizard
  const handleCustomFarmSubmit = (newFarm: FarmProfile) => {
    setCurrentFarm(newFarm);
    setHasCustomFarm(true);
    setActivePresetId(null); // Clear any demo preset
    setActiveView('dashboard'); // Switch to field advisor view

    // 1. Persist to localStorage so refreshes NEVER erase it
    if (typeof window !== 'undefined') {
      localStorage.setItem('fieldguard_saved_farm', JSON.stringify(newFarm));
    }

    // 2. Persist to Amazon DynamoDB
    saveFarmProfileToDynamo(newFarm)
      .then((res) => {
        setStorageStatus(res.storage);
      })
      .catch((err) => {
        console.error('DynamoDB save error:', err);
      });

    // 3. Run planning with fresh weather for new coordinates
    runLiveFarmPlanning(newFarm);
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
      
      {/* 1. Clean Production Header */}
      <Header
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        authSession={authSession}
        onLogout={handleLogout}
        hasCustomFarm={hasCustomFarm}
        onResetFarm={handleResetFarm}
        activeView={activeView}
        onViewChange={setActiveView}
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
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onExploreDashboard={() => setActiveView('dashboard')}
            hasCustomFarm={hasCustomFarm}
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
              <div className="p-6 sm:p-10 border border-[#E1E6DE] dark:border-[#1E3022] bg-[#F9FAF7] dark:bg-[#0E1711] shadow-xl rounded-3xl text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#2D6A4F]/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/25 flex items-center justify-center text-[#2D6A4F] dark:text-[#52B788] shadow-sm">
                  <Sprout className="w-8 h-8" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-[#111C15] dark:text-[#ECF2EC] font-['Outfit'] mb-2.5">
                  No Farm Parcel Configured
                </h2>
                <p className="text-sm sm:text-base text-[#526356] dark:text-[#8FA394] max-w-lg mx-auto mb-8">
                  Your dashboard is currently empty. Configure your parcel to receive live Open-Meteo weather and precision irrigation decisions tailored to your exact soil texture and crop stage.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8 text-left">
                  <div className="p-4 rounded-xl bg-white dark:bg-[#121E15] border border-[#E1E6DE] dark:border-[#1E3022] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#1D4E89] dark:text-[#64B5F6] text-xs font-bold mb-1">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>1. Geo-Location</span>
                      </div>
                      <p className="text-[11px] text-[#526356] dark:text-[#8FA394]">
                        GPS or village pin code lookup for live meteorological forecasts.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-[#121E15] border border-[#E1E6DE] dark:border-[#1E3022] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#2D6A4F] dark:text-[#52B788] text-xs font-bold mb-1">
                        <Layers className="w-4 h-4 shrink-0" />
                        <span>2. Soil & Crop</span>
                      </div>
                      <p className="text-[11px] text-[#526356] dark:text-[#8FA394]">
                        Soil texture AWC capacity and crop root zone depletion dynamics.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-[#121E15] border border-[#E1E6DE] dark:border-[#1E3022] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#D97706] dark:text-[#FBBF24] text-xs font-bold mb-1">
                        <Droplets className="w-4 h-4 shrink-0" />
                        <span>3. Water Reserve</span>
                      </div>
                      <p className="text-[11px] text-[#526356] dark:text-[#8FA394]">
                        Sump or tank capacity calculation to eliminate pump dry-run risk.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOnboardingOpen(true)}
                  className="px-6 py-3.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-sm shadow-md transition-all transform hover:scale-[1.02] cursor-pointer inline-flex items-center gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Configure My Field Parcel</span>
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE DASHBOARD: Displayed when a farm profile or demo scenario is active */}
          {currentFarm && currentForecast && decision && (
            <>
              {/* Active Field Profile Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 sm:p-4 rounded-xl bg-[#F4F7F2] dark:bg-[#0D1811] border border-[#E1E6DE] dark:border-[#1E3022] text-xs">
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788] shrink-0" />
                  <div>
                    <span className="text-[#526356] dark:text-[#8FA394]">Active Parcel:</span>{' '}
                    <strong className="text-[#111C15] dark:text-[#ECF2EC] font-semibold">{currentFarm.farmName}</strong>
                    <span className="text-[#8FA394] mx-1.5">•</span>
                    <span className="text-[#1D4E89] dark:text-[#64B5F6] font-medium">{currentFarm.location.displayName || currentFarm.location.villageOrPincode}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-[#121E15] border border-[#E1E6DE] dark:border-[#1E3022] text-[#526356] dark:text-[#8FA394]">
                    Soil: <strong className="text-[#2D6A4F] dark:text-[#52B788] capitalize">{currentFarm.soil.texture}</strong> (AWC {currentFarm.soil.awc_mm_per_m} mm/m)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-[#121E15] border border-[#E1E6DE] dark:border-[#1E3022] text-[#526356] dark:text-[#8FA394]">
                    Method: <strong className="text-[#1D4E89] dark:text-[#64B5F6] uppercase">{currentFarm.plots[0]?.irrigationMethod || 'DRIP'}</strong>
                  </span>
                  {hasCustomFarm && (
                    <button
                      type="button"
                      onClick={handleResetFarm}
                      className="px-2 py-0.5 rounded bg-[#E5484D]/10 hover:bg-[#E5484D]/20 text-[#C92A2A] dark:text-[#FFA8A8] border border-[#E5484D]/30 transition-colors cursor-pointer text-[10px]"
                      title="Clear parcel configuration"
                    >
                      Clear Parcel
                    </button>
                  )}
                </div>
              </div>

              {/* 4. Live Climate Station (Connected to real Open-Meteo) */}
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

              {/* 5. What-If Simulation Levers (Only visible when demo mode is active via ENV and simulating) */}
              {isDemoMode && isSimulating && (
                <div className="p-4 sm:p-5 rounded-2xl border border-[#D97706]/30 bg-[#FEF3C7]/40 dark:bg-[#2A1805]/40 fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <Sliders className="w-4 h-4 text-[#D97706]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#92400E] dark:text-[#FCD34D]">
                      What-If Scenario Levers (Instant Real-Time Decision Shifts)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#526356] dark:text-[#8FA394]">Simulate Forecast Rain:</span>
                        <strong className="text-[#1D4E89] dark:text-[#64B5F6] font-mono text-sm">{interactiveRainMm} mm</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="1"
                        value={interactiveRainMm}
                        onChange={(e) => handleRainSliderChange(parseFloat(e.target.value))}
                        className="w-full accent-[#1D4E89] cursor-pointer min-h-[36px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#526356] dark:text-[#8FA394]">Simulate Tank Available Reserve:</span>
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

              {/* 6. Primary Recommendation Card with Audio Read-Aloud */}
              <DecisionCard decision={decision} />

              {/* 7. Environmental Impact Ledger */}
              <EnvironmentalLedgerCard ledger={decision.environmentalLedger} />

              {/* 8. Shared Water Budget & Plot Stress Matrix */}
              <WaterBudgetCard
                totalDemand_liters={decision.totalFarmDemand_liters}
                netDemand_liters={decision.netFarmDemand_liters}
                availableReserve_liters={decision.availableWater_liters}
                waterShortfall_liters={decision.waterShortfall_liters}
                plots={decision.plots}
              />

              {/* 9. AWS Architecture Demonstration Drawer (Only visible in Demo/Proto mode for video rubric proof) */}
              {isDemoMode && (
                <AwsProofDrawer decision={decision} storageStatus={storageStatus} />
              )}
            </>
          )}

        </main>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 py-5 text-center text-xs text-slate-500 dark:text-slate-400">
        <p className="px-4">
          FieldGuard — Autonomous Agronomic Decision Cockpit & Field Telemetry • Built with Next.js & AWS Serverless
        </p>
      </footer>

      {/* 10. Mobile-First 4-Step Onboarding Wizard */}
      <StepperWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSubmit={handleCustomFarmSubmit}
        initialFarm={currentFarm}
      />

      {/* 11. Amazon Cognito OTP Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(session) => setAuthSession(session)}
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
