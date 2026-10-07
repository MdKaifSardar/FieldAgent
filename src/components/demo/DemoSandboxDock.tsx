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
  isDemoModeActive: boolean;
  onToggleDemoMode: (active: boolean) => void;
  activePresetId: string | null;
  onSelectPreset: (presetId: string) => void;
  onExitDemo: () => void;
  hasCustomFarm: boolean;
  isSimulating: boolean;
  onToggleSimulation: (sim: boolean) => void;
}

export function DemoSandboxDock({
  isDemoModeActive,
  onToggleDemoMode,
  activePresetId,
  onSelectPreset,
  onExitDemo,
  hasCustomFarm,
  isSimulating,
  onToggleSimulation,
}: DemoSandboxDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isViewingPreset = activePresetId !== null && activePresetId.startsWith('preset_');

  const handleToggle = (checked: boolean) => {
    onToggleDemoMode(checked);
    if (!checked) {
      onExitDemo();
      onToggleSimulation(false);
    }
  };

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
                  <span>Hackathon Demo Sandbox</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    DEV ONLY
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Toggleable evaluation scenarios for demo video
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

          {/* Master Switch: Developer Demo Mode */}
          <div className="my-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">
                Prediction Testing Mode
              </div>
              <div className="text-[10px] text-slate-400">
                {isDemoModeActive 
                  ? 'Active: Video scenarios & simulation enabled' 
                  : 'Inactive: Clean production farmer experience'}
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isDemoModeActive}
              onClick={() => handleToggle(!isDemoModeActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isDemoModeActive ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isDemoModeActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Scenarios & Levers (Only accessible when Toggle Switch is ON) */}
          {isDemoModeActive ? (
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Deterministic Scenarios:</span>
                <span className="text-[10px] text-amber-400 font-normal">Instant Proof</span>
              </div>

              {/* Preset 1: Rain Avoidance */}
              <button
                type="button"
                onClick={() => onSelectPreset('preset_rain_avoidance')}
                className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-start gap-2.5 ${
                  activePresetId === 'preset_rain_avoidance'
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <CloudRain className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>Scenario A: Rain Avoidance</span>
                    {activePresetId === 'preset_rain_avoidance' && (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
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
                    ? 'bg-rose-950/50 border-rose-500 text-rose-200 shadow-sm shadow-rose-500/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
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
          ) : (
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-400">
              <p>Demo scenarios are currently disabled.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Toggle the switch above when recording your hackathon demo video to demonstrate live prediction changes.
              </p>
            </div>
          )}

          {/* Shortcut note */}
          <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 text-center">
            Dev shortcut: <kbd className="px-1 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">Ctrl</kbd> + <kbd className="px-1 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">Shift</kbd> + <kbd className="px-1 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">D</kbd>
          </div>

        </div>
      )}

      {/* Minimized Dock Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-3 py-2 rounded-full border shadow-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer backdrop-blur-md ${
            isDemoModeActive
              ? isViewingPreset
                ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>
            {isViewingPreset 
              ? 'Simulating Demo Scenario' 
              : isDemoModeActive 
                ? 'Demo Sandbox Active' 
                : 'Dev Mode'}
          </span>
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

    </div>
  );
}
