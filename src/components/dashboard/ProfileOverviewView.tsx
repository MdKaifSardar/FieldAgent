'use client';

import React from 'react';
import { useLanguage } from '../common/LanguageContext';
import { AuthSession } from '../../adapters/cognitoAdapter';
import { FarmProfile } from '../../types/farm';
import { 
  User, 
  Layers, 
  Droplets, 
  ShieldCheck, 
  Plus, 
  ArrowRight, 
  MapPin, 
  Sprout, 
  Zap, 
  Phone, 
  Mail,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface ProfileOverviewViewProps {
  authSession: AuthSession | null;
  parcels: FarmProfile[];
  activeParcel: FarmProfile | null;
  onSelectParcel: (parcelId: string) => void;
  onNavigateToFields: () => void;
  onNavigateToCockpit: () => void;
  onOpenNewParcelWizard: () => void;
}

export function ProfileOverviewView({
  authSession,
  parcels,
  activeParcel,
  onSelectParcel,
  onNavigateToFields,
  onNavigateToCockpit,
  onOpenNewParcelWizard,
}: ProfileOverviewViewProps) {
  const { language } = useLanguage();

  // Calculate portfolio totals
  const totalAreaSqMeters = parcels.reduce((sum, farm) => {
    const farmPlotsArea = farm.plots?.reduce((pSum, plot) => pSum + (plot.area_sq_meters || 0), 0) || 0;
    return sum + farmPlotsArea;
  }, 0);

  const totalAcres = (totalAreaSqMeters / 4046.86).toFixed(1);
  const totalBigha = (totalAreaSqMeters / 1338.0).toFixed(1);

  // Dedicated water reserves summary
  const totalWaterCapacityLiters = parcels.reduce((sum, farm) => {
    return sum + (farm.reserve?.totalCapacity_liters || 0);
  }, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Identity & Account Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-md shrink-0">
              {authSession?.displayName?.charAt(0).toUpperCase() || <User className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">
                  {authSession?.displayName || (language === 'hi' ? 'किसान खाता' : 'Farmer Account')}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Cognito Verified
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400">
                {authSession?.emailOrPhone && (
                  <span className="flex items-center gap-1.5">
                    {authSession.emailOrPhone.includes('@') ? (
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    {authSession.emailOrPhone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Cloud Session Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenNewParcelWizard}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'hi' ? 'नया खेत जोड़ें' : 'Register New Field'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Portfolio Aggregate KPIs (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Managed Area */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
            <Sprout className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {language === 'hi' ? 'कुल सिंचित भूमि' : 'Total Farm Land'}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">
              {totalBigha}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Bigha ({totalAcres} Acre)
            </span>
          </div>
        </div>

        {/* Registered Parcels Count */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5">
            <Layers className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {language === 'hi' ? 'पंजीकृत खेत' : 'Registered Fields'}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">
              {parcels.length}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {parcels.length === 1 ? 'Parcel' : 'Parcels'}
            </span>
          </div>
        </div>

        {/* Total Water Infrastructure */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2.5">
            <Droplets className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {language === 'hi' ? 'जल स्रोत क्षमता' : 'Water Infrastructure'}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">
              {totalWaterCapacityLiters > 0 ? (totalWaterCapacityLiters / 1000).toFixed(0) : '0'}k
            </span>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
              Litres Capacity
            </span>
          </div>
        </div>

        {/* Cloud Architecture Status */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {language === 'hi' ? 'क्लाउड सिंक' : 'Cloud Sync Engine'}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400 font-['Outfit']">
              DynamoDB
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-purple-100 dark:bg-purple-950/60 font-bold text-purple-700 dark:text-purple-300">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* 3. Fast Workspace Launchpad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Launchpad: Fields Directory */}
        <div 
          onClick={onNavigateToFields}
          className="p-6 rounded-3xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-sm hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                View Directory <ArrowRight className="w-4 h-4" />
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit'] mb-1">
              {language === 'hi' ? 'खेत निर्देशिका' : 'My Fields Directory'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {language === 'hi' 
                ? 'अपने सभी पंजीकृत खेतों, फसल किस्मों और समर्पित जल स्रोतों को एक साथ प्रबंधित करें।' 
                : 'Inspect and manage all your registered agricultural parcels, crop stages, and independent water sources.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>{parcels.length} {parcels.length === 1 ? 'Field Registered' : 'Fields Registered'}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Open Directory →</span>
          </div>
        </div>

        {/* Launchpad: Active Field Cockpit */}
        <div 
          onClick={() => {
            if (activeParcel) {
              onNavigateToCockpit();
            } else if (parcels.length > 0) {
              onSelectParcel(parcels[0].id);
              onNavigateToCockpit();
            } else {
              onOpenNewParcelWizard();
            }
          }}
          className="p-6 rounded-3xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-sm hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                {activeParcel ? 'Launch Cockpit' : 'Configure Field'} <ArrowRight className="w-4 h-4" />
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit'] mb-1">
              {language === 'hi' ? 'सिंचाई निर्णय केंद्र' : 'Irrigation Decision Cockpit'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {activeParcel 
                ? `Active: ${activeParcel.farmName}. Open-Meteo micro-climate sync, soil depletion tracking & Amazon Polly audio guidance.` 
                : 'No active parcel selected. Configure your field parcel to unlock precision FAO-56 irrigation decisions.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>{activeParcel ? activeParcel.farmName : 'No Active Parcel'}</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {activeParcel ? 'Enter Cockpit →' : 'Configure Now →'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Registered Fields Fast Grid (Preview) */}
      {parcels.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                {language === 'hi' ? 'आपके पंजीकृत खेत' : 'Your Managed Parcels'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'hi' ? 'किसी भी खेत पर क्लिक करके सीधे उसका निर्णय केंद्र खोलें' : 'Click any parcel to instantly launch its precision cockpit'}
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToFields}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {language === 'hi' ? 'सभी देखें →' : 'View All →'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {parcels.slice(0, 3).map((farm) => {
              const primaryCrop = farm.plots?.[0]?.cropName || 'Field Crop';
              const isSelected = activeParcel?.id === farm.id;

              return (
                <div
                  key={farm.id}
                  onClick={() => {
                    onSelectParcel(farm.id);
                    onNavigateToCockpit();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-xs' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {farm.farmName}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{farm.location?.villageOrPincode || 'Location Set'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {primaryCrop}
                    </span>
                    <span className="text-slate-400 group-hover:text-slate-600">
                      Cockpit →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
