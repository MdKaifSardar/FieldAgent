'use client';

import React from 'react';
import { DecisionResponse } from '../types/decision';
import { useLanguage } from './common/LanguageContext';
import { AudioAdvisoryButton } from './decision/AudioAdvisoryButton';
import { CloudRain, AlertOctagon, CheckCircle2, Clock, ShieldCheck, Database } from 'lucide-react';

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
        subtitle: t.waitSubtitle,
        bgColor: 'bg-emerald-50/40 dark:bg-[#0D2232]',
        borderColor: 'border-emerald-200 dark:border-[#16364D]',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        iconBg: 'bg-emerald-600 text-white',
        icon: <CloudRain className="w-5 h-5 text-white" />,
        shadowGlow: 'shadow-xs',
        variant: 'leaf' as const,
      }
    : isDeficit
    ? {
        title: t.resourceDeficit,
        subtitle: t.deficitSubtitle,
        bgColor: 'bg-amber-50/40 dark:bg-[#0D2232]',
        borderColor: 'border-amber-200 dark:border-[#16364D]',
        textColor: 'text-amber-700 dark:text-amber-400',
        iconBg: 'bg-amber-600 text-white',
        icon: <AlertOctagon className="w-5 h-5 text-white" />,
        shadowGlow: 'shadow-xs',
        variant: 'terracotta' as const,
      }
    : {
        title: t.irrigateNow,
        subtitle: t.irrigateSubtitle,
        bgColor: 'bg-sky-50/40 dark:bg-[#0D2232]',
        borderColor: 'border-sky-200 dark:border-[#16364D]',
        textColor: 'text-sky-700 dark:text-[#38BDF8]',
        iconBg: 'bg-sky-600 text-white',
        icon: <CheckCircle2 className="w-5 h-5 text-white" />,
        shadowGlow: 'shadow-xs',
        variant: 'water' as const,
      };

  const primaryPlot = decision.plots[0];

  return (
    <div className={`h-full flex flex-col justify-between p-4 sm:p-5 rounded-xl border ${badgeConfig.borderColor} ${badgeConfig.bgColor} ${badgeConfig.shadowGlow} transition-all`}>
      {/* Top Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E8DE] dark:border-[#16364D] pb-3.5 mb-3.5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${badgeConfig.iconBg} shadow-xs shrink-0`}>
              {badgeConfig.icon}
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${badgeConfig.textColor}`}>
                {badgeConfig.subtitle}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] tracking-tight">
                {badgeConfig.title}
              </h2>
            </div>
          </div>

          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-white dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] text-slate-600 dark:text-slate-300 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{decision.actionWindow}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-white dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] text-slate-600 dark:text-slate-300 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.confidence}: {decision.confidence}</span>
            </div>
          </div>
        </div>

        {/* Primary Action Explanation */}
        <p className="text-base sm:text-lg text-slate-800 dark:text-[#F0F9FF] leading-relaxed font-medium mb-3.5">
          {localizedAction}
        </p>

        {/* Audio Read-Aloud Button */}
        <div className="pt-0.5 mb-3.5">
          <AudioAdvisoryButton 
            advisoryText={decision.advisoryText} 
            cropName={primaryPlot?.cropName || 'Crop'} 
            variant={badgeConfig.variant}
          />
        </div>
      </div>

      {/* Agronomic Technical Trace */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#94A3B8] pt-3 border-t border-[#E1E8DE] dark:border-[#16364D] mt-auto">
        <div className="flex items-center gap-2">
          <span>{t.reasoning}: {decision.confidenceReason}</span>
        </div>
        <div className="flex items-center gap-3">
          {primaryPlot && (
            <span className="text-sky-600 dark:text-[#38BDF8] font-mono">
              {t.method}: {(primaryPlot.irrigationMethod || 'surface_flood').toUpperCase()} (Eff: {Math.round((primaryPlot.irrigationEfficiency || 0.75) * 100)}%)
            </span>
          )}
          <span className="flex items-center gap-1 text-slate-400 dark:text-slate-400 font-mono text-[11px]">
            <Database className="w-3 h-3 text-sky-500" /> {decision.metadata.engineVersion}
          </span>
        </div>
      </div>
    </div>
  );
}
