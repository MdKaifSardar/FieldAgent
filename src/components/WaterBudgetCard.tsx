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
    <div className="h-full flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-[#E1E8DE] dark:border-[#1F2D24] bg-white dark:bg-[#141D17] shadow-sm transition-all">
      
      {/* Header & Shared Water Budget Bar */}
      <div>
        <div className="border-b border-[#E1E8DE] dark:border-[#1F2D24] pb-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8] shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-[#121C15] dark:text-[#F0F4F1] font-['Outfit']">
                {t.availableReserve} & Multi-Crop Balance
              </h3>
            </div>
            <span className={`self-start sm:self-auto text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isDeficit 
                ? 'bg-[#C2410C]/10 dark:bg-[#C2410C]/20 text-[#C2410C] dark:text-[#FB923C] border-[#C2410C]/30' 
                : 'bg-[#0284C7]/10 dark:bg-[#0284C7]/20 text-[#0284C7] dark:text-[#38BDF8] border-[#0284C7]/30'
            }`}>
              {isDeficit ? `${t.shortfall}: -${waterShortfall_liters.toLocaleString()} L` : t.reserveSufficient}
            </span>
          </div>

          {/* Progress Fill Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[#4D6653] dark:text-[#8FA894]">
              <span>{t.usableStorage}: <strong className="text-[#121C15] dark:text-[#F0F4F1] font-mono">{availableReserve_liters.toLocaleString()} L</strong></span>
              <span>{t.grossDemand}: <strong className="text-[#121C15] dark:text-[#F0F4F1] font-mono">{totalDemand_liters.toLocaleString()} L</strong></span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  isDeficit 
                    ? 'bg-gradient-to-r from-[#C2410C] to-[#D97706]' 
                    : 'bg-gradient-to-r from-[#0284C7] to-[#16A34A]'
                }`}
                style={{ width: `${Math.max(5, reservePct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Multi-Crop Plot Breakdown */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#4D6653] dark:text-[#8FA894] mb-3 flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-[#16A34A] dark:text-[#22C55E]" />
            {t.rootZoneMatrix}
          </h4>

          <div className={`grid gap-3.5 ${plots.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {plots.map((plot) => {
              const isCritical = plot.urgencyLevel === 'critical';
              const stressPct = Math.min(100, Math.round((plot.currentDepletion_mm / plot.taw_mm) * 100));

              return (
                <div 
                  key={plot.plotId}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isCritical 
                      ? 'bg-[#FEF2F2] dark:bg-[#2A1414] border-[#FCA5A5] dark:border-[#5E2222]' 
                      : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] hover:border-[#16A34A]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#121C15] dark:text-[#F0F4F1] text-sm font-['Outfit']">
                        {plot.cropName}
                      </span>
                      <span className="text-[10px] bg-white dark:bg-[#141D17] text-[#0284C7] dark:text-[#38BDF8] px-1.5 py-0.5 rounded font-mono border border-[#E1E8DE] dark:border-[#2A3E31]">
                        {(plot.irrigationMethod || 'surface_flood').toUpperCase()} ({Math.round((plot.irrigationEfficiency || 0.75) * 100)}%)
                      </span>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isCritical
                        ? 'bg-[#C2410C]/10 text-[#C2410C] dark:text-[#FB923C] border border-[#C2410C]/25 flex items-center gap-1'
                        : 'bg-[#16A34A]/10 text-[#16A34A] dark:text-[#4ADE80] border border-[#16A34A]/25 flex items-center gap-1'
                    }`}>
                      {isCritical ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {isCritical ? t.stressImminent : t.bufferSafe}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#4D6653] dark:text-[#8FA894] my-2">
                    <div>
                      <span className="text-[#6C8472] dark:text-[#7A9884] block text-[10px] uppercase font-semibold">{t.grossDemand}</span>
                      <strong className="text-[#121C15] dark:text-[#F0F4F1] font-mono">{plot.grossWaterNeeded_liters.toLocaleString()} L</strong>
                      <span className="text-[10px] text-[#6C8472] dark:text-[#7A9884] block">(Net: {plot.waterNeeded_liters.toLocaleString()} L)</span>
                    </div>
                    <div>
                      <span className="text-[#6C8472] dark:text-[#7A9884] block text-[10px] uppercase font-semibold">{t.stressDeadline}</span>
                      <strong className={`font-mono text-sm ${isCritical ? 'text-[#C2410C] dark:text-[#FB923C]' : 'text-[#16A34A] dark:text-[#22C55E]'}`}>
                        {plot.hoursToCriticalStress} {t.hours}
                      </strong>
                    </div>
                  </div>

                  {/* Root Zone Depletion Gauge */}
                  <div className="mt-2.5 pt-2 border-t border-[#E1E8DE] dark:border-[#2A3E31]">
                    <div className="flex justify-between text-[11px] text-[#4D6653] dark:text-[#8FA894] mb-1">
                      <span>Root Depletion (Dr): <strong className="text-[#121C15] dark:text-[#F0F4F1]">{plot.currentDepletion_mm} mm</strong></span>
                      <span>Stress Limit (RAW): <strong className="text-[#121C15] dark:text-[#F0F4F1]">{plot.raw_mm} mm</strong></span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#2A3E31] overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${isCritical ? 'bg-[#C2410C]' : 'bg-[#16A34A] dark:bg-[#22C55E]'}`}
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
    </div>
  );
}
