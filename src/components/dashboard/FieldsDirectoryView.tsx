'use client';

import React, { useState } from 'react';
import { useLanguage } from '../common/LanguageContext';
import { FarmProfile, StorageTier } from '../../types/farm';
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
  onNavigateToCockpit: () => void;
  onOpenNewParcelWizard: () => void;
  onEditParcel: (parcel: FarmProfile) => void;
  onDeleteParcel: (parcelId: string) => void;
}

export function FieldsDirectoryView({
  parcels,
  activeParcelId,
  onSelectParcel,
  onNavigateToCockpit,
  onOpenNewParcelWizard,
  onEditParcel,
  onDeleteParcel,
}: FieldsDirectoryViewProps) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStorage, setFilterStorage] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter parcels
  const filteredParcels = parcels.filter((farm) => {
    const matchesSearch = 
      farm.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.location?.villageOrPincode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.plots?.some((p) => p.cropName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStorage = 
      filterStorage === 'all' || 
      farm.reserve?.storageType === filterStorage;

    return matchesSearch && matchesStorage;
  });

  const getStorageBadge = (tier: StorageTier) => {
    switch (tier) {
      case 'borewell_hours':
        return { label: 'Borewell / Tubewell', icon: <Waves className="w-3.5 h-3.5 text-blue-500" /> };
      case 'custom_sump':
        return { label: 'Masonry Sump / Pond', icon: <Droplets className="w-3.5 h-3.5 text-cyan-500" /> };
      case 'sintex_tank':
      default:
        return { label: 'Overhead Tank (Sintex)', icon: <Cylinder className="w-3.5 h-3.5 text-amber-500" /> };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Search Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">
            {language === 'hi' ? 'खेत निर्देशिका' : language === 'bn' ? 'জমির ডিরেক্টরি' : 'My Fields Directory'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'hi' 
              ? 'सभी पंजीकृत खेत, फसलें एवं उनके समर्पित जल स्रोतों का प्रबंधन करें'
              : 'Manage all your agricultural parcels, independent water supplies and crop stages'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewParcelWizard}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'hi' ? 'नया खेत जोड़ें' : 'Register New Field'}</span>
        </button>
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
            placeholder={language === 'hi' ? 'खेत, फसल या स्थान खोजें...' : 'Search field by name, crop or village...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Water Supplies' },
            { id: 'borewell_hours', label: 'Borewell' },
            { id: 'custom_sump', label: 'Pond / Sump' },
            { id: 'sintex_tank', label: 'Tank' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStorage(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterStorage === tab.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Empty State */}
      {filteredParcels.length === 0 && (
        <div className="py-16 px-4 text-center bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] rounded-3xl shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Layers className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
            {parcels.length === 0 ? 'No Fields Registered Yet' : 'No Matching Fields Found'}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            {parcels.length === 0 
              ? 'Get started by configuring your first field parcel with location, crop, and dedicated water reserve.'
              : 'Try searching with a different name, crop, or change the water supply filter.'}
          </p>
          {parcels.length === 0 && (
            <button
              type="button"
              onClick={onOpenNewParcelWizard}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Configure First Field</span>
            </button>
          )}
        </div>
      )}

      {/* 4. Field Parcels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredParcels.map((farm) => {
          const isSelected = activeParcelId === farm.id;
          const storageInfo = getStorageBadge(farm.reserve?.storageType || 'sintex_tank');
          const primaryPlot = farm.plots?.[0];
          const capacity = farm.reserve?.totalCapacity_liters || 0;
          const available = farm.reserve?.currentAvailable_liters || 0;
          const percent = capacity > 0 ? Math.min(100, Math.round((available / capacity) * 100)) : 0;

          return (
            <div
              key={farm.id}
              className={`p-5 rounded-3xl bg-white dark:bg-[#141D17] border transition-all flex flex-col justify-between shadow-xs ${
                isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-[#E1E8DE] dark:border-[#1F2D24] hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Top header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-base text-slate-900 dark:text-white truncate font-['Outfit']">
                        {farm.farmName}
                      </h2>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{farm.location?.villageOrPincode || 'Location Set'}</span>
                    </div>
                  </div>

                  {/* Actions dropdown/buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditParcel(farm)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Field Configuration"
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete Field Parcel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Crop & Soil tags */}
                <div className="flex flex-wrap gap-1.5 my-3">
                  {primaryPlot && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800/40">
                      <Sprout className="w-3.5 h-3.5" />
                      {primaryPlot.cropName} ({primaryPlot.areaValue} {primaryPlot.areaUnit})
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs">
                    {farm.soil?.texture || 'Loamy Soil'}
                  </span>
                </div>

                {/* Dedicated Water Reserve Gauge */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 my-3">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      {storageInfo.icon}
                      {storageInfo.label}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {available.toLocaleString()} / {capacity.toLocaleString()} L
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all rounded-full ${
                        percent < 25 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Card Launch Action */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {farm.plots?.length || 1} Plot • {primaryPlot?.growthStage || 'Growing'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectParcel(farm.id);
                    onNavigateToCockpit();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white dark:text-slate-900 hover:text-white dark:hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Open Cockpit</span>
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
