'use client';

import React from 'react';
import { useLanguage } from '../common/LanguageContext';
import { AuthSession } from '../../adapters/cognitoAdapter';
import { FarmProfile } from '../../types/farm';
import { 
  User, 
  Layers, 
  Droplets, 
  Plus, 
  MapPin, 
  Sprout, 
  Phone, 
  Mail,
  Calendar,
  ChevronRight
} from 'lucide-react';

interface ProfileOverviewViewProps {
  authSession: AuthSession | null;
  parcels: FarmProfile[];
  activeParcel: FarmProfile | null;
  onSelectParcel: (parcelId: string) => void;
  onNavigateToFields: () => void;
  onNavigateToAdvisory?: () => void;
  onNavigateToCockpit?: () => void;
  onOpenNewParcelWizard: () => void;
}

export function ProfileOverviewView({
  authSession,
  parcels,
  activeParcel,
  onSelectParcel,
  onNavigateToFields,
  onNavigateToAdvisory,
  onNavigateToCockpit,
  onOpenNewParcelWizard,
}: ProfileOverviewViewProps) {
  const { language } = useLanguage();

  const handleOpenAdvisory = () => {
    if (onNavigateToAdvisory) {
      onNavigateToAdvisory();
    } else if (onNavigateToCockpit) {
      onNavigateToCockpit();
    }
  };

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
      <div className="p-6 sm:p-7 rounded-xl bg-white dark:bg-[#0D2232] border border-[#E1E8DE] dark:border-[#16364D] shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-xs shrink-0">
              {authSession?.displayName?.charAt(0).toUpperCase() || <User className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
                  {authSession?.displayName || (language === 'hi' ? 'किसान खाता' : 'Farmer Account')}
                </h1>
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
              className="px-4 py-2.5 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'hi' ? 'नया खेत जोड़ें' : 'Register New Field'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Portfolio Aggregate KPIs (Clean 3-Card Agricultural Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Metric 1: Total Managed Area */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0D2232] border border-[#E1E8DE] dark:border-[#16364D] shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
            <Sprout className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {language === 'hi' ? 'कुल सिंचित भूमि' : 'Total Farm Land'}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
              {totalBigha}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Bigha ({totalAcres} Acre)
            </span>
          </div>
        </div>

        {/* Metric 2: Registered Parcels Count */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0D2232] border border-[#E1E8DE] dark:border-[#16364D] shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-2.5">
            <Layers className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {language === 'hi' ? 'पंजीकृत खेत' : 'Registered Fields'}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
              {parcels.length}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {parcels.length === 1 ? 'Parcel' : 'Parcels'}
            </span>
          </div>
        </div>

        {/* Metric 3: Total Water Infrastructure */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0D2232] border border-[#E1E8DE] dark:border-[#16364D] shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2.5">
            <Droplets className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {language === 'hi' ? 'जल स्रोत क्षमता' : 'Water Infrastructure'}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
              {totalWaterCapacityLiters > 0 ? (totalWaterCapacityLiters / 1000).toFixed(0) : '0'}k
            </span>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
              Litres Capacity
            </span>
          </div>
        </div>
      </div>

      {/* 3. My Fields Directory Access Banner */}
      <div 
        onClick={onNavigateToFields}
        className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#0D2232] border border-[#E1E8DE] dark:border-[#16364D] shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
                {language === 'hi' ? 'खेत निर्देशिका' : 'My Fields Directory'}
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#112B3E] text-slate-600 dark:text-slate-300">
                {parcels.length} {parcels.length === 1 ? 'Field' : 'Fields'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'hi' 
                ? 'अपने सभी पंजीकृत खेतों, फसल किस्मों और समर्पित जल स्रोतों को एक साथ प्रबंधित करें।' 
                : 'Inspect and manage all your registered agricultural parcels, crop stages, and independent water sources.'}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-emerald-500 dark:group-hover:text-slate-950 font-bold text-xs transition-colors shrink-0 self-start sm:self-auto">
          <span>Open Directory</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* 4. Registered Fields Fast Grid (Direct Parcel Access to Advisory) */}
      {parcels.length > 0 && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#0D2232] border border-[#E1E8DE] dark:border-[#16364D] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
                {language === 'hi' ? 'आपके पंजीकृत खेत' : 'Your Managed Parcels'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'hi' ? 'किसी भी खेत पर क्लिक करके सीधे उसकी सलाह और निर्णय देखें' : 'Click any parcel to instantly launch its advisory workspace'}
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToFields}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              {language === 'hi' ? 'सभी देखें' : 'View all fields'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {parcels.map((farm) => {
              const primaryCrop = farm.plots?.[0]?.cropName || 'Field Crop';
              const isSelected = activeParcel?.id === farm.id;

              return (
                <div
                  key={farm.id}
                  onClick={() => {
                    onSelectParcel(farm.id);
                    handleOpenAdvisory();
                  }}
                  className={`p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'border-sky-500 bg-sky-500/10 shadow-xs' 
                      : 'border-slate-200 dark:border-[#16364D] hover:border-slate-300 dark:hover:border-sky-500/40 bg-slate-50/50 dark:bg-[#0A1C2A]/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-[#F0F9FF] truncate">
                        {farm.farmName}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500 text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{farm.location?.villageOrPincode || 'Location Set'}</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 dark:border-[#16364D] flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {primaryCrop}
                    </span>
                    <span className="text-xs font-semibold text-sky-600 dark:text-[#38BDF8] flex items-center gap-0.5">
                      <span>Advisory</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
