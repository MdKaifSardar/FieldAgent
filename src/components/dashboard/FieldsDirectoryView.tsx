'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../common/LanguageContext';
import { FarmProfile, StorageTier } from '../../types/farm';
import { IndiaFleetOverviewMap } from './IndiaFleetOverviewMap';
import { 
  localizeCrop, 
  localizeSoil, 
  localizeGrowthStage, 
  localizeLocation, 
  localizeStorageType, 
  localizeFieldTitle 
} from '../../utils/agriculturalLocalization';
import { 
  Search, 
  Plus, 
  MapPin, 
  Droplets, 
  Sprout, 
  Layers, 
  Trash2, 
  Edit3, 
  ArrowRight, 
  Zap, 
  Cylinder, 
  Waves,
  AlertCircle
} from 'lucide-react';

interface FieldsDirectoryViewProps {
  parcels: FarmProfile[];
  activeParcelId: string | null;
  onSelectParcel: (parcelId: string) => void;
  onNavigateToAdvisory?: () => void;
  onNavigateToCockpit?: () => void;
  onOpenNewParcelWizard: () => void;
  onEditParcel: (parcel: FarmProfile) => void;
  onDeleteParcel: (parcelId: string) => void;
}

export function FieldsDirectoryView({
  parcels,
  activeParcelId,
  onSelectParcel,
  onNavigateToAdvisory,
  onNavigateToCockpit,
  onOpenNewParcelWizard,
  onEditParcel,
  onDeleteParcel,
}: FieldsDirectoryViewProps) {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStorage, setFilterStorage] = useState<string>('all');

  const handleOpenAdvisory = () => {
    if (onNavigateToAdvisory) {
      onNavigateToAdvisory();
    } else if (onNavigateToCockpit) {
      onNavigateToCockpit();
    }
  };

  // Filter parcels
  const filteredParcels = parcels.filter((farm) => {
    const searchLower = searchQuery.trim().toLowerCase();
    const matchesSearch = 
      !searchLower ||
      farm.farmName.toLowerCase().includes(searchLower) ||
      localizeFieldTitle(farm.farmName, language).toLowerCase().includes(searchLower) ||
      farm.location?.villageOrPincode?.toLowerCase().includes(searchLower) ||
      localizeLocation(farm.location?.villageOrPincode, language).toLowerCase().includes(searchLower) ||
      farm.plots?.some((p) => 
        p.cropName.toLowerCase().includes(searchLower) ||
        localizeCrop(p.cropName, language).toLowerCase().includes(searchLower)
      );

    const matchesStorage = 
      filterStorage === 'all' || 
      farm.reserve?.storageType === filterStorage;

    return matchesSearch && matchesStorage;
  });

  const getStorageBadge = (tier: StorageTier) => {
    switch (tier) {
      case 'borewell_hours':
        return { label: localizeStorageType('borewell_hours', language), icon: <Waves className="w-3.5 h-3.5 text-blue-500" /> };
      case 'custom_sump':
        return { label: localizeStorageType('custom_sump', language), icon: <Droplets className="w-3.5 h-3.5 text-cyan-500" /> };
      case 'sintex_tank':
      default:
        return { label: localizeStorageType('sintex_tank', language), icon: <Cylinder className="w-3.5 h-3.5 text-amber-500" /> };
    }
  };

  const totalAggregateAreaM2 = useMemo(() => {
    return parcels.reduce((acc, farm) => {
      const farmPlotsArea = (farm.plots || []).reduce((pAcc, plot) => {
        return pAcc + (plot.area_sq_meters || (plot.areaValue ? plot.areaValue * 1338 : 0));
      }, 0);
      return acc + farmPlotsArea;
    }, 0);
  }, [parcels]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Pan-India Command Fleet Map */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0D2232] border border-[#E1E8DE] dark:border-[#16364D] shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Title, Subtitle, Stats, and Action Button */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                  {language === 'bn' ? 'জাতীয় কৃষি বহর' : language === 'hi' ? 'अखिल भारतीय खेत बेड़ा' : 'National Agricultural Fleet'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] mt-1">
                {t.myFieldsDirectory}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] mt-1 max-w-xl leading-relaxed">
                {t.fieldsDirectorySubtitle}
              </p>
            </div>

            {/* Quick Stat Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0A1C2A] border border-slate-200 dark:border-[#16364D] text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1.5 font-mono">
                <Layers className="w-3.5 h-3.5 text-sky-500" />
                <span>{parcels.length} {language === 'bn' ? 'টি জমি' : language === 'hi' ? 'खेत' : 'Parcels'}</span>
              </span>

              <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0A1C2A] border border-slate-200 dark:border-[#16364D] text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1.5 font-mono">
                <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {Math.round((totalAggregateAreaM2 / 1338) * 10) / 10} {t.unitBigha} ({Math.round((totalAggregateAreaM2 / 4047) * 10) / 10} {t.unitAcre})
                </span>
              </span>

              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 font-mono">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === 'bn' ? '১০০% সেন্সর সক্রিয়' : language === 'hi' ? '100% सेंसर सक्रिय' : 'Live Telemetry Active'}</span>
              </span>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenNewParcelWizard}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.registerNewField}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Pan-India Map Radar */}
          <div className="lg:col-span-5 xl:col-span-4">
            <IndiaFleetOverviewMap
              parcels={parcels}
              activeParcelId={activeParcelId}
              onSelectParcel={onSelectParcel}
              onNavigateToAdvisory={handleOpenAdvisory}
            />
          </div>
        </div>
      </div>

      {/* 2. Search & Storage Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchFieldPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-[#0D2232] border border-[#E1E8DE] dark:border-[#16364D] text-xs text-slate-800 dark:text-[#F0F9FF] placeholder-slate-400 focus:outline-hidden focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: t.allWaterSupplies },
            { id: 'borewell_hours', label: t.filterBorewell },
            { id: 'custom_sump', label: t.filterPondSump },
            { id: 'sintex_tank', label: t.filterTank },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStorage(tab.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterStorage === tab.id
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-[#0D2232] border border-[#E1E8DE] dark:border-[#16364D] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0A1C2A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Empty State */}
      {filteredParcels.length === 0 && (
        <div className="py-16 px-4 text-center bg-white dark:bg-[#0D2232] border border-[#E1E8DE] dark:border-[#16364D] rounded-xl shadow-xs">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-slate-100 dark:bg-[#0A1C2A] flex items-center justify-center text-slate-400">
            <Layers className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-[#F0F9FF] mb-1">
            {parcels.length === 0 ? t.noFieldsRegistered : t.noMatchingFields}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            {parcels.length === 0 ? t.noFieldsSub : t.noMatchingSub}
          </p>
          {parcels.length === 0 && (
            <button
              type="button"
              onClick={onOpenNewParcelWizard}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.configureFirstField}</span>
            </button>
          )}
        </div>
      )}

      {/* 4. Field Parcels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredParcels.map((farm) => {
          const isSelected = activeParcelId === farm.id;
          const storageInfo = getStorageBadge(farm.reserve?.storageType || 'sintex_tank');
          const capacity = farm.reserve?.totalCapacity_liters || 0;
          const available = farm.reserve?.currentAvailable_liters || 0;
          const percent = capacity > 0 ? Math.min(100, Math.round((available / capacity) * 100)) : 0;
          const localizedTitle = localizeFieldTitle(farm.farmName, language);
          const localizedLoc = localizeLocation(farm.location?.villageOrPincode, language);

          const totalFarmAreaM2 = farm.plots?.reduce((sum, p) => sum + (p.area_sq_meters || 0), 0) || 0;
          const totalBigha = (totalFarmAreaM2 / 1338.0).toFixed(1);
          const totalAcres = (totalFarmAreaM2 / 4046.86).toFixed(1);

          return (
            <div
              key={farm.id}
              className={`p-5 rounded-xl bg-white dark:bg-[#0D2232] border transition-all flex flex-col justify-between shadow-xs ${
                isSelected
                  ? 'border-sky-500 ring-2 ring-sky-500/20'
                  : 'border-[#E1E8DE] dark:border-[#16364D] hover:border-slate-300 dark:hover:border-sky-500/40'
              }`}
            >
              <div>
                {/* Top header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-base text-slate-900 dark:text-[#F0F9FF] truncate font-['Outfit']">
                        {localizedTitle}
                      </h2>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{localizedLoc}</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditParcel(farm)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0A1C2A] transition-colors cursor-pointer"
                      title={t.editFieldConfig}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${farm.farmName}? This will remove its DynamoDB records.`)) {
                          onDeleteParcel(farm.id);
                        }
                      }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title={t.deleteFieldParcel}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Crop & Soil tags (Approach A: Every plot receives an equal badge) */}
                <div className="flex flex-wrap gap-1.5 my-3">
                  {farm.plots?.map((plot) => (
                    <span
                      key={plot.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800/40"
                    >
                      <Sprout className="w-3.5 h-3.5" />
                      <span>
                        {localizeCrop(plot.cropName, language)} ({plot.areaValue} {plot.areaUnit === 'bigha' ? t.unitBigha : plot.areaUnit === 'acre' ? t.unitAcre : plot.areaUnit}) • {localizeGrowthStage(plot.growthStage, language)}
                      </span>
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#0A1C2A] text-slate-600 dark:text-slate-300 font-medium text-xs">
                    {localizeSoil(farm.soil?.texture, language)}
                  </span>
                </div>

                {/* Dedicated Water Reserve Gauge */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0A1C2A]/70 border border-slate-100 dark:border-[#16364D] my-3">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      {storageInfo.icon}
                      {storageInfo.label}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-[#F0F9FF]">
                      {available.toLocaleString()} / {capacity.toLocaleString()} L
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all rounded-full ${
                        percent < 25 ? 'bg-amber-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Card Launch Action */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#16364D] flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {farm.plots?.length || 1} {farm.plots?.length === 1 ? t.plotCountSingular : t.plotCountPlural} • {t.totalFarmArea}: {totalBigha} {t.unitBigha} ({totalAcres} {t.unitAcre})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectParcel(farm.id);
                    handleOpenAdvisory();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-sky-500 hover:bg-sky-600 text-white dark:text-slate-950 hover:text-white dark:hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>{t.openAdvisory}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
