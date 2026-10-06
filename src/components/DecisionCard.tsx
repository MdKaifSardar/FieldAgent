'use client';

import React from 'react';
import { DecisionResponse } from '../types/decision';
import { useLanguage } from './common/LanguageContext';
import { AudioAdvisoryButton } from './decision/AudioAdvisoryButton';
import { CloudRain, AlertOctagon, CheckCircle2, Clock, ShieldCheck, Database, Droplets } from 'lucide-react';

interface DecisionCardProps {
  decision: DecisionResponse;
}

export function DecisionCard({ decision }: DecisionCardProps) {
  const { language, t } = useLanguage();
  const isWait = decision.decision === 'WAIT_AND_REASSESS';
  const isDeficit = decision.decision === 'RESOURCE_DEFICIT_ALERT';

  // Localized displayed action
  let localizedAction = decision.primaryAction;
  if (language === 'hi' && decision.advisoryText.hindi) {
    localizedAction = decision.advisoryText.hindi;
  } else if (language === 'bn' && decision.advisoryText.bengali) {
    localizedAction = decision.advisoryText.bengali;
  }

  const badgeConfig = isWait
    ? {
        title: t.waitAndReassess,
        subtitle: 'Water Conserved — Rain Incoming',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/40',
        textColor: 'text-emerald-400',
        icon: <CloudRain className="w-6 h-6 text-emerald-400" />,
        shadowGlow: 'shadow-emerald-500/10',
      }
    : isDeficit
    ? {
        title: t.resourceDeficit,
        subtitle: 'Available Storage Below Requirement',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/40',
        textColor: 'text-rose-400',
        icon: <AlertOctagon className="w-6 h-6 text-rose-400" />,
        shadowGlow: 'shadow-rose-500/10',
      }
    : {
        title: t.irrigateNow,
        subtitle: 'Depletion Near RAW Threshold',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/40',
        textColor: 'text-blue-400',
        icon: <CheckCircle2 className="w-6 h-6 text-blue-400" />,
        shadowGlow: 'shadow-blue-500/10',
      };

  const primaryPlot = decision.plots[0];

  return (
    <div className={`glass-panel p-5 sm:p-6 border ${badgeConfig.borderColor} ${badgeConfig.bgColor} shadow-xl ${badgeConfig.shadowGlow} transition-all`}>
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 shrink-0">
            {badgeConfig.icon}
          </div>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-widest ${badgeConfig.textColor}`}>
              {badgeConfig.subtitle}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
              {badgeConfig.title}
            </h2>
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900/80 border border-slate-700/60 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{decision.actionWindow}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900/80 border border-slate-700/60 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Confidence: {decision.confidence}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Explanation */}
      <div className="space-y-4">
        <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-medium">
          {localizedAction}
        </p>

        {/* Big Audio Read-Aloud Touch Button */}
        <div className="pt-1">
          <AudioAdvisoryButton 
            advisoryText={decision.advisoryText} 
            cropName={primaryPlot?.cropName || 'Crop'} 
          />
        </div>

        {/* Agronomic Technical Trace */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-3 border-t border-slate-800/50">
          <div className="flex items-center gap-2">
            <span>Reasoning: {decision.confidenceReason}</span>
          </div>
          <div className="flex items-center gap-3">
            {primaryPlot && (
              <span className="text-cyan-300 font-mono">
                Method: {(primaryPlot.irrigationMethod || 'surface_flood').toUpperCase()} (Eff: {Math.round((primaryPlot.irrigationEfficiency || 0.75) * 100)}%)
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
              <Database className="w-3 h-3 text-cyan-400" /> {decision.metadata.engineVersion}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
