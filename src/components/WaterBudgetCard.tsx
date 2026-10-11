'use client';

import React from 'react';
import { PlotCalculationResult } from '../types/decision';
import { useLanguage } from './common/LanguageContext';
import { Database, Sprout, AlertCircle, CheckCircle2, Droplets } from 'lucide-react';

interface WaterBudgetCardProps {
  totalDemand_liters: number;
  netDemand_liters?: number;
  availableReserve_liters: number;
  waterShortfall_liters: number;
  plots: PlotCalculationResult[];
}

export function WaterBudgetCard({
  totalDemand_liters,
  netDemand_liters,
  availableReserve_liters,
  waterShortfall_liters,
  plots,
}: WaterBudgetCardProps) {
  const { t } = useLanguage();
  const isDeficit = waterShortfall_liters > 0;
  const reservePct = totalDemand_liters > 0 
    ? Math.min(100, Math.round((availableReserve_liters / totalDemand_liters) * 100))
    : 100;

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-[#E1E6DE] dark:border-[#1E3022] bg-[#F9FAF7] dark:bg-[#0E1711] shadow-sm">
      
      {/* Header & Shared Water Budget Bar */}
      <div className="border-b border-[#E1E6DE] dark:border-[#1E3022] pb-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#1D4E89] dark:text-[#64B5F6] shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-[#111C15] dark:text-[#ECF2EC] font-['Outfit']">
              {t.availableReserve} & Multi-Crop Balance
            </h3>
          </div>
          <span className={`self-start sm:self-auto text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
            isDeficit 
              ? 'bg-[#E5484D]/10 dark:bg-[#E5484D]/20 text-[#C92A2A] dark:text-[#FFA8A8] border-[#E5484D]/30' 
              : 'bg-[#1D4E89]/10 dark:bg-[#1D4E89]/20 text-[#1D4E89] dark:text-[#64B5F6] border-[#1D4E89]/30'
          }`}>
            {isDeficit ? `${t.shortfall}: -${waterShortfall_liters.toLocaleString()} L` : t.reserveSufficient}
          </span>
        </div>

        {/* Progress Fill Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-[#526356] dark:text-[#8FA394]">
            <span>{t.usableStorage}: <strong className="text-[#111C15] dark:text-[#ECF2EC] font-mono">{availableReserve_liters.toLocaleString()} L</strong></span>
            <span>{t.grossDemand}: <strong className="text-[#111C15] dark:text-[#ECF2EC] font-mono">{totalDemand_liters.toLocaleString()} L</strong></span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#E5EAE3] dark:bg-[#152319] border border-[#D5DFD3] dark:border-[#223828] overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                isDeficit 
                  ? 'bg-gradient-to-r from-[#E5484D] to-[#D97706]' 
                  : 'bg-gradient-to-r from-[#1D4E89] to-[#2D6A4F]'
              }`}
              style={{ width: `${Math.max(5, reservePct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Multi-Crop Plot Breakdown */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#526356] dark:text-[#8FA394] mb-3 flex items-center gap-1.5">
          <Sprout className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
          {t.rootZoneMatrix}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {plots.map((plot) => {
            const isCritical = plot.urgencyLevel === 'critical';
            const stressPct = Math.min(100, Math.round((plot.currentDepletion_mm / plot.taw_mm) * 100));

            return (
              <div 
                key={plot.plotId}
                className={`p-4 rounded-xl border transition-all ${
                  isCritical 
                    ? 'bg-[#FFF5F5] dark:bg-[#200F12] border-[#FFA8A8] dark:border-[#5C1D24]' 
                    : 'bg-white dark:bg-[#121E15] border-[#E1E6DE] dark:border-[#1E3022] hover:border-[#2D6A4F]/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111C15] dark:text-[#ECF2EC] text-sm font-['Outfit']">
                      {plot.cropName}
                    </span>
                    <span className="text-[10px] bg-[#EAEFE8] dark:bg-[#1A2A1E] text-[#1D4E89] dark:text-[#64B5F6] px-1.5 py-0.5 rounded font-mono">
                      {(plot.irrigationMethod || 'surface_flood').toUpperCase()} ({Math.round((plot.irrigationEfficiency || 0.75) * 100)}%)
                    </span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isCritical
                      ? 'bg-[#E5484D]/10 text-[#C92A2A] dark:text-[#FFA8A8] border border-[#E5484D]/25 flex items-center gap-1'
                      : 'bg-[#2D6A4F]/10 text-[#1B4332] dark:text-[#74C69D] border border-[#2D6A4F]/25 flex items-center gap-1'
                  }`}>
                    {isCritical ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {isCritical ? t.stressImminent : t.bufferSafe}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#526356] dark:text-[#8FA394] my-2">
                  <div>
                    <span className="text-[#6C7C70] dark:text-[#7E9685] block text-[10px] uppercase">{t.grossDemand}</span>
                    <strong className="text-[#111C15] dark:text-[#ECF2EC] font-mono">{plot.grossWaterNeeded_liters.toLocaleString()} L</strong>
                    <span className="text-[10px] text-[#6C7C70] dark:text-[#7E9685] block">(Net: {plot.waterNeeded_liters.toLocaleString()} L)</span>
                  </div>
                  <div>
                    <span className="text-[#6C7C70] dark:text-[#7E9685] block text-[10px] uppercase">{t.stressDeadline}</span>
                    <strong className={`font-mono text-sm ${isCritical ? 'text-[#E5484D] dark:text-[#FF8787]' : 'text-[#2D6A4F] dark:text-[#52B788]'}`}>
                      {plot.hoursToCriticalStress} {t.hours}
                    </strong>
                  </div>
                </div>

                {/* Root Zone Depletion Gauge */}
                <div className="mt-3 pt-2.5 border-t border-[#E1E6DE] dark:border-[#1E3022]">
                  <div className="flex justify-between text-[11px] text-[#526356] dark:text-[#8FA394] mb-1">
                    <span>Root Depletion (Dr): <strong className="text-[#111C15] dark:text-[#ECF2EC]">{plot.currentDepletion_mm} mm</strong></span>
                    <span>Stress Limit (RAW): <strong className="text-[#111C15] dark:text-[#ECF2EC]">{plot.raw_mm} mm</strong></span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#E5EAE3] dark:bg-[#1A2A1E] overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${isCritical ? 'bg-[#E5484D]' : 'bg-[#2D6A4F] dark:bg-[#52B788]'}`}
                      style={{ width: `${stressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
