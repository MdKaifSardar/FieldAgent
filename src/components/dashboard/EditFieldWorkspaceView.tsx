'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FarmProfile, 
  CropBlock,
  AreaUnit, 
  SoilTexture, 
  IrrigationMethod, 
  StorageTier,
  normalizeAreaToSqMeters, 
  calculateSumpVolumeLiters 
} from '../../types/farm';
import { 
  geocodeLocationQuery, 
  getDeviceCoordinates,
  fetchLocationSuggestions,
  LocationSuggestion
} from '../../adapters/geocodingAdapter';
import { useLanguage } from '../common/LanguageContext';
import { localizeCrop, localizeFieldTitle } from '../../utils/agriculturalLocalization';
import { 
  Sprout, 
  Droplets, 
  Layers, 
  MapPin, 
  AlertTriangle, 
  ArrowLeft, 
  Check, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Info, 
  Calculator, 
  Cylinder, 
  Waves,
  Calendar,
  Sparkles,
  ShieldAlert,
  Search,
  Loader2,
  X,
  Building2,
  Hash,
  Compass
} from 'lucide-react';
import { LocationMapPicker } from '../map/LocationMapPicker';

interface EditFieldWorkspaceViewProps {
  initialFarm: FarmProfile;
  onCancel: () => void;
  onSubmit: (farm: FarmProfile) => void;
  onDeleteParcel?: (parcelId: string) => void;
}

export function EditFieldWorkspaceView({
  initialFarm,
  onCancel,
  onSubmit,
  onDeleteParcel,
}: EditFieldWorkspaceViewProps) {
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'crops' | 'water' | 'soil' | 'geospatial' | 'danger'>('crops');

  // Working state initialized from initialFarm
  const [queryLocation, setQueryLocation] = useState(initialFarm.location.villageOrPincode || '');
  const [lat, setLat] = useState(initialFarm.location.latitude);
  const [lon, setLon] = useState(initialFarm.location.longitude);
  const [district, setDistrict] = useState(initialFarm.location.district || '');
  const [stateName, setStateName] = useState(initialFarm.location.state || '');

  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);

  // Instant Search-As-You-Type Autocomplete State
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search-as-you-type (280ms)
  useEffect(() => {
    const trimmed = queryLocation.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const results = await fetchLocationSuggestions(trimmed, language);
        setSuggestions(results);
        setIsDropdownOpen(results.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [queryLocation, language]);

  // Click-away listener to dismiss autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (sug: LocationSuggestion) => {
    setQueryLocation(sug.displayName);
    setLat(sug.latitude);
    setLon(sug.longitude);
    setDistrict(sug.district || 'Selected Region');
    setStateName(sug.state || 'India');
    setIsDropdownOpen(false);
    setLocationFeedback(sug.displayName);
  };

  const handleSearchLocation = async () => {
    if (!queryLocation.trim()) return;
    setIsSearchingLocation(true);
    setLocationFeedback(null);
    try {
      const res = await geocodeLocationQuery(queryLocation);
      if (res && res.location) {
        setLat(res.location.latitude);
        setLon(res.location.longitude);
        setDistrict(res.location.district || 'Identified District');
        setStateName(res.location.state || 'India');
        setLocationFeedback(res.location.displayName || `${res.location.latitude.toFixed(3)}, ${res.location.longitude.toFixed(3)}`);
      }
    } catch (e) {
      // Keep previous
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleGPSDetect = async () => {
    setIsLocatingGPS(true);
    setLocationFeedback(null);
    try {
      const coords = await getDeviceCoordinates();
      setLat(coords.lat);
      setLon(coords.lon);
      const res = await geocodeLocationQuery(`${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`);
      if (res && res.location) {
        setQueryLocation(res.location.villageOrPincode || res.location.displayName || '');
        setDistrict(res.location.district || 'Current Location');
        setStateName(res.location.state || 'India');
        setLocationFeedback(`${coords.lat.toFixed(4)}°, ${coords.lon.toFixed(4)}°`);
      }
    } catch (err) {
      // Keep previous coordinates
    } finally {
      setIsLocatingGPS(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearchLocation();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        handleSearchLocation();
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const [soilTexture, setSoilTexture] = useState<SoilTexture>(initialFarm.soil.texture);

  const [plots, setPlots] = useState<{
    id: string;
    cropName: string;
    growthStage: 'initial' | 'development' | 'mid_season' | 'late_season';
    areaValue: number;
    areaUnit: AreaUnit;
    irrigationMethod: IrrigationMethod;
  }[]>(
    initialFarm.plots.map((p, idx) => ({
      id: p.id || `plot-${idx + 1}`,
      cropName: p.cropName,
      growthStage: p.growthStage,
      areaValue: p.areaValue,
      areaUnit: p.areaUnit,
      irrigationMethod: p.irrigationMethod,
    }))
  );

  const [storageType, setStorageType] = useState<StorageTier>(initialFarm.reserve.storageType);
  const [tankCapacity, setTankCapacity] = useState(initialFarm.reserve.totalCapacity_liters);
  const [availableLiters, setAvailableLiters] = useState(initialFarm.reserve.currentAvailable_liters);
  const [sumpLength, setSumpLength] = useState(initialFarm.reserve.sumpDimensions?.length_m || 3.0);
  const [sumpWidth, setSumpWidth] = useState(initialFarm.reserve.sumpDimensions?.width_m || 2.0);
  const [sumpDepth, setSumpDepth] = useState(initialFarm.reserve.sumpDimensions?.waterDepth_m || 1.5);
  const [pumpHp, setPumpHp] = useState(initialFarm.reserve.pumpPower_hp || 5.0);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Agronomic parameters lookup helper
  const getCropAgronomicParams = (
    crop: string,
    stage: 'initial' | 'development' | 'mid_season' | 'late_season'
  ) => {
    let rootDepth_m = 0.6;
    let cropCoefficient_Kc = 1.05;
    let depletionFraction_p = 0.45;

    if (crop === 'Spinach') {
      rootDepth_m = 0.25;
      cropCoefficient_Kc = 1.00;
      depletionFraction_p = 0.35;
    } else if (crop === 'Wheat') {
      rootDepth_m = 0.70;
      cropCoefficient_Kc = stage === 'mid_season' ? 1.15 : 0.70;
      depletionFraction_p = 0.55;
    } else if (crop === 'Paddy') {
      rootDepth_m = 0.40;
      cropCoefficient_Kc = 1.20;
      depletionFraction_p = 0.20;
    } else if (crop === 'Potato') {
      rootDepth_m = 0.50;
      cropCoefficient_Kc = 1.10;
      depletionFraction_p = 0.35;
    } else if (crop === 'Mustard') {
      rootDepth_m = 0.60;
      cropCoefficient_Kc = stage === 'mid_season' ? 1.05 : 0.65;
      depletionFraction_p = 0.50;
    } else if (crop === 'Onion') {
      rootDepth_m = 0.35;
      cropCoefficient_Kc = stage === 'mid_season' ? 1.05 : 0.70;
      depletionFraction_p = 0.30;
    } else if (crop === 'Chilli') {
      rootDepth_m = 0.55;
      cropCoefficient_Kc = stage === 'mid_season' ? 1.05 : 0.65;
      depletionFraction_p = 0.40;
    } else if (crop === 'Tomato') {
      rootDepth_m = 0.60;
      cropCoefficient_Kc = stage === 'mid_season' ? 1.05 : 0.75;
      depletionFraction_p = 0.45;
    }

    return { rootDepth_m, cropCoefficient_Kc, depletionFraction_p };
  };

  // Detect dirty state comparing with initialFarm
  const isDirty = useMemo(() => {
    if (lat !== initialFarm.location.latitude) return true;
    if (lon !== initialFarm.location.longitude) return true;
    if (queryLocation !== (initialFarm.location.villageOrPincode || '')) return true;
    if (soilTexture !== initialFarm.soil.texture) return true;
    if (storageType !== initialFarm.reserve.storageType) return true;
    if (tankCapacity !== initialFarm.reserve.totalCapacity_liters) return true;
    if (availableLiters !== initialFarm.reserve.currentAvailable_liters) return true;
    if (pumpHp !== (initialFarm.reserve.pumpPower_hp || 5.0)) return true;

    if (plots.length !== initialFarm.plots.length) return true;
    for (let i = 0; i < plots.length; i++) {
      const p = plots[i];
      const orig = initialFarm.plots[i];
      if (!orig) return true;
      if (p.cropName !== orig.cropName) return true;
      if (p.growthStage !== orig.growthStage) return true;
      if (p.areaValue !== orig.areaValue) return true;
      if (p.areaUnit !== orig.areaUnit) return true;
      if (p.irrigationMethod !== orig.irrigationMethod) return true;
    }

    return false;
  }, [
    lat, lon, queryLocation, soilTexture, storageType, 
    tankCapacity, availableLiters, pumpHp, plots, initialFarm
  ]);

  // Reset all fields back to initialFarm
  const handleDiscardChanges = () => {
    setQueryLocation(initialFarm.location.villageOrPincode || '');
    setLat(initialFarm.location.latitude);
    setLon(initialFarm.location.longitude);
    setDistrict(initialFarm.location.district || '');
    setStateName(initialFarm.location.state || '');
    setSoilTexture(initialFarm.soil.texture);
    setPlots(
      initialFarm.plots.map((p, idx) => ({
        id: p.id || `plot-${idx + 1}`,
        cropName: p.cropName,
        growthStage: p.growthStage,
        areaValue: p.areaValue,
        areaUnit: p.areaUnit,
        irrigationMethod: p.irrigationMethod,
      }))
    );
    setStorageType(initialFarm.reserve.storageType);
    setTankCapacity(initialFarm.reserve.totalCapacity_liters);
    setAvailableLiters(initialFarm.reserve.currentAvailable_liters);
    setPumpHp(initialFarm.reserve.pumpPower_hp || 5.0);
  };

  // Plot management
  const handleAddPlot = () => {
    const nextIdx = plots.length + 1;
    const availableCrops = ['Wheat', 'Spinach', 'Potato', 'Mustard', 'Paddy', 'Onion', 'Chilli', 'Tomato'];
    const nextCrop = availableCrops[(nextIdx - 1) % availableCrops.length];
    setPlots((prev) => [
      ...prev,
      {
        id: `plot-${Date.now()}-${nextIdx}`,
        cropName: nextCrop,
        growthStage: 'mid_season',
        areaValue: 1.0,
        areaUnit: prev[0]?.areaUnit || 'bigha',
        irrigationMethod: 'drip',
      },
    ]);
  };

  const handleRemovePlot = (index: number) => {
    if (plots.length <= 1) return;
    setPlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePlot = (
    index: number,
    updates: Partial<{
      cropName: string;
      growthStage: 'initial' | 'development' | 'mid_season' | 'late_season';
      areaValue: number;
      areaUnit: AreaUnit;
      irrigationMethod: IrrigationMethod;
    }>
  ) => {
    setPlots((prev) => prev.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  };

  // Save changes handler
  const handleSaveChanges = () => {
    setIsSaving(true);

    const awc_mm_per_m = soilTexture === 'sandy' ? 90 : soilTexture === 'clay_black' ? 180 : 150;
    const infiltration_rate_mm_hr = soilTexture === 'sandy' ? 25 : soilTexture === 'clay_black' ? 8 : 15;

    let totalCap = tankCapacity;
    let finalAvailable = Math.min(availableLiters, totalCap);

    if (storageType === 'custom_sump') {
      totalCap = calculateSumpVolumeLiters(sumpLength, sumpWidth, sumpDepth);
      finalAvailable = Math.min(availableLiters, totalCap);
    }

    const mappedPlots: CropBlock[] = plots.map((p, idx) => {
      const { rootDepth_m, cropCoefficient_Kc, depletionFraction_p } = getCropAgronomicParams(
        p.cropName,
        p.growthStage
      );
      const area_sq_meters = normalizeAreaToSqMeters(p.areaValue, p.areaUnit);
      return {
        id: p.id || `plot-${idx + 1}`,
        cropName: p.cropName,
        growthStage: p.growthStage,
        areaValue: p.areaValue,
        areaUnit: p.areaUnit,
        area_sq_meters,
        rootDepth_m,
        cropCoefficient_Kc,
        depletionFraction_p,
        currentDepletion_mm: 34.0,
        irrigationMethod: p.irrigationMethod,
        lastIrrigationDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      };
    });

    const cropSummary = Array.from(new Set(plots.map((p) => p.cropName))).join(' & ');
    const updatedFarm: FarmProfile = {
      ...initialFarm,
      farmName: `${cropSummary} Field (${district || 'Local Parcel'})`,
      location: {
        latitude: lat,
        longitude: lon,
        villageOrPincode: queryLocation,
        district,
        state: stateName,
      },
      soil: {
        texture: soilTexture,
        awc_mm_per_m,
        infiltration_rate_mm_hr,
      },
      reserve: {
        storageType,
        totalCapacity_liters: totalCap,
        currentAvailable_liters: finalAvailable,
        sumpDimensions: storageType === 'custom_sump' ? {
          length_m: sumpLength,
          width_m: sumpWidth,
          waterDepth_m: sumpDepth,
        } : undefined,
        pumpPower_hp: pumpHp,
        knownFlowRate_liters_per_hr: pumpHp * 1200,
      },
      plots: mappedPlots,
      updatedAt: new Date().toISOString(),
    };

    onSubmit(updatedFarm);
  };

  const totalCalculatedAreaM2 = plots.reduce(
    (acc, p) => acc + normalizeAreaToSqMeters(p.areaValue, p.areaUnit),
    0
  );

  return (
    <div className="space-y-6">
      
      {/* Top Navigation & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E1E8DE] dark:border-[#16364D]">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-[#38BDF8] hover:underline mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.backToAdvisory}</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
            {t.editFieldTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
            {t.editFieldSubtitle}
          </p>
        </div>

        {/* Global Save / Discard Actions */}
        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-[#16364D] text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#112B3E] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.discardChanges}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!isDirty || isSaving}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? t.savingChanges : t.saveChanges}</span>
          </button>
        </div>
      </div>

      {/* Parcel Identity Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
              {localizeFieldTitle(initialFarm.farmName, language)}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-[#94A3B8]">
            <span>{district || 'Bardhaman'}, {stateName || 'India'}</span>
            <span>•</span>
            <span className="font-mono">{lat.toFixed(4)}° N, {lon.toFixed(4)}° E</span>
            <span>•</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {totalCalculatedAreaM2.toLocaleString()} m² ({plots.length} {plots.length === 1 ? t.sectionSingular : t.sectionPlural})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 font-mono text-[11px] text-slate-400 dark:text-slate-500">
          <span>{t.parcelIdLabel}</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#112B3E] text-slate-700 dark:text-[#CBD5E1]">
            {initialFarm.id}
          </span>
        </div>
      </div>

      {/* Direct-Access Categorized Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-[#16364D]">
        {[
          { id: 'crops', label: t.tabCrops, icon: Sprout },
          { id: 'water', label: t.tabWater, icon: Droplets },
          { id: 'soil', label: t.tabSoil, icon: Layers },
          { id: 'geospatial', label: t.tabGeospatial, icon: MapPin },
          { id: 'danger', label: t.tabDanger, icon: AlertTriangle, isDanger: true },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? tab.isDanger
                    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                    : 'bg-sky-50 dark:bg-[#102A3E] text-sky-600 dark:text-[#38BDF8] border border-sky-200 dark:border-[#1E4765]'
                  : tab.isDanger
                  ? 'text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#112B3E]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Configuration Canvas */}
      <div className="rounded-2xl bg-white dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] p-5 sm:p-7 shadow-sm">
        
        {/* TAB 1: CROPS & PHENOLOGY STAGES */}
        {activeTab === 'crops' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#16364D]/60">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-500" />
                  <span>{t.tabCrops}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed">
                  {t.advanceStageHelp}
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                {plots.length} {plots.length === 1 ? t.sectionSingular : t.sectionPlural}
              </span>
            </div>

            <div className="space-y-4">
              {plots.map((plot, index) => {
                const plotAreaM2 = normalizeAreaToSqMeters(plot.areaValue, plot.areaUnit);
                const sectionLetter = String.fromCharCode(65 + index);
                const agronomic = getCropAgronomicParams(plot.cropName, plot.growthStage);

                return (
                  <div
                    key={plot.id}
                    className="p-5 rounded-2xl bg-slate-50/60 dark:bg-[#0D2232]/60 border border-slate-200 dark:border-[#16364D] space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#16364D]">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                          {sectionLetter}
                        </span>
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
                            {t.sectionLabel} {sectionLetter}: {localizeCrop(plot.cropName, language)}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] ml-2 font-mono">
                            ({plot.areaValue} {plot.areaUnit === 'bigha' ? t.unitBigha : plot.areaUnit === 'acre' ? t.unitAcre : plot.areaUnit} • {plotAreaM2.toLocaleString()} m²)
                          </span>
                        </div>
                      </div>

                      {plots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlot(index)}
                          className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.decommissionBlock}</span>
                        </button>
                      )}
                    </div>

                    {/* Live agronomic parameters badge */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-xs flex flex-wrap items-center justify-between gap-2 font-mono">
                      <span className="text-emerald-800 dark:text-emerald-300 font-bold">
                        {t.currentKc} {agronomic.cropCoefficient_Kc.toFixed(2)}
                      </span>
                      <span className="text-emerald-800 dark:text-emerald-300">
                        {t.rootDepth} {agronomic.rootDepth_m.toFixed(2)} m
                      </span>
                      <span className="text-slate-500 dark:text-[#94A3B8]">
                        p: {agronomic.depletionFraction_p.toFixed(2)}
                      </span>
                    </div>

                    {/* Crop selector chips */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider">
                        {t.selectCropLabel}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          'Tomato', 'Wheat', 'Spinach', 'Potato',
                          'Paddy', 'Mustard', 'Onion', 'Chilli'
                        ].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleUpdatePlot(index, { cropName: c })}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                              plot.cropName === c
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white dark:bg-[#0A1C2A] border-slate-200 dark:border-[#16364D] text-slate-700 dark:text-[#CBD5E1] hover:border-emerald-500'
                            }`}
                          >
                            {localizeCrop(c, language)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Growth stage selector (Advance growth stage) */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider">
                        {t.cropGrowthStageLabel}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'initial', label: t.stageInitial },
                          { id: 'development', label: t.stageDevelopment },
                          { id: 'mid_season', label: t.stageMidSeason },
                          { id: 'late_season', label: t.stageLateSeason },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleUpdatePlot(index, { growthStage: st.id as any })}
                            className={`p-2.5 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                              plot.growthStage === st.id
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20'
                                : 'bg-white dark:bg-[#0A1C2A] border-slate-200 dark:border-[#16364D] text-slate-600 dark:text-[#94A3B8] hover:border-emerald-400'
                            }`}
                          >
                            <span className="block font-bold">{st.label.split('(')[0]}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                              {st.label.includes('(') ? `(${st.label.split('(')[1]}` : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Area & Regional Unit */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider">
                        {t.fieldSectionAreaLabel}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={plot.areaValue}
                          onChange={(e) => handleUpdatePlot(index, { areaValue: parseFloat(e.target.value) || 0.1 })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A1C2A] border border-slate-200 dark:border-[#16364D] text-xs text-slate-900 dark:text-[#F0F9FF] focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <select
                          value={plot.areaUnit}
                          onChange={(e) => handleUpdatePlot(index, { areaUnit: e.target.value as AreaUnit })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A1C2A] border border-slate-200 dark:border-[#16364D] text-xs text-slate-900 dark:text-[#F0F9FF] focus:outline-none focus:border-emerald-500"
                        >
                          <option value="bigha">{t.optBigha}</option>
                          <option value="acre">{t.optAcre}</option>
                          <option value="guntha">{t.optGuntha}</option>
                          <option value="cent">{t.optCent}</option>
                          <option value="hectare">{t.optHectare}</option>
                          <option value="sq_meters">{t.optSqMeters}</option>
                        </select>
                      </div>
                    </div>

                    {/* Irrigation technique */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider">
                        {t.irrigationMethod}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdatePlot(index, { irrigationMethod: 'drip' })}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                            plot.irrigationMethod === 'drip'
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                              : 'bg-white dark:bg-[#0A1C2A] border-slate-200 dark:border-[#16364D] text-slate-600 dark:text-[#94A3B8]'
                          }`}
                        >
                          {t.drip}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdatePlot(index, { irrigationMethod: 'sprinkler' })}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                            plot.irrigationMethod === 'sprinkler'
                              ? 'bg-sky-500/15 border-sky-500 text-sky-700 dark:text-sky-300'
                              : 'bg-white dark:bg-[#0A1C2A] border-slate-200 dark:border-[#16364D] text-slate-600 dark:text-[#94A3B8]'
                          }`}
                        >
                          {t.sprinkler}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdatePlot(index, { irrigationMethod: 'surface_flood' })}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                            plot.irrigationMethod === 'surface_flood'
                              ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300'
                              : 'bg-white dark:bg-[#0A1C2A] border-slate-200 dark:border-[#16364D] text-slate-600 dark:text-[#94A3B8]'
                          }`}
                        >
                          {t.flood}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {plots.length < 6 && (
              <button
                type="button"
                onClick={handleAddPlot}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addBlockToParcel}</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 2: WATER INFRASTRUCTURE & HYDRAULICS */}
        {activeTab === 'water' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] flex items-center gap-2">
                <Droplets className="w-5 h-5 text-sky-600 dark:text-[#38BDF8]" />
                <span>{t.tabWater}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                {t.stepReserveSubtitle}
              </p>
            </div>

            {/* Storage type toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStorageType('sintex_tank')}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  storageType === 'sintex_tank'
                    ? 'bg-sky-50 dark:bg-[#102A3E] border-sky-500 text-sky-700 dark:text-[#38BDF8] ring-2 ring-sky-500/20'
                    : 'bg-white dark:bg-[#0D2232] border-slate-200 dark:border-[#16364D] text-slate-600 dark:text-[#94A3B8]'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Cylinder className="w-4 h-4 shrink-0" />
                  <span>{t.storageBorewell}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStorageType('custom_sump')}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  storageType === 'custom_sump'
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-[#0D2232] border-slate-200 dark:border-[#16364D] text-slate-600 dark:text-[#94A3B8]'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Waves className="w-4 h-4 shrink-0" />
                  <span>{t.storagePond}</span>
                </span>
              </button>
            </div>

            {/* Tank Capacity settings */}
            {storageType === 'sintex_tank' && (
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#0D2232] border border-slate-200 dark:border-[#16364D] space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-[#94A3B8]">
                    <span className="font-semibold">{t.tankCapacityLabel}</span>
                    <span className="font-bold text-sky-600 dark:text-[#38BDF8] font-mono">{tankCapacity.toLocaleString()} {t.liters}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[1000, 2000, 5000, 10000].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => {
                          setTankCapacity(cap);
                          if (availableLiters > cap) setAvailableLiters(cap);
                        }}
                        className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                          tankCapacity === cap
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white dark:bg-[#0A1C2A] border-slate-200 dark:border-[#16364D] text-slate-600 dark:text-[#94A3B8] hover:border-sky-400'
                        }`}
                      >
                        {cap / 1000}k {t.liters}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-[#94A3B8]">
                    <span className="font-semibold">{t.fillGaugeLabel}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {availableLiters.toLocaleString()} / {tankCapacity.toLocaleString()} L
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max={tankCapacity}
                    step="100"
                    value={availableLiters}
                    onChange={(e) => setAvailableLiters(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] flex justify-between font-mono">
                    <span>100 L</span>
                    <span>{t.gaugeAvailable} <strong className="text-slate-900 dark:text-[#F0F9FF]">{availableLiters.toLocaleString()} L</strong></span>
                    <span>{tankCapacity.toLocaleString()} L</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sump geometric calculator */}
            {storageType === 'custom_sump' && (
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#0D2232] border border-slate-200 dark:border-[#16364D] space-y-4">
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" />
                  <span>{t.sumpCalcLabel}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-[#94A3B8] uppercase">{t.dimLength}</label>
                    <input
                      type="number"
                      step="0.5"
                      value={sumpLength}
                      onChange={(e) => setSumpLength(parseFloat(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0A1C2A] border border-slate-200 dark:border-[#16364D] text-xs text-slate-900 dark:text-[#F0F9FF]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-[#94A3B8] uppercase">{t.dimWidth}</label>
                    <input
                      type="number"
                      step="0.5"
                      value={sumpWidth}
                      onChange={(e) => setSumpWidth(parseFloat(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0A1C2A] border border-slate-200 dark:border-[#16364D] text-xs text-slate-900 dark:text-[#F0F9FF]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-[#94A3B8] uppercase">{t.dimDepth}</label>
                    <input
                      type="number"
                      step="0.2"
                      value={sumpDepth}
                      onChange={(e) => setSumpDepth(parseFloat(e.target.value) || 0.5)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0A1C2A] border border-slate-200 dark:border-[#16364D] text-xs text-slate-900 dark:text-[#F0F9FF]"
                    />
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-xs flex justify-between items-center font-mono">
                  <span className="text-slate-600 dark:text-[#94A3B8]">{t.calculatedCapacity}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {calculateSumpVolumeLiters(sumpLength, sumpWidth, sumpDepth).toLocaleString()} {t.liters}
                  </span>
                </div>
              </div>
            )}

            {/* Pump Power selection */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-600 dark:text-[#94A3B8]">
                <span className="font-semibold">{t.pumpPowerLabel}</span>
                <span className="font-bold text-slate-900 dark:text-[#F0F9FF] font-mono">{pumpHp} HP</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 5, 7.5].map((hp) => (
                  <button
                    key={hp}
                    type="button"
                    onClick={() => setPumpHp(hp)}
                    className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                      pumpHp === hp
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white dark:bg-[#0A1C2A] border-slate-200 dark:border-[#16364D] text-slate-600 dark:text-[#94A3B8] hover:border-sky-400'
                    }`}
                  >
                    {hp} HP
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ROOT ZONE SOIL MODEL */}
        {activeTab === 'soil' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                <span>{t.tabSoil}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                {t.stepSoilSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <button
                type="button"
                onClick={() => setSoilTexture('sandy')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
                  soilTexture === 'sandy'
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 ring-2 ring-amber-500/20 text-amber-900 dark:text-amber-200'
                    : 'bg-white dark:bg-[#0D2232] border-slate-200 dark:border-[#16364D] text-slate-600 dark:text-[#94A3B8] hover:border-amber-400'
                }`}
              >
                <div>
                  <div className="text-sm font-bold flex items-center justify-between text-slate-900 dark:text-[#F0F9FF]">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      <span>{t.sandyLoamName}</span>
                    </span>
                    {soilTexture === 'sandy' && <Check className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                    {t.sandyLoamDesc}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold mt-3">
                  AWC: 90 mm/m
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSoilTexture('loamy')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
                  soilTexture === 'loamy'
                    ? 'bg-sky-50 dark:bg-[#102A3E] border-sky-500 ring-2 ring-sky-500/20 text-sky-900 dark:text-sky-200'
                    : 'bg-white dark:bg-[#0D2232] border-slate-200 dark:border-[#16364D] text-slate-600 dark:text-[#94A3B8] hover:border-sky-400'
                }`}
              >
                <div>
                  <div className="text-sm font-bold flex items-center justify-between text-slate-900 dark:text-[#F0F9FF]">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                      <span>{t.alluvialName}</span>
                    </span>
                    {soilTexture === 'loamy' && <Check className="w-4 h-4 text-sky-500" />}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                    {t.alluvialDesc}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-sky-600 dark:text-[#38BDF8] font-bold mt-3">
                  AWC: 150 mm/m {t.awcIdealTag}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSoilTexture('clay_black')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
                  soilTexture === 'clay_black'
                    ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 dark:text-indigo-200'
                    : 'bg-white dark:bg-[#0D2232] border-slate-200 dark:border-[#16364D] text-slate-600 dark:text-[#94A3B8] hover:border-indigo-400'
                }`}
              >
                <div>
                  <div className="text-sm font-bold flex items-center justify-between text-slate-900 dark:text-[#F0F9FF]">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                      <span>{t.blackClayName}</span>
                    </span>
                    {soilTexture === 'clay_black' && <Check className="w-4 h-4 text-indigo-500" />}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                    {t.blackClayDesc}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold mt-3">
                  AWC: 180 mm/m
                </div>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D2232] border border-slate-200 dark:border-[#16364D] text-xs text-slate-600 dark:text-[#94A3B8] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-sky-600 dark:text-[#38BDF8] shrink-0 mt-0.5" />
              <span>{t.awcExplanation}</span>
            </div>
          </div>
        )}

        {/* TAB 4: GEOSPATIAL LOCATION & SATELLITE PIN */}
        {activeTab === 'geospatial' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-sky-600 dark:text-[#38BDF8]" />
                <span>{t.tabGeospatial}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                {t.locationStepDesc}
              </p>
            </div>

            {/* Search bar with instant autocomplete */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider flex items-center justify-between">
                <span>{t.searchLocationPrompt}</span>
                {isLoadingSuggestions && (
                  <span className="text-[10px] text-sky-600 dark:text-[#38BDF8] font-mono flex items-center gap-1 font-normal">
                    <Loader2 className="w-3 h-3 animate-spin" /> {t.locatingGPS}
                  </span>
                )}
              </label>

              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={queryLocation}
                  onChange={(e) => setQueryLocation(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setIsDropdownOpen(true);
                  }}
                  placeholder={t.locationSearchPlaceholder}
                  className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0D2232] border border-slate-200 dark:border-[#16364D] text-sm text-slate-900 dark:text-[#F0F9FF] focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
                />

                <div className="absolute right-2 flex items-center gap-1">
                  {queryLocation && (
                    <button
                      type="button"
                      onClick={() => {
                        setQueryLocation('');
                        setSuggestions([]);
                        setIsDropdownOpen(false);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                      title={t.clearSearch}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSearchLocation}
                    disabled={isSearchingLocation}
                    className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSearchingLocation ? '...' : t.findBtn}
                  </button>
                </div>
              </div>

              {/* Autocomplete dropdown popover */}
              {isDropdownOpen && suggestions.length > 0 && (
                <div 
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-white/95 dark:bg-[#0D2232]/95 backdrop-blur-xl border border-slate-200 dark:border-[#16364D] shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-[#16364D]/60 animate-in fade-in"
                >
                  <div className="px-3 py-1.5 bg-slate-100 dark:bg-[#112B3E] text-[10px] font-semibold text-slate-500 dark:text-[#94A3B8] flex items-center justify-between uppercase tracking-wider">
                    <span>{t.indianSuggestions}</span>
                    <span className="font-mono text-[9px]">{t.tapOrPressEnter}</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {suggestions.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className={`w-full min-h-[44px] px-3.5 py-2.5 text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                          selectedIndex === idx
                            ? 'bg-sky-50 dark:bg-[#102A3E] text-slate-900 dark:text-white'
                            : 'hover:bg-slate-50 dark:hover:bg-[#112B3E]/60 text-slate-700 dark:text-[#CBD5E1]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#16364D] text-sky-600 dark:text-[#38BDF8] shrink-0">
                            {item.type === 'pincode' ? (
                              <Hash className="w-3.5 h-3.5 text-amber-500" />
                            ) : item.type === 'district' ? (
                              <Building2 className="w-3.5 h-3.5 text-blue-500" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] truncate">
                              {[item.district, item.state].filter(Boolean).join(', ')}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-sky-600 dark:text-[#38BDF8] font-semibold block">
                            {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                          </span>
                          <span className="text-[9px] uppercase font-bold text-slate-400">
                            {item.type}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-200 dark:bg-[#16364D]" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold">{t.orDivider}</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-[#16364D]" />
            </div>

            {/* 1-Tap GPS Button */}
            <button
              type="button"
              onClick={handleGPSDetect}
              disabled={isLocatingGPS}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/30 dark:hover:bg-sky-950/50 border border-sky-200 dark:border-sky-800/40 text-sky-700 dark:text-[#38BDF8] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Compass className={`w-4 h-4 ${isLocatingGPS ? 'animate-spin' : ''}`} />
              <span>{isLocatingGPS ? t.gpsLocating : t.gpsButton}</span>
            </button>

            {locationFeedback && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                {locationFeedback}
              </div>
            )}

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-[#94A3B8] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-[#38BDF8]" />
                  <span>{t.liveParcelMapLabel}</span>
                </span>
                <span className="font-mono text-sky-600 dark:text-[#38BDF8]">
                  {lat.toFixed(4)}°, {lon.toFixed(4)}°
                </span>
              </div>
              
              <LocationMapPicker
                latitude={lat}
                longitude={lon}
                onChangeLocation={(newLat, newLon, resolvedName) => {
                  setLat(newLat);
                  setLon(newLon);
                  if (resolvedName) setQueryLocation(resolvedName);
                }}
                interactive={true}
                height="320px"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D2232] border border-slate-200 dark:border-[#16364D] text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-[#94A3B8]">{t.selectedCoordinates}</span>
                <span className="font-mono text-sky-600 dark:text-[#38BDF8] font-bold">
                  {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                {t.regionLabel} <span className="text-slate-900 dark:text-[#F0F9FF] font-semibold">{district || t.localClusterFallback}</span>, {t.stateLabel} <span className="text-slate-900 dark:text-[#F0F9FF] font-semibold">{stateName || 'India'}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DANGER ZONE (DECOMMISSION PARCEL) */}
        {activeTab === 'danger' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-rose-100 dark:border-rose-950/40">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 font-['Outfit'] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span>{t.decommissionParcel}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                {t.decommissionWarning}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    {t.deleteFieldParcel}
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                    {t.decommissionWarning}
                  </p>
                </div>
              </div>

              {onDeleteParcel && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`${t.confirmDecommission}?`)) {
                      onDeleteParcel(initialFarm.id);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.confirmDecommission}</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* STICKY DIRTY-STATE ACTION BAR */}
      {isDirty && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40 p-4 rounded-2xl bg-slate-900/95 dark:bg-[#0A1C2A]/95 backdrop-blur-xl border border-sky-500/40 shadow-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="font-semibold text-slate-200">
              {t.unsavedChangesNotice}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.discardChanges}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? t.savingChanges : t.saveChanges}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
