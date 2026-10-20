'use client';

import React, { useState } from 'react';
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
  Plus,
  Zap,
  CloudSun,
  ScrollText
} from 'lucide-react';

export type AdvisoryTab = 'advisory' | 'water' | 'climate' | 'ledger';

interface FieldAdvisoryViewProps {
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

export function FieldAdvisoryView({
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
}: FieldAdvisoryViewProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdvisoryTab>('advisory');

  // 1. Shimmer loading state
  if (isRefreshingWeather && !decision) {
    return <CockpitSkeleton />;
  }

  // 2. Empty state: No farm configured
  if (!currentFarm) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center bg-white dark:bg-[#0D2232] border border-[#E1E8DE] dark:border-[#16364D] rounded-xl shadow-xs">
        <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-sky-50 dark:bg-[#112B3E] text-sky-600 dark:text-[#38BDF8] flex items-center justify-center">
          <Sprout className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-[#F0F9FF] mb-2 font-['Outfit']">
          {language === 'hi' ? 'कोई सक्रिय खेत चयनित नहीं है' : 'No Active Field Selected'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-sm mx-auto mb-6">
          {parcels.length > 0 
            ? 'Please choose a field from your sidebar directory to view its agronomic advisory.'
            : 'Configure your first field parcel with geo-coordinates, soil texture, and water source to activate precision irrigation.'}
        </p>

        {parcels.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {parcels.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectParcel(p.id)}
                className="px-4 py-2 rounded-md bg-slate-900 dark:bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition-colors cursor-pointer"
              >
                Open {p.farmName}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenNewParcelWizard}
            className="px-5 py-2.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Configure First Field</span>
          </button>
        )}
      </div>
    );
  }

  // Calculate primary crop & plot area for header metadata
  const primaryPlot = currentFarm.plots?.[0];
  const totalPlotsAreaM2 = currentFarm.plots?.reduce((sum, p) => sum + (p.area_sq_meters || 0), 0) || 0;
  const totalBigha = (totalPlotsAreaM2 / 1338.0).toFixed(1);
  const totalAcres = (totalPlotsAreaM2 / 4046.86).toFixed(1);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* UNIFIED PERSISTENT MASTER BANNER */}
      <div className="rounded-xl bg-white dark:bg-[#0D2232] border border-[#E1E8DE] dark:border-[#16364D] shadow-xs overflow-hidden">
        {/* Top Header Row */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Sprout Icon + Prominent Title + Metadata Subtitle */}
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] truncate leading-tight">
                {currentFarm.farmName}
              </h1>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                <span className="flex items-center gap-1 text-sky-600 dark:text-[#38BDF8] font-medium truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{currentFarm.location.displayName || currentFarm.location.villageOrPincode}</span>
                </span>
                <span className="text-slate-300 dark:text-[#1E4765]">•</span>
                <span>
                  {primaryPlot ? `${primaryPlot.cropName} (${totalBigha} Bigha / ${totalAcres} Acre)` : `${totalBigha} Bigha`}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Badges & Edit Parcel Action */}
          <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
            {/* Water Supply Pill */}
            <span className="px-2.5 py-1.5 rounded-md bg-sky-50 dark:bg-[#112B3E] border border-sky-200 dark:border-[#1E4765] text-sky-800 dark:text-[#38BDF8] font-semibold flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              <span>
                {currentFarm.reserve.storageType === 'borewell_hours'
                  ? `${currentFarm.reserve.pumpPower_hp || 5} HP Tube-well`
                  : currentFarm.reserve.storageType === 'custom_sump'
                  ? 'Masonry Sump'
                  : 'Sintex Tank'}
              </span>
            </span>

            {/* Soil Texture Pill */}
            <span className="px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-[#112B3E] border border-slate-200 dark:border-[#16364D] text-slate-700 dark:text-slate-300 font-medium capitalize">
              {currentFarm.soil.texture} Soil
            </span>

            {/* Edit Field Button */}
            <button
              type="button"
              onClick={() => onEditParcel(currentFarm)}
              className="px-2.5 py-1.5 rounded-md bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-[#38BDF8] border border-sky-200 dark:border-[#1E4765] transition-colors cursor-pointer font-semibold flex items-center gap-1.5"
              title="Edit Field Configuration"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Parcel</span>
            </button>
          </div>
        </div>

        {/* INTEGRATED HORIZONTAL SUB-NAVIGATION TAB BAR */}
        <div className="px-4 sm:px-6 border-t border-[#E1E8DE] dark:border-[#16364D] bg-slate-50/50 dark:bg-[#0A1C2A] flex items-center gap-2 sm:gap-3 overflow-x-auto">
          {[
            { id: 'advisory' as AdvisoryTab, label: 'Decision & Advisory', icon: <Zap className="w-4 h-4" /> },
            { id: 'water' as AdvisoryTab, label: 'Water Budget & Sump', icon: <Droplets className="w-4 h-4" /> },
            { id: 'climate' as AdvisoryTab, label: 'Micro-Climate Station', icon: <CloudSun className="w-4 h-4" /> },
            { id: 'ledger' as AdvisoryTab, label: 'Environmental Ledger', icon: <ScrollText className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-3 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap relative ${
                  isActive
                    ? 'text-sky-600 dark:text-[#38BDF8] font-bold'
                    : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-sky-500 dark:text-[#38BDF8]' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-500 rounded-t-full shadow-xs" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* WORKSPACE TAB CONTENT: Renders only the active tool with focused clarity */}
      {decision && currentForecast && (
        <div className="space-y-5">
          {/* TAB 1: ⚡ DECISION & ADVISORY */}
          {activeTab === 'advisory' && (
            <div className="space-y-4">
              <DecisionCard decision={decision} />

              {/* What-If Simulation Levers (Only visible in demo mode) */}
              {isDemoMode && isSimulating && (
                <div className="p-4 sm:p-5 rounded-lg border border-amber-500/35 bg-amber-500/10 dark:bg-amber-950/20 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      What-If Simulation Levers (Real-Time Decision Shifts)
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
          )}

          {/* TAB 2: 💧 WATER BUDGET & SUMP */}
          {activeTab === 'water' && (
            <div className="rounded-lg">
              <WaterBudgetCard
                totalDemand_liters={decision.totalFarmDemand_liters}
                netDemand_liters={decision.netFarmDemand_liters}
                availableReserve_liters={decision.availableWater_liters}
                waterShortfall_liters={decision.waterShortfall_liters}
                plots={decision.plots}
              />
            </div>
          )}

          {/* TAB 3: 🌦️ MICRO-CLIMATE STATION */}
          {activeTab === 'climate' && (
            <div className="rounded-lg">
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
          )}

          {/* TAB 4: 📜 ENVIRONMENTAL LEDGER */}
          {activeTab === 'ledger' && (
            <div className="rounded-lg">
              <EnvironmentalLedgerCard ledger={decision.environmentalLedger} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
