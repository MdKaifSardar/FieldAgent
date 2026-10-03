'use client';

import React from 'react';
import { DecisionResponse } from '../types/decision';
import { CloudRain, AlertOctagon, CheckCircle2, Clock, ShieldCheck, Database } from 'lucide-react';

interface DecisionCardProps {
  decision: DecisionResponse;
}

export function DecisionCard({ decision }: DecisionCardProps) {
  const isWait = decision.decision === 'WAIT_AND_REASSESS';
  const isDeficit = decision.decision === 'RESOURCE_DEFICIT_ALERT';

  const badgeConfig = isWait
    ? {
        title: 'HOLD OFF IRRIGATION (WATER CONSERVED)',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/40',
        textColor: 'text-emerald-400',
        icon: <CloudRain className="w-6 h-6 text-emerald-400" />,
        shadowGlow: 'shadow-emerald-500/10',
      }
    : isDeficit
    ? {
        title: 'WATER RESERVE SHORTFALL DETECTED',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/40',
        textColor: 'text-rose-400',
        icon: <AlertOctagon className="w-6 h-6 text-rose-400" />,
        shadowGlow: 'shadow-rose-500/10',
      }
    : {
        title: 'IRRIGATION RECOMMENDED',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/40',
        textColor: 'text-blue-400',
        icon: <CheckCircle2 className="w-6 h-6 text-blue-400" />,
        shadowGlow: 'shadow-blue-500/10',
      };

  return (
    <div className={`glass-panel p-6 border ${badgeConfig.borderColor} ${badgeConfig.bgColor} shadow-xl ${badgeConfig.shadowGlow} transition-all`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
            {badgeConfig.icon}
          </div>
          <div>
            <span className={`text-xs font-bold uppercase tracking-widest ${badgeConfig.textColor}`}>
              Primary Recommendation
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-white font-['Outfit'] tracking-tight">
              {badgeConfig.title}
            </h2>
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900/80 border border-slate-700/60 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Window: {decision.actionWindow}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900/80 border border-slate-700/60 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Confidence: {decision.confidence}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Explanation */}
      <div className="space-y-3">
        <p className="text-base text-slate-200 leading-relaxed font-normal">
          {decision.primaryAction}
        </p>
        
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/40">
          <span>Reasoning: {decision.confidenceReason}</span>
          <span className="flex items-center gap-1 text-slate-500">
            <Database className="w-3 h-3 text-cyan-400" /> Engine: {decision.metadata.engineVersion}
          </span>
        </div>
      </div>
    </div>
  );
}
