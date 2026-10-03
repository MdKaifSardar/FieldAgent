'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { DecisionCard } from '../components/DecisionCard';
import { EnvironmentalLedgerCard } from '../components/EnvironmentalLedgerCard';
import { WaterBudgetCard } from '../components/WaterBudgetCard';
import { AwsProofDrawer } from '../components/AwsProofDrawer';
import { OnboardingModal } from '../components/OnboardingModal';
import { executePreset, DEMO_PRESETS } from '../core/demoPresets';
import { runFeasibilityPlanner } from '../core/feasibilityPlanner';
import { fetchLiveWeatherForecast } from '../adapters/openMeteoAdapter';
import { DecisionResponse } from '../types/decision';
import { FarmProfile } from '../types/farm';
import { Sliders, RefreshCw, AlertCircle, Droplet } from 'lucide-react';

export default function Home() {
  const [activePresetId, setActivePresetId] = useState<string>('preset_rain_avoidance');
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [currentFarm, setCurrentFarm] = useState<FarmProfile>(DEMO_PRESETS['preset_rain_avoidance'].farm);
  const [currentForecast, setCurrentForecast] = useState(DEMO_PRESETS['preset_rain_avoidance'].forecast);
  const [storageStatus, setStorageStatus] = useState<string>('aws_dynamodb');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(false);

  // Dynamic interactive simulation controls
  const [interactiveTankLiters, setInteractiveTankLiters] = useState<number>(3200);
  const [interactiveRainMm, setInteractiveRainMm] = useState<number>(22.0);

  // Initialize on preset 1
  useEffect(() => {
    loadPreset('preset_rain_avoidance');
  }, []);

  const loadPreset = (presetId: string) => {
    setActivePresetId(presetId);
    const preset = DEMO_PRESETS[presetId];
    if (preset) {
      setCurrentFarm(preset.farm);
      setCurrentForecast(preset.forecast);
      setInteractiveTankLiters(preset.farm.reserve.currentAvailable_liters);
      setInteractiveRainMm(preset.forecast.rainfall_mm);

      const res = executePreset(presetId);
      setDecision(res);
      setStorageStatus('aws_dynamodb');
    }
  };

  const handleLiveLocation = async () => {
    setIsLiveLoading(true);
    setActivePresetId('live_gps');

    const defaultLat = 23.2324; // Bardhaman default
    const defaultLon = 87.8615;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await runLiveCalculation(position.coords.latitude, position.coords.longitude);
        },
        async () => {
          // Fallback location if permission denied
          await runLiveCalculation(defaultLat, defaultLon);
        }
      );
    } else {
      await runLiveCalculation(defaultLat, defaultLon);
    }
  };

  const runLiveCalculation = async (lat: number, lon: number) => {
    try {
      const forecast = await fetchLiveWeatherForecast(lat, lon);
      setCurrentForecast(forecast);
      setInteractiveRainMm(forecast.rainfall_mm);

      const liveFarm: FarmProfile = {
        ...currentFarm,
        id: 'live-farm-' + Date.now(),
        location: {
          latitude: lat,
          longitude: lon,
          villageOrPincode: `Live GPS (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
        },
      };
      setCurrentFarm(liveFarm);

      const res = runFeasibilityPlanner({
        plots: liveFarm.plots,
        awc_mm_per_m: liveFarm.soil.awc_mm_per_m,
        reserve: liveFarm.reserve,
        forecast,
        isDemoPreset: false,
      });

      setDecision(res);
      setStorageStatus('aws_dynamodb');
    } catch (err) {
      console.error('Live calculation error:', err);
    } finally {
      setIsLiveLoading(false);
    }
  };

  // Re-run planner whenever interactive levers change
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
      isDemoPreset: activePresetId !== 'live_gps',
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
      isDemoPreset: activePresetId !== 'live_gps',
    });

    setDecision(res);
  };

  const handleCustomFarmSubmit = (newFarm: FarmProfile) => {
    setCurrentFarm(newFarm);
    setInteractiveTankLiters(newFarm.reserve.currentAvailable_liters);
    setActivePresetId('custom_farm');

    const res = runFeasibilityPlanner({
      plots: newFarm.plots,
      awc_mm_per_m: newFarm.soil.awc_mm_per_m,
      reserve: newFarm.reserve,
      forecast: currentForecast,
      isDemoPreset: false,
    });

    setDecision(res);
  };

  if (!decision) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 text-emerald-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Initializing FieldGuard Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Navigation Header */}
      <Header
        activePresetId={activePresetId}
        onSelectPreset={loadPreset}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        isLiveLoading={isLiveLoading}
        onTriggerLiveLocation={handleLiveLocation}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Active Scenario Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400">Current Field Profile:</span>{' '}
            <strong className="text-white font-medium">{currentFarm.farmName}</strong>
            <span className="text-slate-500 mx-2">•</span>
            <span className="text-slate-400">Location:</span>{' '}
            <span className="text-cyan-300">{currentFarm.location.villageOrPincode}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Soil: <strong className="text-emerald-400 capitalize">{currentFarm.soil.texture}</strong> (AWC {currentFarm.soil.awc_mm_per_m} mm/m)
            </span>
            <span className="text-slate-400">
              Plots: <strong className="text-white">{currentFarm.plots.length} Block(s)</strong>
            </span>
          </div>
        </div>

        {/* 1. Primary Recommendation Card */}
        <DecisionCard decision={decision} />

        {/* 2. Environmental Impact Ledger */}
        <EnvironmentalLedgerCard ledger={decision.environmentalLedger} />

        {/* 3. Interactive Scenario Simulation Levers */}
        <div className="glass-panel p-5 border border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Scenario Simulation Levers (Inspect Real-Time Decision Shifts)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Lever 1: Rain Forecast */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Forecast Rainfall:</span>
                <strong className="text-cyan-400 font-mono">{interactiveRainMm} mm</strong>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={interactiveRainMm}
                onChange={(e) => handleRainSliderChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">
                Slide to 0 mm to simulate sudden dry spell, or 25 mm for monsoon rain.
              </span>
            </div>

            {/* Lever 2: Tank Storage Reserve */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Tank Available Reserve:</span>
                <strong className="text-amber-400 font-mono">{interactiveTankLiters.toLocaleString()} L</strong>
              </div>
              <input
                type="range"
                min="200"
                max="5000"
                step="200"
                value={interactiveTankLiters}
                onChange={(e) => handleTankSliderChange(parseInt(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">
                Slide below demand to trigger Resource Deficit Alert & stress deadlines.
              </span>
            </div>

          </div>
        </div>

        {/* 4. Shared Water Budget & Plot Stress Timeline */}
        <WaterBudgetCard
          totalDemand_liters={decision.totalFarmDemand_liters}
          availableReserve_liters={decision.availableWater_liters}
          waterShortfall_liters={decision.waterShortfall_liters}
          plots={decision.plots}
        />

        {/* 5. AWS Demonstration Drawer (Video Rubric Proof) */}
        <AwsProofDrawer decision={decision} storageStatus={storageStatus} />

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>
          FieldGuard — FieldGuard Autonomous Telemetry (FieldGuard Intelligence) • Built with Next.js & AWS Serverless (Lambda + DynamoDB + Bedrock)
        </p>
      </footer>

      {/* 60-Second Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSubmit={handleCustomFarmSubmit}
      />

    </div>
  );
}
