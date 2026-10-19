'use client';

import React from 'react';
import { EnvironmentalLedger } from '../types/ledger';
import { useLanguage } from './common/LanguageContext';
import { Droplet, Zap, Leaf, IndianRupee, Info } from 'lucide-react';

interface EnvironmentalLedgerProps {
  ledger: EnvironmentalLedger;
}

export function EnvironmentalLedgerCard({ ledger }: EnvironmentalLedgerProps) {
  const { t } = useLanguage();
  const isDeferred = ledger.deferredVolume_liters > 0;

  return (
    <div className="h-full flex flex-col justify-between p-4 sm:p-5 rounded-xl border border-[#E1E8DE] dark:border-[#16364D] bg-white dark:bg-[#0D2232] shadow-xs transition-all">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-[#E1E8DE] dark:border-[#16364D] gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {t.environmentalLedger}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
              {t.ledgerSubtitle}
            </h3>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            {t.actionOutcome}
          </span>
        </div>

        {/* 4 Metric Cards in 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3.5">
          {/* Metric 1: Water Volume */}
          <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50/80 dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] shadow-2xs flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between text-slate-500 dark:text-[#94A3B8] mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate">{t.waterDeferred}</span>
              <Droplet className="w-3.5 h-3.5 text-sky-500 shrink-0 ml-1" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
                {isDeferred ? ledger.deferredVolume_liters.toLocaleString() : '0'} <span className="text-xs font-normal text-slate-400">L</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-sky-600 dark:text-[#38BDF8] mt-0.5 font-medium truncate">
                {isDeferred ? `Avoiding ${ledger.deferredIrrigationDepth_mm} mm` : t.noSessionAvoided}
              </p>
            </div>
          </div>

          {/* Metric 2: Pump Hours */}
          <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50/80 dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] shadow-2xs flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between text-slate-500 dark:text-[#94A3B8] mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate">{t.pumpRuntimeSaved}</span>
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
                {isDeferred ? ledger.pumpingHoursSaved : '0'} <span className="text-xs font-normal text-slate-400">{t.hours}</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium truncate">
                {isDeferred ? `${ledger.electricitySaved_kwh} kWh saved` : '0 kWh'}
              </p>
            </div>
          </div>

          {/* Metric 3: Carbon Offset */}
          <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50/80 dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] shadow-2xs flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between text-slate-500 dark:text-[#94A3B8] mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate">{t.carbonAvoided}</span>
              <Leaf className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
                {isDeferred ? ledger.carbonOffset_kg_co2 : '0'} <span className="text-xs font-normal text-slate-400">kg CO₂</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium truncate">
                {t.gridEmissionsAvoided}
              </p>
            </div>
          </div>

          {/* Metric 4: Cost Conserved */}
          <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50/80 dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] shadow-2xs flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between text-slate-500 dark:text-[#94A3B8] mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate">{t.rupeesSaved}</span>
              <IndianRupee className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
                ₹{isDeferred ? ledger.estimatedCostSaved_inr : '0'}
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium truncate">
                {t.costExpenseSaved}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transparency Note at bottom */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50/80 dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] text-xs text-slate-500 dark:text-[#94A3B8] mt-auto">
        <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          {ledger.transparencyNote}
        </span>
      </div>
    </div>
  );
}
