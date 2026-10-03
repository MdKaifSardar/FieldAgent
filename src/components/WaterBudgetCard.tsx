'use client';

import React from 'react';
import { PlotCalculationResult } from '../types/decision';
import { Database, Sprout, AlertCircle, CheckCircle2 } from 'lucide-react';

interface WaterBudgetCardProps {
  totalDemand_liters: number;
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
  const isDeficit = waterShortfall_liters > 0;
  const reservePct = totalDemand_liters > 0 
    ? Math.min(100, Math.round((availableReserve_liters / totalDemand_liters) * 100))
    : 100;

  return (
    <div className="glass-panel p-6 border border-slate-800">
      
      {/* Header & Shared Water Budget Bar */}
      <div className="border-b border-slate-800/80 pb-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white font-['Outfit']">
              Shared Water Budget & Multi-Crop Balance
            </h3>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
            isDeficit 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
          }`}>
            {isDeficit ? `Deficit: -${waterShortfall_liters.toLocaleString()} L` : 'Reserve Sufficient'}
          </span>
        </div>

        {/* Progress Fill Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Usable Storage: <strong className="text-white">{availableReserve_liters.toLocaleString()} L</strong></span>
            <span>Total Farm Demand: <strong className="text-white">{totalDemand_liters.toLocaleString()} L</strong></span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                isDeficit 
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500' 
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
              }`}
              style={{ width: `${Math.max(5, reservePct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Multi-Crop Plot Breakdown */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Sprout className="w-4 h-4 text-emerald-400" />
          Field Plots Root-Zone Stress Matrix
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
                    ? 'bg-rose-950/20 border-rose-500/40' 
                    : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm font-['Outfit'] flex items-center gap-1.5">
                    {plot.cropName}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1'
                  }`}>
                    {isCritical ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {isCritical ? 'Stress Imminent' : 'Buffer Safe'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 my-2">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Water Requirement</span>
                    <strong className="text-slate-200">{plot.waterNeeded_liters.toLocaleString()} Litres</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Stress Deadline</span>
                    <strong className={isCritical ? 'text-rose-400' : 'text-emerald-400'}>
                      {plot.hoursToCriticalStress} Hours
                    </strong>
                  </div>
                </div>

                {/* Root Zone Depletion Gauge */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Root Depletion (Dr): {plot.currentDepletion_mm} mm</span>
                    <span>Stress Line (RAW): {plot.raw_mm} mm</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isCritical ? 'bg-rose-500' : 'bg-emerald-500'}`}
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
