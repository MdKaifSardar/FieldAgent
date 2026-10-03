'use client';

import React from 'react';
import { EnvironmentalLedger } from '../types/ledger';
import { Droplet, Zap, Leaf, IndianRupee, Info } from 'lucide-react';

interface EnvironmentalLedgerProps {
  ledger: EnvironmentalLedger;
}

export function EnvironmentalLedgerCard({ ledger }: EnvironmentalLedgerProps) {
  const isDeferred = ledger.deferredVolume_liters > 0;

  return (
    <div className="glass-panel p-6 border border-emerald-500/20 bg-emerald-950/20 shadow-lg">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Environmental Impact Ledger
          </span>
          <h3 className="text-lg font-bold text-white font-['Outfit']">
            Conserved Water & Emissions Balance
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Measurable Action Outcome
        </span>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        
        {/* Metric 1: Water Volume */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Deferred Water</span>
            <Droplet className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-['Outfit']">
              {isDeferred ? ledger.deferredVolume_liters.toLocaleString() : '0'} <span className="text-xs font-normal text-slate-400">Litres</span>
            </div>
            <p className="text-[11px] text-cyan-300/80 mt-0.5">
              {isDeferred ? `Avoiding ${ledger.deferredIrrigationDepth_mm} mm depth` : 'No session avoided'}
            </p>
          </div>
        </div>

        {/* Metric 2: Pump Hours */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Pumping Saved</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-['Outfit']">
              {isDeferred ? ledger.pumpingHoursSaved : '0'} <span className="text-xs font-normal text-slate-400">Hours</span>
            </div>
            <p className="text-[11px] text-amber-300/80 mt-0.5">
              {isDeferred ? `${ledger.electricitySaved_kwh} kWh avoided` : '0 kWh'}
            </p>
          </div>
        </div>

        {/* Metric 3: Carbon Offset */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Carbon Offset</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-['Outfit']">
              {isDeferred ? ledger.carbonOffset_kg_co2 : '0'} <span className="text-xs font-normal text-slate-400">kg CO₂</span>
            </div>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">
              Grid emissions avoided
            </p>
          </div>
        </div>

        {/* Metric 4: Cost Conserved */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Expense Saved</span>
            <IndianRupee className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-['Outfit']">
              ₹{isDeferred ? ledger.estimatedCostSaved_inr : '0'}
            </div>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">
              Fuel & electric tariff
            </p>
          </div>
        </div>

      </div>

      {/* Transparency Note */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {ledger.transparencyNote}
        </p>
      </div>
    </div>
  );
}
