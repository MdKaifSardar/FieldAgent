'use client';

import React, { useState } from 'react';
import { 
  FlaskConical, 
  CloudRain, 
  AlertTriangle, 
  Sliders, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown, 
  X,
  ShieldCheck,
  Check
} from 'lucide-react';

interface DemoSandboxDockProps {
  activePresetId: string | null;
  onSelectPreset: (presetId: string) => void;
  onExitDemo: () => void;
  hasCustomFarm: boolean;
  isSimulating: boolean;
  onToggleSimulation: (sim: boolean) => void;
}

export function DemoSandboxDock({
  activePresetId,
  onSelectPreset,
  onExitDemo,
  hasCustomFarm,
  isSimulating,
  onToggleSimulation,
}: DemoSandboxDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isViewingPreset = activePresetId !== null && activePresetId.startsWith('preset_');

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      
      {/* Expanded Sandbox Controls Panel */}
      {isExpanded && (
        <div className="glass-panel w-84 sm:w-96 p-4 border border-amber-500/40 bg-slate-950/95 shadow-2xl rounded-2xl mb-1 fade-in">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>Demo Video Sandbox</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    ENV DEMO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Deterministic scenarios for hackathon recording
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scenarios & Levers */}
          <div className="space-y-3 mt-3">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Deterministic Scenarios:</span>
              <span className="text-[10px] text-amber-400 font-normal">Video Proof</span>
            </div>

            {/* Preset 1: Rain Avoidance */}
            <button
              type="button"
              onClick={() => onSelectPreset('preset_rain_avoidance')}
              className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-start gap-2.5 ${
                activePresetId === 'preset_rain_avoidance'
                  ? 'bg-[#16A34A]/20 border-[#16A34A] text-[#86EFAC] shadow-sm shadow-[#16A34A]/20'
                  : 'bg-[#1B2720]/80 border-[#2A3E31] text-[#E4EBE0] hover:border-[#16A34A]/50'
              }`}
            >
              <CloudRain className="w-4 h-4 text-[#4ADE80] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>Scenario A: Rain Avoidance</span>
                  {activePresetId === 'preset_rain_avoidance' && (
                    <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
                  )}
                </div>
                <div className="text-[10px] text-[#8FA894]">
                  22 mm rain forecast • "Wait & Reassess" • 16,500 L deferred (₹165 saved)
                </div>
              </div>
            </button>

            {/* Preset 2: Severe Tank Deficit */}
            <button
              type="button"
              onClick={() => onSelectPreset('preset_resource_deficit')}
              className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-start gap-2.5 ${
                activePresetId === 'preset_resource_deficit'
                  ? 'bg-[#C2410C]/20 border-[#C2410C] text-[#FDBA74] shadow-sm shadow-[#C2410C]/20'
                  : 'bg-[#1B2720]/80 border-[#2A3E31] text-[#E4EBE0] hover:border-[#C2410C]/50'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>Scenario B: Severe Tank Deficit</span>
                  {activePresetId === 'preset_resource_deficit' && (
                    <Check className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  36.5°C heat, 800 L tank vs 3,300 L demand • Stress in 20h
                </div>
              </div>
            </button>

            {/* What-If Simulation Levers Switch */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Real-Time What-If Sliders</span>
              </span>
              <button
                type="button"
                onClick={() => onToggleSimulation(!isSimulating)}
                className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                  isSimulating
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {isSimulating ? 'Visible' : 'Hidden'}
              </button>
            </div>

            {/* Exit Demo / Restore Custom Farm */}
            {isViewingPreset && (
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { onExitDemo(); }}
                  className="w-full py-2 px-3 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return to My Real Saved Farm</span>
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Minimized Dock Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-3 py-2 rounded-full border shadow-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer backdrop-blur-md ${
            isViewingPreset
              ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>
            {isViewingPreset 
              ? 'Simulating Demo Scenario' 
              : 'Demo Sandbox'}
          </span>
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

    </div>
  );
}
