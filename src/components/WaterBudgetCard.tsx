'use client';

import React from 'react';
import { PlotCalculationResult } from '../types/decision';
import { useLanguage } from './common/LanguageContext';
import { Database, Sprout, AlertCircle, CheckCircle2 } from 'lucide-react';

interface WaterBudgetCardProps {
  totalDemand_liters: number;
  netDemand_liters?: number;
  availableReserve_liters: number;
  waterShortfall_liters: number;
  plots: PlotCalculationResult[];
}

export function WaterBudgetCard({
  totalDemand_liters,
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
    <div className="h-full flex flex-col justify-between p-4 sm:p-5 rounded-xl border border-[#E1E8DE] dark:border-[#16364D] bg-white dark:bg-[#0D2232] shadow-xs transition-all">
      {/* Header & Shared Water Budget Bar */}
      <div>
        <div className="border-b border-[#E1E8DE] dark:border-[#16364D] pb-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-sky-500 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
                {t.availableReserve} & Multi-Crop Balance
              </h3>
            </div>
            <span className={`self-start sm:self-auto text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isDeficit 
                ? 'bg-amber-500/10 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-500/30' 
                : 'bg-sky-500/10 dark:bg-sky-950/40 text-sky-600 dark:text-[#38BDF8] border-sky-500/30'
            }`}>
              {isDeficit ? `${t.shortfall}: ${waterShortfall_liters.toLocaleString()} L` : t.reserveSufficient}
            </span>
          </div>

          {/* Progress Fill Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 dark:text-[#94A3B8]">
              <span>{t.usableStorage}: <strong className="text-slate-900 dark:text-[#F0F9FF] font-mono">{availableReserve_liters.toLocaleString()} L</strong></span>
              <span>{t.grossDemand}: <strong className="text-slate-900 dark:text-[#F0F9FF] font-mono">{totalDemand_liters.toLocaleString()} L</strong></span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-[#112B3E] border border-slate-200 dark:border-[#1E4765] overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  isDeficit 
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500' 
                    : 'bg-gradient-to-r from-sky-500 to-emerald-500'
                }`}
                style={{ width: `${Math.max(5, reservePct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Multi-Crop Plot Breakdown */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-3 flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-emerald-500" />
            {t.rootZoneMatrix}
          </h4>

          <div className={`grid gap-3.5 ${plots.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {plots.map((plot) => {
              const isCritical = plot.urgencyLevel === 'critical';
              const stressPct = Math.min(100, Math.round((plot.currentDepletion_mm / plot.taw_mm) * 100));

              return (
                <div 
                  key={plot.plotId}
                  className={`p-3.5 sm:p-4 rounded-lg border transition-all ${
                    isCritical 
                      ? 'bg-rose-50/60 dark:bg-[#1C161E] border-rose-200 dark:border-rose-900/60' 
                      : 'bg-slate-50/80 dark:bg-[#0A1C2A] border-[#E1E8DE] dark:border-[#16364D] hover:border-sky-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-[#F0F9FF] text-sm font-['Outfit']">
                        {plot.cropName}
                      </span>
                      <span className="text-[10px] bg-white dark:bg-[#112B3E] text-sky-600 dark:text-[#38BDF8] px-1.5 py-0.5 rounded font-mono border border-slate-200 dark:border-[#16364D]">
                        {(plot.irrigationMethod || 'surface_flood').toUpperCase()} ({Math.round((plot.irrigationEfficiency || 0.75) * 100)}%)
                      </span>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isCritical
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center gap-1'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1'
                    }`}>
                      {isCritical ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {isCritical ? t.stressImminent : t.bufferSafe}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-[#94A3B8] my-2">
                    <div>
                      <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">{t.grossDemand}</span>
                      <strong className="text-slate-900 dark:text-[#F0F9FF] font-mono">{plot.grossWaterNeeded_liters.toLocaleString()} L</strong>
                      <span className="text-[10px] text-slate-400 block">(Net: {plot.waterNeeded_liters.toLocaleString()} L)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">{t.stressDeadline}</span>
                      <strong className={`font-mono text-sm ${isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {plot.hoursToCriticalStress} {t.hours}
                      </strong>
                    </div>
                  </div>

                  {/* Root Zone Depletion Gauge */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-[#16364D]">
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-[#94A3B8] mb-1">
                      <span>Root Depletion (Dr): <strong className="text-slate-900 dark:text-[#F0F9FF]">{plot.currentDepletion_mm} mm</strong></span>
                      <span>Stress Limit (RAW): <strong className="text-slate-900 dark:text-[#F0F9FF]">{plot.raw_mm} mm</strong></span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#112B3E] border border-slate-200 dark:border-[#16364D] overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${isCritical ? 'bg-rose-500' : 'bg-emerald-500'}`}
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
