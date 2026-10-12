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
        bgColor: 'bg-[#F0F4ED] dark:bg-[#141D17]',
        borderColor: 'border-[#16A34A]/35 dark:border-[#16A34A]/50',
        textColor: 'text-[#16A34A] dark:text-[#4ADE80]',
        iconBg: 'bg-[#16A34A] text-white',
        icon: <CloudRain className="w-5 h-5 text-white" />,
        shadowGlow: 'shadow-md shadow-[#16A34A]/10',
        variant: 'leaf' as const,
      }
    : isDeficit
    ? {
        title: t.resourceDeficit,
        subtitle: t.deficitSubtitle,
        bgColor: 'bg-[#FFF7ED] dark:bg-[#1C1410]',
        borderColor: 'border-[#EA580C]/35 dark:border-[#EA580C]/50',
        textColor: 'text-[#C2410C] dark:text-[#FB923C]',
        iconBg: 'bg-[#C2410C] text-white',
        icon: <AlertOctagon className="w-5 h-5 text-white" />,
        shadowGlow: 'shadow-md shadow-[#EA580C]/10',
        variant: 'terracotta' as const,
      }
    : {
        title: t.irrigateNow,
        subtitle: t.irrigateSubtitle,
        bgColor: 'bg-[#F0F9FF] dark:bg-[#101A24]',
        borderColor: 'border-[#0284C7]/35 dark:border-[#0284C7]/50',
        textColor: 'text-[#0284C7] dark:text-[#38BDF8]',
        iconBg: 'bg-[#0284C7] text-white',
        icon: <CheckCircle2 className="w-5 h-5 text-white" />,
        shadowGlow: 'shadow-md shadow-[#0284C7]/10',
        variant: 'water' as const,
      };

  const primaryPlot = decision.plots[0];

  return (
    <div className={`p-5 sm:p-6 rounded-2xl border ${badgeConfig.borderColor} ${badgeConfig.bgColor} ${badgeConfig.shadowGlow} transition-all`}>
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E8DE] dark:border-[#2A3E31] pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${badgeConfig.iconBg} shadow-sm shrink-0`}>
            {badgeConfig.icon}
          </div>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-widest ${badgeConfig.textColor}`}>
              {badgeConfig.subtitle}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#121C15] dark:text-[#F0F4F1] font-['Outfit'] tracking-tight">
              {badgeConfig.title}
            </h2>
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] text-[#526356] dark:text-[#9BAEA0] shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#526356] dark:text-[#9BAEA0]" />
            <span>{decision.actionWindow}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] text-[#526356] dark:text-[#9BAEA0] shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
            <span>{t.confidence}: {decision.confidence}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Explanation */}
      <div className="space-y-4">
        <p className="text-base sm:text-lg text-[#121C15] dark:text-[#F0F4F1] leading-relaxed font-medium">
          {localizedAction}
        </p>

        {/* Big Audio Read-Aloud Touch Button */}
        <div className="pt-1">
          <AudioAdvisoryButton 
            advisoryText={decision.advisoryText} 
            cropName={primaryPlot?.cropName || 'Crop'} 
            variant={badgeConfig.variant}
          />
        </div>

        {/* Agronomic Technical Trace */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#526356] dark:text-[#9BAEA0] pt-3 border-t border-[#E1E8DE] dark:border-[#2A3E31]">
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
