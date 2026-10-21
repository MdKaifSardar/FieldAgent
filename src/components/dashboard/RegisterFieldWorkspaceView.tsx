'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FarmProfile, 
  CropBlock,
  AreaUnit, 
  SoilTexture, 
  IrrigationMethod, 
  StorageTier,
  normalizeAreaToSqMeters, 
  calculateSumpVolumeLiters,
  IRRIGATION_EFFICIENCIES 
} from '../../types/farm';
import { 
  geocodeLocationQuery, 
  getDeviceCoordinates,
  fetchLocationSuggestions,
  LocationSuggestion
} from '../../adapters/geocodingAdapter';
import { useLanguage } from '../common/LanguageContext';
import { localizeCrop } from '../../utils/agriculturalLocalization';
import { 
  MapPin, 
  Sprout, 
  Droplets, 
  Layers, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Compass, 
  Info,
  X,
  Calculator,
  Cylinder,
  Waves,
  Search,
  Loader2,
  Building2,
  Hash,
  Plus,
  Trash2,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { LocationMapPicker } from '../map/LocationMapPicker';
import { FieldVoiceSpeaker, stopAllFieldVoice } from '../common/FieldVoiceSpeaker';
import { 
  CROP_VISUAL_ASSETS, 
  SOIL_VISUAL_ASSETS, 
  IRRIGATION_VISUAL_ASSETS 
} from '../../data/agriculturalVisualAssets';

interface RegisterFieldWorkspaceViewProps {
  onCancel: () => void;
  onSubmit: (farm: FarmProfile) => void;
}

export function RegisterFieldWorkspaceView({ onCancel, onSubmit }: RegisterFieldWorkspaceViewProps) {
  const { t, language } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Anti-Leakage Guard: Silence active voice guidance whenever step changes or component unmounts
  useEffect(() => {
    stopAllFieldVoice();
  }, [step]);

  useEffect(() => {
    return () => {
      stopAllFieldVoice();
    };
  }, []);

  // STEP 1: Location state
  const [queryLocation, setQueryLocation] = useState('Bardhaman, West Bengal');
  const [lat, setLat] = useState(23.2324);
  const [lon, setLon] = useState(87.8615);
  const [district, setDistrict] = useState('Purba Bardhaman');
  const [stateName, setStateName] = useState('West Bengal');
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
    setLocationFeedback(`${sug.displayName}`);
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

  // STEP 2: Soil state
  const [soilTexture, setSoilTexture] = useState<SoilTexture>('loamy');

  // STEP 3: Multi-Plot Sections State
  const [plots, setPlots] = useState<{
    id: string;
    cropName: string;
    growthStage: 'initial' | 'development' | 'mid_season' | 'late_season';
    areaValue: number;
    areaUnit: AreaUnit;
    irrigationMethod: IrrigationMethod;
  }[]>([
    {
      id: 'plot-primary-01',
      cropName: 'Tomato',
      growthStage: 'mid_season',
      areaValue: 1.5,
      areaUnit: 'bigha',
      irrigationMethod: 'drip',
    },
  ]);

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

  // STEP 4: Water Reserve state
  const [storageType, setStorageType] = useState<StorageTier>('sintex_tank');
  const [tankCapacity, setTankCapacity] = useState(5000);
  const [fillPercent, setFillPercent] = useState(70);
  const [sumpLength, setSumpLength] = useState(3.0);
  const [sumpWidth, setSumpWidth] = useState(2.0);
  const [sumpDepth, setSumpDepth] = useState(1.5);
  const [pumpHp, setPumpHp] = useState(5.0);

  // GPS 1-Tap Handler
  const handleGPSDetect = async () => {
    setIsLocatingGPS(true);
    setLocationFeedback(null);
    try {
      const coords = await getDeviceCoordinates();
      setLat(coords.lat);
      setLon(coords.lon);
      const res = await geocodeLocationQuery(`${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`);
      setQueryLocation(res.location.villageOrPincode);
      setDistrict(res.location.district || 'Current Location');
      setStateName(res.location.state || 'India');
      setLocationFeedback(`${coords.lat.toFixed(4)}°, ${coords.lon.toFixed(4)}°`);
    } catch (err: any) {
      setLocationFeedback(err.message);
    } finally {
      setIsLocatingGPS(false);
    }
  };

  // Search Location Handler
  const handleSearchLocation = async () => {
    if (!queryLocation.trim()) return;
    setIsSearchingLocation(true);
    setLocationFeedback(null);
    try {
      const res = await geocodeLocationQuery(queryLocation);
      setLat(res.location.latitude);
      setLon(res.location.longitude);
      setDistrict(res.location.district || 'Identified District');
      setStateName(res.location.state || 'India');
      setLocationFeedback(`${res.location.latitude.toFixed(3)}, ${res.location.longitude.toFixed(3)}`);
    } catch (err: any) {
      setLocationFeedback('Could not resolve location. Using fallback coordinates.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleMapLocationChange = (newLat: number, newLon: number, resolvedName?: string) => {
    setLat(newLat);
    setLon(newLon);
    if (resolvedName) {
      setQueryLocation(resolvedName);
      setLocationFeedback(resolvedName);
    }
  };

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

  const handleComplete = () => {
    const awc_mm_per_m = soilTexture === 'sandy' ? 90 : soilTexture === 'clay_black' ? 180 : 150;
    const infiltration_rate_mm_hr = soilTexture === 'sandy' ? 25 : soilTexture === 'clay_black' ? 8 : 15;

    let totalCap = tankCapacity;
    let availableLiters = Math.round((tankCapacity * fillPercent) / 100);

    if (storageType === 'custom_sump') {
      totalCap = calculateSumpVolumeLiters(sumpLength, sumpWidth, sumpDepth);
      availableLiters = Math.round((totalCap * fillPercent) / 100);
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
    const farm: FarmProfile = {
      id: `farm-${Date.now()}`,
      userId: 'farmer-user',
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
        currentAvailable_liters: availableLiters,
        sumpDimensions: storageType === 'custom_sump' ? {
          length_m: sumpLength,
          width_m: sumpWidth,
          waterDepth_m: sumpDepth,
        } : undefined,
        pumpPower_hp: pumpHp,
        knownFlowRate_liters_per_hr: pumpHp * 1200,
      },
      plots: mappedPlots,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSubmit(farm);
  };

  const totalCalculatedAreaM2 = plots.reduce(
    (acc, p) => acc + normalizeAreaToSqMeters(p.areaValue, p.areaUnit),
    0
  );

  return (
    <div className="space-y-6">
      {/* UNIFIED PERSISTENT MASTER BANNER */}
      <div className="rounded-xl bg-white dark:bg-[#0D2232] border border-[#E1E8DE] dark:border-[#16364D] shadow-xs overflow-hidden">
        {/* Top Header Row */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-[#38BDF8] hover:underline mb-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.backToFields}</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
              {t.registerNewField}
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
              {t.onboardingSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <span className="px-3 py-1 rounded-full bg-sky-50 dark:bg-[#112B3E] border border-sky-200 dark:border-[#1E4765] text-sky-700 dark:text-[#38BDF8] font-bold text-xs flex items-center gap-1.5 font-mono">
              <span>{t.stepWord} {step} {t.ofWord} 4</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>{Math.round((step / 4) * 100)}%</span>
            </span>

            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#16364D] text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#112B3E] transition-colors cursor-pointer"
            >
              {t.cancelRegistration}
            </button>
          </div>
        </div>

        {/* INTEGRATED HORIZONTAL SUB-NAVIGATION TAB BAR */}
        <div className="px-4 sm:px-6 border-t border-[#E1E8DE] dark:border-[#16364D] bg-slate-50/50 dark:bg-[#0A1C2A] flex items-center gap-2 sm:gap-4 overflow-x-auto">
          {[
            { s: 1 as const, label: t.locationStep, icon: MapPin },
            { s: 2 as const, label: t.soilStep, icon: Layers },
            { s: 3 as const, label: t.cropStep, icon: Sprout },
            { s: 4 as const, label: t.reserveStep, icon: Droplets },
          ].map(({ s, label, icon: Icon }) => {
            const isCurrent = step === s;
            const isPassed = step > s;

            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (s <= step || isPassed) setStep(s);
                }}
                disabled={s > step && !isPassed}
                className={`py-3.5 px-3 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap relative ${
                  isCurrent
                    ? 'text-sky-600 dark:text-[#38BDF8] font-bold'
                    : isPassed
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold hover:text-slate-900 dark:hover:text-white'
                    : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                  isCurrent
                    ? 'bg-sky-600 text-white'
                    : isPassed
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-[#16364D] text-slate-400'
                }`}>
                  {isPassed ? <Check className="w-3 h-3" /> : s}
                </div>
                <Icon className={`w-4 h-4 ${isCurrent ? 'text-sky-500 dark:text-[#38BDF8]' : isPassed ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>{label}</span>
                {isCurrent && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-500 rounded-t-full shadow-xs" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Responsive Console Grid (Canvas 8 cols + Sticky Live Summary 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Active Step Form Canvas (8 cols) */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl bg-white dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] p-5 sm:p-7 shadow-sm space-y-6">
            
            {/* STEP 1: FIELD LOCATION */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-sky-600 dark:text-[#38BDF8] shrink-0" />
                      <span className="truncate">{t.locationStep}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                      {t.locationStepDesc}
                    </p>
                  </div>
                  <FieldVoiceSpeaker scriptKey="step1_overview" className="shrink-0" />
                </div>

                {/* Search bar with instant autocomplete */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-semibold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider flex flex-wrap items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span>{t.searchLocationPrompt}</span>
                      <FieldVoiceSpeaker scriptKey="step1_search" size="sm" className="shrink-0" />
                    </span>
                    {isLoadingSuggestions && (
                      <span className="text-[10px] text-sky-600 dark:text-[#38BDF8] font-mono flex items-center gap-1 font-normal shrink-0">
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGPSDetect}
                    disabled={isLocatingGPS}
                    className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/30 dark:hover:bg-sky-950/50 border border-sky-200 dark:border-sky-800/40 text-sky-700 dark:text-[#38BDF8] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Compass className={`w-4 h-4 ${isLocatingGPS ? 'animate-spin' : ''}`} />
                    <span>{isLocatingGPS ? t.gpsLocating : t.gpsButton}</span>
                  </button>
                  <FieldVoiceSpeaker scriptKey="step1_gps" className="shrink-0" />
                </div>

                {locationFeedback && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    {locationFeedback}
                  </div>
                )}

                {/* Interactive Satellite / Street Map Picker */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-start sm:items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-[#38BDF8] shrink-0 mt-0.5 sm:mt-0" />
                      <span className="font-semibold text-slate-700 dark:text-[#CBD5E1] leading-snug">
                        {t.liveParcelMapLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-block text-[11px] font-mono text-sky-600 dark:text-[#38BDF8] bg-sky-50 dark:bg-[#071724] px-2 py-0.5 rounded-md border border-sky-200 dark:border-[#16364D]">
                        {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
                      </span>
                      <FieldVoiceSpeaker scriptKey="step1_map" size="sm" className="shrink-0" />
                    </div>
                  </div>

                  {/* Dedicated mobile coordinate badge to prevent small-screen collision */}
                  <div className="sm:hidden flex items-center justify-between text-[11px] font-mono text-sky-600 dark:text-[#38BDF8] bg-slate-50 dark:bg-[#0D2232] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#16364D]">
                    <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] font-sans font-medium">{t.selectedCoordinates}:</span>
                    <span className="font-bold">
                      {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
                    </span>
                  </div>
                  
                  <LocationMapPicker
                    latitude={lat}
                    longitude={lon}
                    onChangeLocation={handleMapLocationChange}
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

            {/* STEP 2: SOIL TEXTURE SELECTION */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] flex items-center gap-2">
                      <Layers className="w-5 h-5 text-amber-500 shrink-0" />
                      <span className="truncate">{t.soilStep}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                      {t.stepSoilSubtitle}
                    </p>
                  </div>
                  <FieldVoiceSpeaker scriptKey="step2_overview" className="shrink-0" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['sandy', 'loamy', 'clay_black'] as const).map((key) => {
                    const soil = SOIL_VISUAL_ASSETS[key];
                    const isSelected = soilTexture === key;

                    return (
                      <div
                        key={key}
                        onClick={() => setSoilTexture(key)}
                        className={`group relative rounded-2xl border text-left transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                            : 'bg-white dark:bg-[#0D2232] border-slate-200 dark:border-[#16364D] hover:border-amber-400 dark:hover:border-amber-500/50 shadow-xs'
                        }`}
                      >
                        {/* Specimen Photography Header */}
                        <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-slate-900">
                          <img
                            src={soil.imageUrl}
                            alt={soil.name[language]}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                          
                          {/* Audio Speaker Button */}
                          <div className="absolute top-2 left-2 z-10">
                            <FieldVoiceSpeaker scriptKey={`soil_${key}`} size="sm" />
                          </div>

                          {/* Selected Checkmark Badge */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 z-10 p-1 rounded-full bg-emerald-500 text-white shadow-md animate-in zoom-in-75">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}

                          {/* Soil Drainage Tag */}
                          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-white/90">
                            <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md font-semibold">
                              {soil.drainageRate[language]}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-3.5 sm:p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] flex items-center justify-between">
                              <span>{soil.name[language]}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed">
                              {soil.tactileDescription[language]}
                            </p>
                          </div>

                          {/* AWC Indicator Bar */}
                          <div className="pt-2 border-t border-slate-100 dark:border-[#16364D]/60 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 uppercase font-semibold">AWC ({language === 'bn' ? 'জল ধারণ' : language === 'hi' ? 'नमी क्षमता' : 'Retention'})</span>
                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{soil.awcLabel}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-[#16364D] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                                style={{ width: `${(soil.awcValue / 180) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D2232] border border-slate-200 dark:border-[#16364D] text-xs text-slate-600 dark:text-[#94A3B8] flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-sky-600 dark:text-[#38BDF8] shrink-0 mt-0.5" />
                  <span>{t.awcExplanation}</span>
                </div>
              </div>
            )}

            {/* STEP 3: MULTI-CROP & PLOT SECTIONS */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] flex items-center gap-2">
                      <Sprout className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="truncate">{t.cropStep}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                      {t.stepCropFullDesc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <FieldVoiceSpeaker scriptKey="step3_overview" className="shrink-0" />
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                      {plots.length} {plots.length === 1 ? t.sectionSingular : t.sectionPlural}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {plots.map((plot, index) => {
                    const plotAreaM2 = normalizeAreaToSqMeters(plot.areaValue, plot.areaUnit);
                    const sectionLetter = String.fromCharCode(65 + index);

                    return (
                      <div
                        key={plot.id}
                        className="p-4 sm:p-5 rounded-2xl bg-slate-50/50 dark:bg-[#0D2232]/50 border border-slate-200 dark:border-[#16364D] space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#16364D]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">
                              {sectionLetter}
                            </span>
                            <div className="min-w-0">
                              <span className="text-sm font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] block sm:inline">
                                {t.sectionLabel} {sectionLetter}: {localizeCrop(plot.cropName, language)}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] sm:ml-2 font-mono block sm:inline">
                                ({plot.areaValue} {plot.areaUnit === 'bigha' ? t.unitBigha : plot.areaUnit === 'acre' ? t.unitAcre : plot.areaUnit} • {plotAreaM2.toLocaleString()} m²)
                              </span>
                            </div>
                          </div>

                          {plots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePlot(index)}
                              className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t.removePlot}</span>
                            </button>
                          )}
                        </div>

                        {/* Photographic Crop Specimen Cards */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider">
                              {t.selectCropLabel}
                            </label>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                              {CROP_VISUAL_ASSETS[plot.cropName]?.emoji} {localizeCrop(plot.cropName, language)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                              'Tomato', 'Wheat', 'Spinach', 'Potato',
                              'Paddy', 'Mustard', 'Onion', 'Chilli'
                            ].map((c) => {
                              const crop = CROP_VISUAL_ASSETS[c];
                              const isSelected = plot.cropName === c;

                              return (
                                <div
                                  key={c}
                                  onClick={() => handleUpdatePlot(index, { cropName: c })}
                                  className={`group relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
                                    isSelected
                                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                                      : 'bg-white dark:bg-[#0A1C2A] border-slate-200 dark:border-[#16364D] hover:border-emerald-400 shadow-2xs'
                                  }`}
                                >
                                  {/* Crop Specimen Photo */}
                                  <div className="relative h-20 sm:h-22 w-full overflow-hidden bg-slate-900">
                                    <img
                                      src={crop?.imageUrl}
                                      alt={localizeCrop(c, language)}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 brightness-95 group-hover:brightness-100"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                                    {/* Inline Speaker Button */}
                                    <div className="absolute top-1.5 left-1.5 z-10">
                                      <FieldVoiceSpeaker scriptKey={`crop_${c}`} size="sm" />
                                    </div>

                                    {/* Selected Checkmark */}
                                    {isSelected && (
                                      <div className="absolute top-1.5 right-1.5 z-10 p-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                                        <Check className="w-3 h-3" />
                                      </div>
                                    )}

                                    {/* Water Demand Badge */}
                                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[9px] font-mono text-white/90">
                                      <span className={`px-1.5 py-0.5 rounded-md font-semibold backdrop-blur-xs ${
                                        crop?.waterTier === 'low'
                                          ? 'bg-amber-950/80 text-amber-300'
                                          : crop?.waterTier === 'high'
                                          ? 'bg-sky-950/80 text-sky-300'
                                          : 'bg-emerald-950/80 text-emerald-300'
                                      }`}>
                                        {crop?.waterTierLabel[language]}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Card Label */}
                                  <div className="p-2 text-center">
                                    <span className="text-xs font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] block truncate">
                                      {crop?.emoji} {localizeCrop(c, language)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                                      {crop?.category[language]}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Growth stage selector */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span>{t.cropGrowthStageLabel}</span>
                              <FieldVoiceSpeaker scriptKey="growth_stage" size="sm" />
                            </span>
                          </label>
                          <select
                            value={plot.growthStage}
                            onChange={(e) => handleUpdatePlot(index, { growthStage: e.target.value as any })}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A1C2A] border border-slate-200 dark:border-[#16364D] text-xs text-slate-900 dark:text-[#F0F9FF] focus:outline-none focus:border-emerald-500"
                          >
                            <option value="initial">{t.stageInitial}</option>
                            <option value="development">{t.stageDevelopment}</option>
                            <option value="mid_season">{t.stageMidSeason}</option>
                            <option value="late_season">{t.stageLateSeason}</option>
                          </select>
                        </div>

                        {/* Area Value & Regional Unit Selector */}
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
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono pt-0.5">
                            {t.normalizedAreaLabel} <strong>{plotAreaM2.toLocaleString()} m²</strong>
                          </div>
                        </div>

                        {/* Photographic Watering Method Cards */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider">
                              {t.irrigationMethod}
                            </label>
                            <span className="text-[10px] text-sky-600 dark:text-[#38BDF8] font-mono font-semibold">
                              {IRRIGATION_VISUAL_ASSETS[plot.irrigationMethod || 'drip']?.name[language]}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {(['drip', 'sprinkler', 'surface_flood'] as const).map((methodKey) => {
                              const method = IRRIGATION_VISUAL_ASSETS[methodKey];
                              const isSelected = plot.irrigationMethod === methodKey;

                              return (
                                <div
                                  key={methodKey}
                                  onClick={() => handleUpdatePlot(index, { irrigationMethod: methodKey })}
                                  className={`group relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
                                    isSelected
                                      ? 'bg-sky-50/60 dark:bg-[#102A3E] border-sky-500 ring-2 ring-sky-500/30 shadow-md'
                                      : 'bg-white dark:bg-[#0A1C2A] border-slate-200 dark:border-[#16364D] hover:border-sky-400 shadow-2xs'
                                  }`}
                                >
                                  {/* Irrigation Specimen Image */}
                                  <div className="relative h-20 sm:h-22 w-full overflow-hidden bg-slate-900">
                                    <img
                                      src={method.imageUrl}
                                      alt={method.name[language]}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 brightness-95"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                                    {/* Inline Speaker */}
                                    <div className="absolute top-1.5 left-1.5 z-10">
                                      <FieldVoiceSpeaker scriptKey={`irrigation_${methodKey}`} size="sm" />
                                    </div>

                                    {/* Selected Checkmark */}
                                    {isSelected && (
                                      <div className="absolute top-1.5 right-1.5 z-10 p-0.5 rounded-full bg-sky-500 text-white shadow-xs">
                                        <Check className="w-3 h-3" />
                                      </div>
                                    )}

                                    {/* Efficiency Badge */}
                                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[9px] font-mono text-white/90">
                                      <span className="bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-md font-semibold text-sky-300">
                                        {method.efficiencyPercent}% {language === 'bn' ? 'দক্ষতা' : language === 'hi' ? 'दक्षता' : 'Efficiency'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Card Body */}
                                  <div className="p-2.5 space-y-1">
                                    <div className="text-xs font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
                                      {method.name[language]}
                                    </div>
                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                      {method.waterSavingsBadge[language]}
                                    </div>
                                    <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] leading-tight line-clamp-2">
                                      {method.description[language]}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
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
                    <span>{t.addPlot}</span>
                  </button>
                )}

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D2232] border border-slate-200 dark:border-[#16364D] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8] font-medium">{t.totalFarmArea}:</span>{' '}
                    <strong className="text-slate-900 dark:text-[#F0F9FF] font-mono text-sm">
                      {totalCalculatedAreaM2.toLocaleString()} m²
                    </strong>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {plots.length} {plots.length === 1 ? t.cropBlockSingular : t.cropBlockPlural}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: WATER RESERVE & STORAGE */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-sky-600 dark:text-[#38BDF8] shrink-0" />
                      <span className="truncate">{t.reserveStep}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                      {t.stepReserveSubtitle}
                    </p>
                  </div>
                  <FieldVoiceSpeaker scriptKey="step4_overview" className="shrink-0" />
                </div>

                {/* Storage type selection cards with embedded audio headers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setStorageType('sintex_tank')}
                    className={`relative p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 ${
                      storageType === 'sintex_tank'
                        ? 'bg-sky-50/70 dark:bg-[#102A3E] border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                        : 'bg-white dark:bg-[#0D2232] border-slate-200 dark:border-[#16364D] hover:border-sky-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="p-2 rounded-lg bg-sky-100/80 dark:bg-sky-950/60 text-sky-600 dark:text-[#38BDF8] shrink-0">
                        <Cylinder className="w-4 h-4" />
                      </div>
                      <FieldVoiceSpeaker scriptKey="storage_sintex_tank" size="sm" className="shrink-0" />
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
                        {t.storageBorewell}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                        {language === 'bn' ? 'স্ট্যান্ডার্ড পিভিসি / সিনটেক্স ট্যাংক' : language === 'hi' ? 'मानक पीवीसी / सिंटेक्स टैंक' : 'Standard PVC / Sintex Tank'}
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setStorageType('custom_sump')}
                    className={`relative p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 ${
                      storageType === 'custom_sump'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white dark:bg-[#0D2232] border-slate-200 dark:border-[#16364D] hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="p-2 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Waves className="w-4 h-4" />
                      </div>
                      <FieldVoiceSpeaker scriptKey="storage_custom_sump" size="sm" className="shrink-0" />
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
                        {t.storagePond}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                        {language === 'bn' ? 'কাস্টম আয়তনের জলাধার / পাকা চৌবাচ্চা' : language === 'hi' ? 'कस्टम वॉल्यूम जलाशय / पक्का हौज' : 'Custom Reservoir / Open Sump'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overhead tank slider */}
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
                            onClick={() => setTankCapacity(cap)}
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
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{fillPercent}% {t.gaugeFull}</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={fillPercent}
                        onChange={(e) => setFillPercent(parseInt(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] flex justify-between font-mono">
                        <span>{t.gaugeLow}</span>
                        <span>{t.gaugeAvailable} <strong className="text-slate-900 dark:text-[#F0F9FF]">{Math.round((tankCapacity * fillPercent) / 100).toLocaleString()} L</strong></span>
                        <span>{t.gaugeFull}</span>
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

                {/* Pump power */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-[#94A3B8]">
                    <div className="flex items-center gap-2 min-w-0">
                      <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-[#CBD5E1] truncate">
                        {t.pumpPowerLabel}
                      </span>
                      <span className="hidden sm:inline-flex text-[11px] font-mono font-bold text-sky-600 dark:text-[#38BDF8] bg-sky-50 dark:bg-[#071724] px-2 py-0.5 rounded-md border border-sky-200 dark:border-[#16364D] shrink-0">
                        {pumpHp} HP
                      </span>
                    </div>
                    <FieldVoiceSpeaker scriptKey="pump_hp" size="sm" className="shrink-0" />
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

            {/* Bottom Form Navigation Action Bar */}
            <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-100 dark:border-[#16364D]/60">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as any)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#16364D] hover:bg-slate-100 dark:hover:bg-[#112B3E] text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t.prevStep}</span>
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s + 1) as any)}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <span>{t.saveAndContinue}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  className="min-h-[44px] px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.finishSetup}</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Live Parcel Summary Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-500" />
                {t.liveParcelSummary}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            </h3>

            <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-[#16364D]/60">
              <div className="pt-1 flex items-start justify-between gap-2">
                <span className="text-slate-500 dark:text-[#94A3B8]">{t.locationStep}:</span>
                <span className="font-semibold text-slate-900 dark:text-[#F0F9FF] text-right truncate max-w-[180px]">
                  {district || 'Bardhaman'}, {stateName || 'India'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-[#94A3B8]">{t.selectedCoordinates}</span>
                <span className="font-mono text-[11px] text-sky-600 dark:text-[#38BDF8] font-bold">
                  {lat.toFixed(3)}°, {lon.toFixed(3)}°
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-[#94A3B8]">{t.soilStep}:</span>
                <span className="font-semibold text-slate-900 dark:text-[#F0F9FF]">
                  {soilTexture === 'loamy' ? t.alluvialName : soilTexture === 'sandy' ? t.sandyLoamName : t.blackClayName}
                </span>
              </div>

              <div className="pt-2 flex items-start justify-between gap-2">
                <span className="text-slate-500 dark:text-[#94A3B8]">{t.cropStep}:</span>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-[#F0F9FF] block">
                    {plots.map(p => localizeCrop(p.cropName, language)).join(', ')}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    {totalCalculatedAreaM2.toLocaleString()} m² ({plots.length} {plots.length === 1 ? t.sectionSingular : t.sectionPlural})
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-[#94A3B8]">{t.reserveStep}:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-[#F0F9FF]">
                  {storageType === 'custom_sump'
                    ? `${calculateSumpVolumeLiters(sumpLength, sumpWidth, sumpDepth).toLocaleString()} L`
                    : `${tankCapacity.toLocaleString()} L`} • {pumpHp} HP
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
