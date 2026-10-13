'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../common/LanguageContext';
import { AuthSession } from '../../adapters/cognitoAdapter';
import { 
  Droplets, 
  CloudRain, 
  Cpu, 
  ShieldCheck, 
  Leaf, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  SlidersHorizontal,
  Zap,
  BarChart3,
  Server,
  Layers,
  Sparkles,
  ChevronRight,
  LogIn
} from 'lucide-react';

interface LandingPageProps {
  onOpenOnboarding: () => void;
  onExploreDashboard: () => void;
  hasCustomFarm: boolean;
  authSession?: AuthSession | null;
}

export function LandingPage({
  onOpenOnboarding,
  onExploreDashboard,
  hasCustomFarm,
  authSession = null,
}: LandingPageProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full flex flex-col space-y-16 sm:space-y-24 py-6 sm:py-12 fade-in">
      
      {/* 1. HERO SECTION */}
      <section className="relative max-w-5xl mx-auto px-4 text-center">
        
        {/* Challenge AI Telemetryadge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#52B788] border border-[#2D6A4F]/25 mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.trackBadge}</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#111C15] dark:text-[#ECF2EC] font-['Outfit'] leading-[1.15] max-w-4xl mx-auto">
          {t.heroHeadline}
        </h1>

        {/* Subtitle */}
        <p className="mt-5 sm:mt-6 text-base sm:text-lg lg:text-xl text-[#5A6B60] dark:text-[#8E9F93] max-w-2xl mx-auto leading-relaxed">
          {t.heroSubtitle}
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto">
          {authSession ? (
            <>
              <button
                type="button"
                onClick={hasCustomFarm ? onExploreDashboard : onOpenOnboarding}
                className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-xl bg-[#2D6A4F] hover:bg-[#23533E] text-white font-bold text-sm shadow-md shadow-[#2D6A4F]/20 transition-all transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{hasCustomFarm ? t.ctaDashboard : t.ctaConfigure}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenOnboarding}
                className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-white hover:bg-stone-50 dark:bg-[#121D16] dark:hover:bg-[#1A2A20] text-[#111C15] dark:text-[#ECF2EC] border border-[#E1E5DC] dark:border-[#1E2F24] font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <span>{hasCustomFarm ? t.ctaConfigureEdit : t.ctaEngine}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-xl bg-[#2D6A4F] hover:bg-[#23533E] text-white font-bold text-sm shadow-md shadow-[#2D6A4F]/20 transition-all transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Voice Registration</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-white hover:bg-stone-50 dark:bg-[#121D16] dark:hover:bg-[#1A2A20] text-[#111C15] dark:text-[#ECF2EC] border border-[#E1E5DC] dark:border-[#1E2F24] font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with OTP</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>

        {/* Stat Highlights Bar */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
          
          <div className="glass-panel p-4 rounded-xl border border-[#E1E5DC] dark:border-[#1E2F24]">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#2D6A4F] dark:text-[#52B788] font-['Outfit']">
              {t.statWaterTitle}
            </div>
            <div className="text-xs font-semibold text-[#111C15] dark:text-[#ECF2EC] mt-0.5">
              {t.statWaterLabel}
            </div>
            <div className="text-[11px] text-[#5A6B60] dark:text-[#8E9F93] mt-1">
              {t.statWaterSub}
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-[#E1E5DC] dark:border-[#1E2F24]">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0284C7] dark:text-[#38BDF8] font-['Outfit']">
              {t.statFaoTitle}
            </div>
            <div className="text-xs font-semibold text-[#111C15] dark:text-[#ECF2EC] mt-0.5">
              {t.statFaoLabel}
            </div>
            <div className="text-[11px] text-[#5A6B60] dark:text-[#8E9F93] mt-1">
              {t.statFaoSub}
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-[#E1E5DC] dark:border-[#1E2F24]">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#D97706] dark:text-[#F59E0B] font-['Outfit']">
              {t.statIotTitle}
            </div>
            <div className="text-xs font-semibold text-[#111C15] dark:text-[#ECF2EC] mt-0.5">
              {t.statIotLabel}
            </div>
            <div className="text-[11px] text-[#5A6B60] dark:text-[#8E9F93] mt-1">
              {t.statIotSub}
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-[#E1E5DC] dark:border-[#1E2F24]">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#2D6A4F] dark:text-[#52B788] font-['Outfit']">
              {t.statSyncTitle}
            </div>
            <div className="text-xs font-semibold text-[#111C15] dark:text-[#ECF2EC] mt-0.5">
              {t.statSyncLabel}
            </div>
            <div className="text-[11px] text-[#5A6B60] dark:text-[#8E9F93] mt-1">
              {t.statSyncSub}
            </div>
          </div>

        </div>

      </section>

      {/* 2. THE PROBLEM VS SOLUTION COMPARISON */}
      <section className="max-w-5xl mx-auto px-4 w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-['Outfit']">
            Moving From Habitual Pumping to Predictive Resilience
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Why traditional guesswork depletes Indian aquifers while precision scheduling ensures crop survival.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Traditional Practice */}
          <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm mb-3">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Conventional Practice (Guesswork)</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>Blind Pumping:</strong> Farmers irrigate because the electric grid happens to have power, even when rainfall is arriving within 24 hours.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>Root Nutrient Leaching:</strong> Excessive water forces fertilizer past the root zone into deep aquifers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>Pump Dry-Run Motor Damage:</strong> Running submersible pumps when groundwater head or sumps are inadequate.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 font-semibold">
              Outcome: Aquifer depletion, high electricity tariffs, and root rot.
            </div>
          </div>

          {/* FieldGuard Decision Engine */}
          <div className="p-6 rounded-2xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>FieldGuard Precision Engine</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Dynamic Rain Credit:</strong> Quantifies incoming precipitation probability and defers irrigation if rain satisfies root deficit.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Targeted Depletion Window:</strong> Irrigates only when moisture drops below crop threshold ($RAW$), saving up to 40% volume.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Sump Volume Feasibility:</strong> Checks available liters against motor HP flow rate to prevent dry-run burnout.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
              Outcome: 16,500 L groundwater saved, zero crop stress, lower electricity bill.
            </div>
          </div>

        </div>
      </section>

      {/* 3. CORE TECHNICAL PILLARS */}
      <section className="max-w-5xl mx-auto px-4 w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-['Outfit']">
            Four Scientific Pillars Behind Every Decision
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Combining international agricultural physics with local Indian agrarian parameters.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                <CloudRain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit'] mb-2">
                Hyper-Local Climate
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Connects to Open-Meteo GPS grid for temperature, humidity, wind velocity, and solar radiation without local weather stations.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
              Penman-Monteith ET0
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit'] mb-2">
                Soil Water Dynamics
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Calibrated against texture curves (Black Clay, Loam, Sandy Loam) with specific AWC capacities (90–180 mm/m).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              RAW = p × TAW Model
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Droplets className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit'] mb-2">
                Reservoir Feasibility
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Evaluates sump, Sintex tank, and farm pond geometries to guarantee required irrigation liters exist before pumping begins.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-amber-600 dark:text-amber-400">
              Pump Cavitation Check
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit'] mb-2">
                Emissions & Cost Ledger
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Directly computes pumping kilowatt-hours saved, greenhouse gas reduction in kg CO₂, and electricity tariff savings in Rupees.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
              DynamoDB Audit Trail
            </div>
          </div>

        </div>
      </section>

      {/* 4. AWS ARCHITECTURE OVERVIEW */}
      <section className="max-w-5xl mx-auto px-4 w-full">
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-100/60 to-slate-200/40 dark:from-slate-900/60 dark:to-slate-950/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" />
                AWS Cloud Integration
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-['Outfit'] mt-1">
                Enterprise Cloud Scalability on Free Tier Footprint
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Region: ap-south-1 (Mumbai)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31]">
              <div className="font-bold text-[#121C15] dark:text-[#F0F4F1] mb-1 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-[#D97706]" />
                <span>AWS DynamoDB</span>
              </div>
              <p className="text-[#4D6653] dark:text-[#8FA894]">
                Single-digit millisecond latency storage for parcel geometries (FieldGuard-Farms) and decision logs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31]">
              <div className="font-bold text-[#121C15] dark:text-[#F0F4F1] mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0284C7]" />
                <span>Amazon Cognito</span>
              </div>
              <p className="text-[#4D6653] dark:text-[#8FA894]">
                Passwordless 6-digit OTP verification for farmers and agricultural advisors without credentials risk.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31]">
              <div className="font-bold text-[#121C15] dark:text-[#F0F4F1] mb-1 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#16A34A]" />
                <span>Serverless Microservices</span>
              </div>
              <p className="text-[#4D6653] dark:text-[#8FA894]">
                Stateless FAO-56 execution engine ready for AWS Lambda deployment with zero idle cost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FINAL CALL TO ACTION */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-[#16A34A]/30 relative overflow-hidden bg-gradient-to-b from-white/80 to-[#F0F4ED]/60 dark:from-[#141D17] dark:to-[#0D1310]">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#121C15] dark:text-[#F0F4F1] font-['Outfit'] mb-3">
            Equip Your Field for Seasonal Heat & Water Resilience
          </h3>
          <p className="text-sm sm:text-base text-[#4D6653] dark:text-[#8FA894] max-w-lg mx-auto mb-8">
            Configure your location, soil texture, crop stage, and tank capacity in under 2 minutes.
          </p>

          {authSession ? (
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="min-h-[48px] px-8 py-3.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm shadow-lg shadow-[#16A34A]/25 transition-all transform hover:scale-[1.02] cursor-pointer inline-flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{hasCustomFarm ? 'Configure Field Parcel' : 'Start Free Field Setup'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/register"
              className="min-h-[48px] px-8 py-3.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm shadow-lg shadow-[#16A34A]/25 transition-all transform hover:scale-[1.02] cursor-pointer inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Voice Registration & Setup</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </section>

    </div>
  );
}
