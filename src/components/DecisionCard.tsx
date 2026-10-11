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
        subtitle: t.waitSubtitle,
        bgColor: 'bg-[#F2F7F4] dark:bg-[#122118]',
        borderColor: 'border-[#2D6A4F]/35 dark:border-[#2D6A4F]/50',
        textColor: 'text-[#2D6A4F] dark:text-[#52B788]',
        iconBg: 'bg-[#2D6A4F] text-white',
        icon: <CloudRain className="w-5 h-5 text-white" />,
        shadowGlow: 'shadow-md shadow-[#2D6A4F]/10',
      }
    : isDeficit
    ? {
        title: t.resourceDeficit,
        subtitle: t.deficitSubtitle,
        bgColor: 'bg-[#FDF4EE] dark:bg-[#251814]',
        borderColor: 'border-[#C2410C]/35 dark:border-[#C2410C]/50',
        textColor: 'text-[#C2410C] dark:text-[#FB923C]',
        iconBg: 'bg-[#C2410C] text-white',
        icon: <AlertOctagon className="w-5 h-5 text-white" />,
        shadowGlow: 'shadow-md shadow-[#C2410C]/10',
      }
    : {
        title: t.irrigateNow,
        subtitle: t.irrigateSubtitle,
        bgColor: 'bg-[#F0F7FB] dark:bg-[#0E1E28]',
        borderColor: 'border-[#0284C7]/35 dark:border-[#0284C7]/50',
        textColor: 'text-[#0284C7] dark:text-[#38BDF8]',
        iconBg: 'bg-[#0284C7] text-white',
        icon: <CheckCircle2 className="w-5 h-5 text-white" />,
        shadowGlow: 'shadow-md shadow-[#0284C7]/10',
      };

  const primaryPlot = decision.plots[0];

  return (
    <div className={`p-5 sm:p-6 rounded-2xl border ${badgeConfig.borderColor} ${badgeConfig.bgColor} ${badgeConfig.shadowGlow} transition-all`}>
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E5DC]/60 dark:border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${badgeConfig.iconBg} shadow-sm shrink-0`}>
            {badgeConfig.icon}
          </div>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-widest ${badgeConfig.textColor}`}>
              {badgeConfig.subtitle}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#111C15] dark:text-[#ECF2EC] font-['Outfit'] tracking-tight">
              {badgeConfig.title}
            </h2>
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-[#16251C] border border-[#E1E5DC] dark:border-[#253D2E] text-[#5A6B60] dark:text-[#8E9F93] shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#5A6B60] dark:text-[#8E9F93]" />
            <span>{decision.actionWindow}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-[#16251C] border border-[#E1E5DC] dark:border-[#253D2E] text-[#5A6B60] dark:text-[#8E9F93] shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
            <span>{t.confidence}: {decision.confidence}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Explanation */}
      <div className="space-y-4">
        <p className="text-base sm:text-lg text-[#111C15] dark:text-[#ECF2EC] leading-relaxed font-medium">
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
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5A6B60] dark:text-[#8E9F93] pt-3 border-t border-[#E1E5DC]/60 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span>{t.reasoning}: {decision.confidenceReason}</span>
          </div>
          <div className="flex items-center gap-3">
            {primaryPlot && (
              <span className="text-[#0284C7] dark:text-[#38BDF8] font-mono">
                {t.method}: {(primaryPlot.irrigationMethod || 'surface_flood').toUpperCase()} (Eff: {Math.round((primaryPlot.irrigationEfficiency || 0.75) * 100)}%)
              </span>
            )}
            <span className="flex items-center gap-1 text-[#5A6B60] dark:text-[#8E9F93] font-mono text-[11px]">
              <Database className="w-3 h-3 text-[#0284C7] dark:text-[#38BDF8]" /> {decision.metadata.engineVersion}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
