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
    <div className="h-full flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-[#E1E8DE] dark:border-[#1F2D24] bg-white dark:bg-[#141D17] shadow-sm transition-all">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-[#E1E8DE] dark:border-[#1F2D24] gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A] dark:text-[#22C55E]">
              {t.environmentalLedger}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[#121C15] dark:text-[#F0F4F1] font-['Outfit']">
              {t.ledgerSubtitle}
            </h3>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-semibold bg-[#16A34A]/10 dark:bg-[#16A34A]/20 text-[#16A34A] dark:text-[#4ADE80] border border-[#16A34A]/25">
            {t.actionOutcome}
          </span>
        </div>

        {/* 4 Metric Cards in 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3.5">
          
          {/* Metric 1: Water Volume */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] shadow-xs flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between text-[#4D6653] dark:text-[#8FA894] mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate">{t.waterDeferred}</span>
              <Droplet className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8] shrink-0 ml-1" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-[#121C15] dark:text-[#F0F4F1] font-['Outfit']">
                {isDeferred ? ledger.deferredVolume_liters.toLocaleString() : '0'} <span className="text-xs font-normal text-[#4D6653] dark:text-[#8FA894]">L</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#0284C7] dark:text-[#38BDF8] mt-0.5 font-medium truncate">
                {isDeferred ? `Avoiding ${ledger.deferredIrrigationDepth_mm} mm` : t.noSessionAvoided}
              </p>
            </div>
          </div>

          {/* Metric 2: Pump Hours */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] shadow-xs flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between text-[#4D6653] dark:text-[#8FA894] mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate">{t.pumpRuntimeSaved}</span>
              <Zap className="w-3.5 h-3.5 text-[#D97706] dark:text-[#FBBF24] shrink-0 ml-1" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-[#121C15] dark:text-[#F0F4F1] font-['Outfit']">
                {isDeferred ? ledger.pumpingHoursSaved : '0'} <span className="text-xs font-normal text-[#4D6653] dark:text-[#8FA894]">{t.hours}</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#D97706] dark:text-[#FBBF24] mt-0.5 font-medium truncate">
                {isDeferred ? `${ledger.electricitySaved_kwh} kWh saved` : '0 kWh'}
              </p>
            </div>
          </div>

          {/* Metric 3: Carbon Offset */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] shadow-xs flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between text-[#4D6653] dark:text-[#8FA894] mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate">{t.carbonAvoided}</span>
              <Leaf className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#22C55E] shrink-0 ml-1" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-[#121C15] dark:text-[#F0F4F1] font-['Outfit']">
                {isDeferred ? ledger.carbonOffset_kg_co2 : '0'} <span className="text-xs font-normal text-[#4D6653] dark:text-[#8FA894]">kg CO₂</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#16A34A] dark:text-[#4ADE80] mt-0.5 font-medium truncate">
                {t.gridEmissionsAvoided}
              </p>
            </div>
          </div>

          {/* Metric 4: Cost Conserved */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] shadow-xs flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between text-[#4D6653] dark:text-[#8FA894] mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate">{t.rupeesSaved}</span>
              <IndianRupee className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#22C55E] shrink-0 ml-1" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-[#121C15] dark:text-[#F0F4F1] font-['Outfit']">
                ₹{isDeferred ? ledger.estimatedCostSaved_inr : '0'}
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#16A34A] dark:text-[#4ADE80] mt-0.5 font-medium truncate">
                {t.costExpenseSaved}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Transparency Note at bottom */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] text-xs text-[#4D6653] dark:text-[#8FA894] mt-auto">
        <Info className="w-4 h-4 text-[#16A34A] dark:text-[#22C55E] shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          {ledger.transparencyNote}
        </span>
      </div>
    </div>
  );
}
