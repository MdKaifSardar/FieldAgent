'use client';

import React from 'react';
import { useLanguage } from '../common/LanguageContext';
import { FarmProfile } from '../../types/farm';
import { DailyWeatherForecast } from '../../types/weather';
import { DecisionResponse } from '../../types/decision';
import { DecisionCard } from '../DecisionCard';
import { LiveClimateStation } from '../climate/LiveClimateStation';
import { WaterBudgetCard } from '../WaterBudgetCard';
import { EnvironmentalLedgerCard } from '../EnvironmentalLedgerCard';
import { CockpitSkeleton } from '../skeletons/CockpitSkeleton';
import { 
  Sprout, 
  MapPin, 
  Droplets, 
  Edit3, 
  Sliders, 
  Layers, 
  RefreshCw,
  Plus
} from 'lucide-react';

interface FieldCockpitViewProps {
  currentFarm: FarmProfile | null;
  currentForecast: DailyWeatherForecast | null;
  decision: DecisionResponse | null;
  parcels: FarmProfile[];
  onSelectParcel: (parcelId: string) => void;
  onEditParcel: (farm: FarmProfile) => void;
  onOpenNewParcelWizard: () => void;
  isRefreshingWeather: boolean;
  weatherErrorMessage?: string;
  onRefreshWeather: () => void;
  // Simulation levers
  isDemoMode: boolean;
  isSimulating: boolean;
  onToggleSimulation: (val: boolean) => void;
  interactiveRainMm: number;
  onRainSliderChange: (val: number) => void;
  interactiveTankLiters: number;
  onTankSliderChange: (val: number) => void;
}

export function FieldCockpitView({
  currentFarm,
  currentForecast,
  decision,
  parcels,
  onSelectParcel,
  onEditParcel,
  onOpenNewParcelWizard,
  isRefreshingWeather,
  weatherErrorMessage,
  onRefreshWeather,
  isDemoMode,
  isSimulating,
  onToggleSimulation,
  interactiveRainMm,
  onRainSliderChange,
  interactiveTankLiters,
  onTankSliderChange,
}: FieldCockpitViewProps) {
  const { language } = useLanguage();

  // 1. Shimmer loading state
  if (isRefreshingWeather && !decision) {
    return <CockpitSkeleton />;
  }

  // 2. Empty state: No farm configured
  if (!currentFarm) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] rounded-3xl shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <Sprout className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-['Outfit']">
          {language === 'hi' ? 'कोई सक्रिय खेत चयनित नहीं है' : 'No Active Field Selected'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
          {parcels.length > 0 
            ? 'Please choose a field from your directory to open its micro-climate decision cockpit.'
            : 'Configure your first field parcel with geo-coordinates, soil texture, and water source to activate precision irrigation.'}
        </p>

        {parcels.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {parcels.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectParcel(p.id)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
              >
                Open {p.farmName}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenNewParcelWizard}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Configure First Field</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Active Field Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-xs text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Field Cockpit:</span>
              <strong className="text-slate-900 dark:text-white font-bold text-sm">
                {currentFarm.farmName}
              </strong>
              {parcels.length > 1 && (
                <div className="relative inline-block">
                  <select
                    value={currentFarm.id}
                    onChange={(e) => onSelectParcel(e.target.value)}
                    aria-label="Switch Field"
                    className="text-[11px] font-semibold py-0.5 px-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 cursor-pointer focus:outline-hidden"
                  >
                    {parcels.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.farmName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-sky-600 dark:text-sky-400 font-medium mt-0.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{currentFarm.location.displayName || currentFarm.location.villageOrPincode}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
          {/* Water Supply Pill */}
          <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 font-semibold flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>
              {currentFarm.reserve.storageType === 'borewell_hours'
                ? `${currentFarm.reserve.pumpPower_hp || 5} HP Tube-well`
                : currentFarm.reserve.storageType === 'custom_sump'
                ? 'Masonry Sump'
                : 'Sintex Tank'}
            </span>
          </span>

          {/* Soil Badge */}
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium capitalize">
            {currentFarm.soil.texture} Soil
          </span>

          {/* Edit Field Button */}
          <button
            type="button"
            onClick={() => onEditParcel(currentFarm)}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer text-[11px] font-semibold flex items-center gap-1"
            title="Edit Field Configuration"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Parcel</span>
          </button>
        </div>
      </div>

      {/* TIER 1: Hero Decision Card & Micro-Climate Station */}
      {currentForecast && decision && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* Left 7 cols: Decision Card + What-If simulation */}
          <div className="lg:col-span-7 flex flex-col space-y-4 sm:space-y-5">
            <div className="flex-1">
              <DecisionCard decision={decision} />
            </div>

            {/* What-If Simulation Levers */}
            {isDemoMode && isSimulating && (
              <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/35 bg-amber-500/10 dark:bg-amber-950/20 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    What-If Scenario Levers (Instant Real-Time Decision Shifts)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300">Simulate Forecast Rain:</span>
                      <strong className="text-sky-600 dark:text-sky-400 font-mono text-sm">{interactiveRainMm} mm</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="1"
                      value={interactiveRainMm}
                      onChange={(e) => onRainSliderChange(parseFloat(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer min-h-[36px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300">Simulate Available Reserve:</span>
                      <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm">
                        {interactiveTankLiters.toLocaleString()} L
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="5000"
                      step="200"
                      value={interactiveTankLiters}
                      onChange={(e) => onTankSliderChange(parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer min-h-[36px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right 5 cols: Live Climate Station */}
          <div id="climate-station-section" className="lg:col-span-5 flex flex-col">
            <LiveClimateStation
              forecast={currentForecast}
              locationName={currentFarm.location.displayName || currentFarm.location.villageOrPincode}
              latitude={currentFarm.location.latitude}
              longitude={currentFarm.location.longitude}
              isSimulating={isSimulating}
              onToggleSimulation={onToggleSimulation}
              onRefreshWeather={onRefreshWeather}
              isRefreshing={isRefreshingWeather}
              errorMessage={weatherErrorMessage}
              showDevLevers={isDemoMode}
            />
          </div>
        </div>
      )}

      {/* TIER 2: Water Budget Matrix & Environmental Ledger */}
      {decision && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* Left 7 cols: Water Budget Card */}
          <div id="water-budget-section" className="lg:col-span-7 flex flex-col">
            <WaterBudgetCard
              totalDemand_liters={decision.totalFarmDemand_liters}
              netDemand_liters={decision.netFarmDemand_liters}
              availableReserve_liters={decision.availableWater_liters}
              waterShortfall_liters={decision.waterShortfall_liters}
              plots={decision.plots}
            />
          </div>

          {/* Right 5 cols: Environmental Ledger Card */}
          <div id="environmental-ledger-section" className="lg:col-span-5 flex flex-col">
            <EnvironmentalLedgerCard ledger={decision.environmentalLedger} />
          </div>
        </div>
      )}
    </div>
  );
}
