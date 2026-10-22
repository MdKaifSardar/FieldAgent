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
  Calendar
} from 'lucide-react';
import { LocationMapPicker } from '../map/LocationMapPicker';
import { computeBaselineDepletionFromDate } from '../../core/fao56';

interface StepperWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (farm: FarmProfile) => void;
  initialFarm?: FarmProfile | null;
}

export function StepperWizard({ isOpen, onClose, onSubmit, initialFarm }: StepperWizardProps) {
  const { t, language } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // STEP 1: Location state
  const [queryLocation, setQueryLocation] = useState(
    initialFarm?.location.villageOrPincode || ''
  );
  const [lat, setLat] = useState(initialFarm?.location.latitude || 23.2324);
  const [lon, setLon] = useState(initialFarm?.location.longitude || 87.8615);
  const [district, setDistrict] = useState(initialFarm?.location.district || '');
  const [stateName, setStateName] = useState(initialFarm?.location.state || '');
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

  // Handle selecting an autocomplete suggestion
  const handleSelectSuggestion = (sug: LocationSuggestion) => {
    setQueryLocation(sug.displayName);
    setLat(sug.latitude);
    setLon(sug.longitude);
    setDistrict(sug.district || 'Selected Region');
    setStateName(sug.state || 'India');
    setIsDropdownOpen(false);
    setLocationFeedback(`Locked onto ${sug.displayName}`);
  };

  // Keyboard navigation for suggestions
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
  const [soilTexture, setSoilTexture] = useState<SoilTexture>(
    initialFarm?.soil.texture || 'loamy'
  );

  // STEP 3: Multi-Plot / Multi-Crop Field Sections State
  const [plots, setPlots] = useState<{
    id: string;
    cropName: string;
    growthStage: 'initial' | 'development' | 'mid_season' | 'late_season';
    areaValue: number;
    areaUnit: AreaUnit;
    irrigationMethod: IrrigationMethod;
    lastIrrigationDate?: string;
  }[]>([
    {
      id: 'plot-primary-01',
      cropName: initialFarm?.plots[0]?.cropName || 'Tomato',
      growthStage: initialFarm?.plots[0]?.growthStage || 'mid_season',
      areaValue: initialFarm?.plots[0]?.areaValue || 1.5,
      areaUnit: initialFarm?.plots[0]?.areaUnit || 'bigha',
      irrigationMethod: initialFarm?.plots[0]?.irrigationMethod || 'drip',
      lastIrrigationDate: initialFarm?.plots[0]?.lastIrrigationDate || new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    },
  ]);

  // Sync state whenever modal opens or initialFarm changes
  useEffect(() => {
    if (isOpen && initialFarm) {
      setQueryLocation(initialFarm.location.displayName || initialFarm.location.villageOrPincode || '');
      setLat(initialFarm.location.latitude);
      setLon(initialFarm.location.longitude);
      setDistrict(initialFarm.location.district || '');
      setStateName(initialFarm.location.state || '');
      setSoilTexture(initialFarm.soil.texture);

      if (initialFarm.plots && initialFarm.plots.length > 0) {
        setPlots(
          initialFarm.plots.map((p, idx) => ({
            id: p.id || `plot-${idx + 1}`,
            cropName: p.cropName,
            growthStage: p.growthStage,
            areaValue: p.areaValue,
            areaUnit: p.areaUnit,
            irrigationMethod: p.irrigationMethod,
            lastIrrigationDate: p.lastIrrigationDate || new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
          }))
        );
      }

      setStorageType(initialFarm.reserve.storageType);
      setTankCapacity(initialFarm.reserve.totalCapacity_liters);
      if (initialFarm.reserve.sumpDimensions) {
        setSumpLength(initialFarm.reserve.sumpDimensions.length_m);
        setSumpWidth(initialFarm.reserve.sumpDimensions.width_m);
        setSumpDepth(initialFarm.reserve.sumpDimensions.waterDepth_m);
      }
      if (initialFarm.reserve.pumpPower_hp) {
        setPumpHp(initialFarm.reserve.pumpPower_hp);
      }
    }
  }, [isOpen, initialFarm]);

  // Multi-plot management handlers
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
        lastIrrigationDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
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
      lastIrrigationDate: string;
    }>
  ) => {
    setPlots((prev) => prev.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  };

  // STEP 4: Water Reserve state
  const [storageType, setStorageType] = useState<StorageTier>(
    initialFarm?.reserve.storageType || 'sintex_tank'
  );
  const [tankCapacity, setTankCapacity] = useState(
    initialFarm?.reserve.totalCapacity_liters || 5000
  );
  const [fillPercent, setFillPercent] = useState(70);

  // Custom sump geometry
  const [sumpLength, setSumpLength] = useState(3.0);
  const [sumpWidth, setSumpWidth] = useState(2.0);
  const [sumpDepth, setSumpDepth] = useState(1.5);

  // Pump & flow
  const [pumpHp, setPumpHp] = useState(initialFarm?.reserve.pumpPower_hp || 5.0);

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
      setLocationFeedback(`GPS locked within ${Math.round(coords.accuracy_m)}m accuracy.`);
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
      setLocationFeedback(`Location resolved to coordinates: ${res.location.latitude.toFixed(3)}, ${res.location.longitude.toFixed(3)}`);
    } catch (err: any) {
      setLocationFeedback('Could not resolve location. Using fallback coordinates.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Live Map Drag / Tap Repositioning Handler
  const handleMapLocationChange = (newLat: number, newLon: number, resolvedName?: string) => {
    setLat(newLat);
    setLon(newLon);
    if (resolvedName) {
      setQueryLocation(resolvedName);
      setLocationFeedback(`Plot pinned: ${resolvedName} (${newLat.toFixed(4)}°, ${newLon.toFixed(4)}°)`);
    } else {
      setLocationFeedback(`Plot coordinates refined: ${newLat.toFixed(4)}° N, ${newLon.toFixed(4)}° E`);
    }
  };

  // Agronomic parameters lookup helper for any crop & growth stage
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

  // Final Form Submission
  const handleComplete = () => {
    const awc_mm_per_m = soilTexture === 'sandy' ? 90 : soilTexture === 'clay_black' ? 180 : 150;
    const infiltration_rate_mm_hr = soilTexture === 'sandy' ? 25 : soilTexture === 'clay_black' ? 8 : 15;

    // Determine available water reserve
    let totalCap = tankCapacity;
    let availableLiters = Math.round((tankCapacity * fillPercent) / 100);

    if (storageType === 'custom_sump') {
      totalCap = calculateSumpVolumeLiters(sumpLength, sumpWidth, sumpDepth);
      availableLiters = Math.round((totalCap * fillPercent) / 100);
    }

    // Map each user configured plot section to a full CropBlock
    const default5DaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const mappedPlots: CropBlock[] = plots.map((p, idx) => {
      const { rootDepth_m, cropCoefficient_Kc, depletionFraction_p } = getCropAgronomicParams(
        p.cropName,
        p.growthStage
      );
      const area_sq_meters = normalizeAreaToSqMeters(p.areaValue, p.areaUnit);
      const plotLastIrrigation = p.lastIrrigationDate || default5DaysAgo;

      const baseline = computeBaselineDepletionFromDate({
        awc_mm_per_m,
        rootDepth_m,
        cropCoefficient_Kc,
        dailyEt0_mm: 3.5, // Reference baseline ET0
        lastIrrigationDate: plotLastIrrigation,
        todayDate: todayStr,
      });

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
        currentDepletion_mm: baseline.currentDepletion_mm,
        irrigationMethod: p.irrigationMethod,
        lastIrrigationDate: plotLastIrrigation,
        lastCalculationDate: todayStr,
      };
    });

    const cropSummary = Array.from(new Set(plots.map((p) => p.cropName))).join(' & ');
    const farm: FarmProfile = {
      id: initialFarm?.id || `farm-${Date.now()}`,
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
        knownFlowRate_liters_per_hr: pumpHp * 1200, // Benchmark: ~1,200 L/hr per HP at 30m head
      },
      plots: mappedPlots,
      createdAt: initialFarm?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSubmit(farm);
    onClose();
  };

  const totalCalculatedAreaM2 = plots.reduce(
    (acc, p) => acc + normalizeAreaToSqMeters(p.areaValue, p.areaUnit),
    0
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-[#E1E6DE] dark:border-[#1E3022] bg-[#F7F8F3] dark:bg-[#0E1711] p-4 sm:p-6 shadow-2xl relative my-auto text-[#111C15] dark:text-[#ECF2EC]">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E1E6DE] dark:border-[#1E3022]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#2D6A4F] dark:text-[#52B788] uppercase tracking-wider">
                Step {step} of 4
              </span>
              <span className="text-xs text-[#8FA394]">•</span>
              <span className="text-xs text-[#526356] dark:text-[#8FA394]">{t.onboardingSubtitle}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#111C15] dark:text-[#ECF2EC] font-['Outfit'] flex items-center gap-2">
              {step === 1 && (
                <>
                  <MapPin className="w-5 h-5 text-[#2D6A4F] dark:text-[#52B788] shrink-0" />
                  <span>{t.locationStep}</span>
                </>
              )}
              {step === 2 && (
                <>
                  <Layers className="w-5 h-5 text-[#D97706] dark:text-[#FBBF24] shrink-0" />
                  <span>{t.soilStep}</span>
                </>
              )}
              {step === 3 && (
                <>
                  <Sprout className="w-5 h-5 text-[#2D6A4F] dark:text-[#52B788] shrink-0" />
                  <span>{t.cropStep}</span>
                </>
              )}
              {step === 4 && (
                <>
                  <Droplets className="w-5 h-5 text-[#1D4E89] dark:text-[#64B5F6] shrink-0" />
                  <span>{t.reserveStep}</span>
                </>
              )}
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#526356] dark:text-[#8FA394] hover:text-[#111C15] dark:hover:text-white hover:bg-[#EAEFE8] dark:hover:bg-[#152319] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Stepper Line */}
        <div className="grid grid-cols-4 gap-1.5 my-4">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 rounded-full transition-all ${
                s <= step ? 'bg-[#2D6A4F] dark:bg-[#52B788]' : 'bg-[#E1E6DE] dark:border-[#1E3022]'
              }`} 
            />
          ))}
        </div>

        {/* STEP 1: FIELD LOCATION */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-[#526356] dark:text-[#8FA394]">
              FieldGuard pulls live meteorological and rainfall forecasts from Open-Meteo for your coordinates.
            </p>

            {/* Search as you type with live autocomplete popover */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-[#526356] dark:text-[#8FA394] uppercase tracking-wider flex items-center justify-between">
                <span>{t.searchLocationPrompt}</span>
                {isLoadingSuggestions && (
                  <span className="text-[10px] text-[#2D6A4F] dark:text-[#52B788] font-mono flex items-center gap-1 font-normal">
                    <Loader2 className="w-3 h-3 animate-spin" /> {t.locatingGPS}
                  </span>
                )}
              </label>

              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[#8FA394] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={queryLocation}
                  onChange={(e) => setQueryLocation(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setIsDropdownOpen(true);
                  }}
                  placeholder="e.g. Bardhaman, 713101, Nashik, or Galsi..."
                  className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-white dark:bg-[#121E15] border border-[#D5DFD3] dark:border-[#223828] text-sm text-[#111C15] dark:text-[#ECF2EC] focus:outline-none focus:border-[#2D6A4F] dark:focus:border-[#52B788] placeholder:text-[#8FA394]"
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
                      className="p-1 text-[#8FA394] hover:text-[#111C15] dark:hover:text-white transition-colors cursor-pointer"
                      title="Clear input"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSearchLocation}
                    disabled={isSearchingLocation}
                    className="px-2.5 py-1 rounded-lg bg-[#2D6A4F] hover:bg-[#1B4332] text-[11px] font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSearchingLocation ? '...' : t.findBtn}
                  </button>
                </div>
              </div>

              {/* Floating Autocomplete Popover (Top-ranking Indian locations) */}
              {isDropdownOpen && suggestions.length > 0 && (
                <div 
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-white/95 dark:bg-[#121E15]/95 backdrop-blur-xl border border-[#D5DFD3] dark:border-[#223828] shadow-2xl overflow-hidden divide-y divide-[#E1E6DE] dark:divide-[#1E3022] animate-in fade-in slide-in-from-top-1"
                >
                  <div className="px-3 py-1.5 bg-[#F0F4EE] dark:bg-[#1A2A1E] text-[10px] font-semibold text-[#526356] dark:text-[#8FA394] flex items-center justify-between uppercase tracking-wider">
                    <span>{t.indianSuggestions}</span>
                    <span className="font-mono text-[9px] text-[#8FA394]">Tap or Press Enter</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {suggestions.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className={`w-full min-h-[44px] px-3.5 py-2.5 text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                          selectedIndex === idx
                            ? 'bg-[#2D6A4F]/10 dark:bg-[#52B788]/20 text-[#111C15] dark:text-white'
                            : 'hover:bg-[#F0F4EE] dark:hover:bg-[#1A2A1E] text-[#526356] dark:text-[#C5D3C8]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-[#EAEFE8] dark:bg-[#1A2A1E] text-[#2D6A4F] dark:text-[#52B788] shrink-0">
                            {item.type === 'pincode' ? (
                              <Hash className="w-3.5 h-3.5 text-[#D97706]" />
                            ) : item.type === 'district' ? (
                              <Building2 className="w-3.5 h-3.5 text-[#1D4E89]" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-[#2D6A4F]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#111C15] dark:text-[#ECF2EC] truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-[#526356] dark:text-[#8FA394] truncate">
                              {[item.district, item.state].filter(Boolean).join(', ')}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-[#2D6A4F] dark:text-[#52B788] font-semibold block">
                            {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                          </span>
                          <span className="text-[9px] uppercase font-bold text-[#8FA394]">
                            {item.type}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 h-px bg-[#E1E6DE] dark:bg-[#1E3022]" />
              <span className="text-[11px] text-[#8FA394] uppercase font-semibold">OR</span>
              <div className="flex-1 h-px bg-[#E1E6DE] dark:bg-[#1E3022]" />
            </div>

            {/* 1-Tap Browser GPS Button */}
            <button
              type="button"
              onClick={handleGPSDetect}
              disabled={isLocatingGPS}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-[#2D6A4F]/10 hover:bg-[#2D6A4F]/20 dark:bg-[#52B788]/15 dark:hover:bg-[#52B788]/25 border border-[#2D6A4F]/30 dark:border-[#52B788]/30 text-[#1B4332] dark:text-[#74C69D] text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Compass className={`w-4 h-4 ${isLocatingGPS ? 'animate-spin' : ''}`} />
              <span>{isLocatingGPS ? t.gpsLocating : t.gpsButton}</span>
            </button>

            {locationFeedback && (
              <div className="p-2.5 rounded-lg bg-[#EAEFE8] dark:bg-[#152319] border border-[#D5DFD3] dark:border-[#223828] text-xs text-[#2D6A4F] dark:text-[#52B788]">
                {locationFeedback}
              </div>
            )}

            {/* Live Interactive Map Preview */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#526356] dark:text-[#8FA394] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
                  <span>Live Parcel Map (Drag Pin or Tap to Set)</span>
                </span>
                <span className="text-[11px] font-mono text-[#2D6A4F] dark:text-[#52B788]">
                  {lat.toFixed(4)}°, {lon.toFixed(4)}°
                </span>
              </div>
              
              <LocationMapPicker
                latitude={lat}
                longitude={lon}
                onChangeLocation={handleMapLocationChange}
                interactive={true}
                height="220px"
              />
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#121E15] border border-[#E1E6DE] dark:border-[#1E3022] text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#526356] dark:text-[#8FA394]">Selected Coordinates:</span>
                <span className="font-mono text-[#2D6A4F] dark:text-[#52B788] font-bold">
                  {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
                </span>
              </div>
              <div className="text-[11px] text-[#526356] dark:text-[#8FA394]">
                Region: <span className="text-[#111C15] dark:text-[#ECF2EC] font-semibold">{district || 'Local Cluster'}</span>, State: <span className="text-[#111C15] dark:text-[#ECF2EC] font-semibold">{stateName || 'India'}</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SOIL TEXTURE SELECTION */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-[#526356] dark:text-[#8FA394]">
              {t.stepSoilSubtitle}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Sandy Tile */}
              <button
                type="button"
                onClick={() => setSoilTexture('sandy')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                  soilTexture === 'sandy'
                    ? 'bg-[#D97706]/10 border-[#D97706] ring-2 ring-[#D97706]/30 text-[#92400E] dark:text-[#FCD34D]'
                    : 'bg-white dark:bg-[#121E15] border-[#E1E6DE] dark:border-[#1E3022] text-[#526356] dark:text-[#8FA394] hover:border-[#D97706]/40'
                }`}
              >
                <div>
                  <div className="text-base font-bold flex items-center justify-between text-[#111C15] dark:text-[#ECF2EC]">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] inline-block shadow-sm" />
                      <span>{t.sandyLoamName}</span>
                    </span>
                    {soilTexture === 'sandy' && <Check className="w-4 h-4 text-[#D97706]" />}
                  </div>
                  <div className="text-[11px] text-[#526356] dark:text-[#8FA394] mt-1">{t.sandyLoamDesc}</div>
                </div>
                <div className="text-[11px] font-mono text-[#D97706] font-semibold mt-2">
                  AWC: 90 mm/m
                </div>
              </button>

              {/* Loamy Tile (Default / Recommended) */}
              <button
                type="button"
                onClick={() => setSoilTexture('loamy')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                  soilTexture === 'loamy'
                    ? 'bg-[#2D6A4F]/10 border-[#2D6A4F] ring-2 ring-[#2D6A4F]/30 text-[#1B4332] dark:text-[#74C69D]'
                    : 'bg-white dark:bg-[#121E15] border-[#E1E6DE] dark:border-[#1E3022] text-[#526356] dark:text-[#8FA394] hover:border-[#2D6A4F]/40'
                }`}
              >
                <div>
                  <div className="text-base font-bold flex items-center justify-between text-[#111C15] dark:text-[#ECF2EC]">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F] inline-block shadow-sm" />
                      <span>{t.alluvialName}</span>
                    </span>
                    {soilTexture === 'loamy' && <Check className="w-4 h-4 text-[#2D6A4F]" />}
                  </div>
                  <div className="text-[11px] text-[#526356] dark:text-[#8FA394] mt-1">{t.alluvialDesc}</div>
                </div>
                <div className="text-[11px] font-mono text-[#2D6A4F] dark:text-[#52B788] font-semibold mt-2">
                  AWC: 150 mm/m (Ideal)
                </div>
              </button>

              {/* Clay / Black Soil */}
              <button
                type="button"
                onClick={() => setSoilTexture('clay_black')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                  soilTexture === 'clay_black'
                    ? 'bg-[#1D4E89]/10 border-[#1D4E89] ring-2 ring-[#1D4E89]/30 text-[#0C2D57] dark:text-[#90CAF9]'
                    : 'bg-white dark:bg-[#121E15] border-[#E1E6DE] dark:border-[#1E3022] text-[#526356] dark:text-[#8FA394] hover:border-[#1D4E89]/40'
                }`}
              >
                <div>
                  <div className="text-base font-bold flex items-center justify-between text-[#111C15] dark:text-[#ECF2EC]">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1D4E89] inline-block shadow-sm" />
                      <span>{t.blackClayName}</span>
                    </span>
                    {soilTexture === 'clay_black' && <Check className="w-4 h-4 text-[#1D4E89]" />}
                  </div>
                  <div className="text-[11px] text-[#526356] dark:text-[#8FA394] mt-1">{t.blackClayDesc}</div>
                </div>
                <div className="text-[11px] font-mono text-[#1D4E89] dark:text-[#64B5F6] font-semibold mt-2">
                  AWC: 180 mm/m
                </div>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#121E15] border border-[#E1E6DE] dark:border-[#1E3022] text-xs text-[#526356] dark:text-[#8FA394] flex items-start gap-2">
              <Info className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788] shrink-0 mt-0.5" />
              <span>
                <strong>AWC (Available Water Capacity)</strong> indicates how many millimetres of water 1 metre of this soil can store before draining.
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: MULTI-CROP & FIELD SECTIONS */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#4D6653] dark:text-[#8FA894]">
                {t.stepCropSubtitle}. You can configure multiple plots with distinct crops and irrigation methods.
              </p>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] dark:text-[#4ADE80] border border-[#16A34A]/25 shrink-0 ml-2">
                {plots.length} {plots.length === 1 ? 'Section' : 'Sections'}
              </span>
            </div>

            {/* List of Cultivated Plot Sections */}
            <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
              {plots.map((plot, index) => {
                const plotAreaM2 = normalizeAreaToSqMeters(plot.areaValue, plot.areaUnit);
                const sectionLetter = String.fromCharCode(65 + index);

                return (
                  <div
                    key={plot.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] space-y-3.5 shadow-xs"
                  >
                    {/* Section Card Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#E1E8DE] dark:border-[#1F2D24]">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold font-mono">
                          {sectionLetter}
                        </span>
                        <div>
                          <span className="text-sm font-bold text-[#121C15] dark:text-[#F0F4F1] font-['Outfit']">
                            Section {sectionLetter}: {plot.cropName}
                          </span>
                          <span className="text-[10px] text-[#4D6653] dark:text-[#8FA894] ml-2 font-mono">
                            ({plot.areaValue} {plot.areaUnit} • {plotAreaM2.toLocaleString()} m²)
                          </span>
                        </div>
                      </div>

                      {plots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlot(index)}
                          className="text-xs text-[#C2410C] hover:text-[#9A3412] dark:text-[#FB923C] font-semibold px-2.5 py-1 rounded-lg bg-[#C2410C]/10 hover:bg-[#C2410C]/20 transition-colors cursor-pointer flex items-center gap-1"
                          title="Remove this field section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.removePlot}</span>
                        </button>
                      )}
                    </div>

                    {/* Crop Selector Chips */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#4D6653] dark:text-[#8FA894] uppercase tracking-wider">
                        Select Crop
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { id: 'Spinach', label: localizeCrop('Spinach', language) },
                          { id: 'Wheat', label: localizeCrop('Wheat', language) },
                          { id: 'Paddy', label: localizeCrop('Paddy', language) },
                          { id: 'Potato', label: localizeCrop('Potato', language) },
                          { id: 'Tomato', label: localizeCrop('Tomato', language) },
                          { id: 'Mustard', label: localizeCrop('Mustard', language) },
                          { id: 'Onion', label: localizeCrop('Onion', language) },
                          { id: 'Chilli', label: localizeCrop('Chilli', language) },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleUpdatePlot(index, { cropName: c.id })}
                            className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                              plot.cropName === c.id
                                ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs'
                                : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#4D6653] dark:text-[#8FA894] hover:border-[#16A34A]/40'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Growth Stage Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#4D6653] dark:text-[#8FA894] uppercase tracking-wider">
                        Crop Growth Stage
                      </label>
                      <select
                        value={plot.growthStage}
                        onChange={(e) =>
                          handleUpdatePlot(index, {
                            growthStage: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] text-xs text-[#121C15] dark:text-[#F0F4F1] focus:outline-none focus:border-[#16A34A]"
                      >
                        <option value="initial">Initial Stage (Germination / Seedling)</option>
                        <option value="development">Vegetative Development</option>
                        <option value="mid_season">Mid-Season (Flowering & Fruit Set — Peak Water)</option>
                        <option value="late_season">Late Season (Ripening & Harvest)</option>
                      </select>
                    </div>

                    {/* Land Area and Regional Unit Converter */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#4D6653] dark:text-[#8FA894] uppercase tracking-wider">
                        Field Section Area
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={plot.areaValue}
                          onChange={(e) =>
                            handleUpdatePlot(index, {
                              areaValue: parseFloat(e.target.value) || 0.1,
                            })
                          }
                          className="w-1/2 px-3 py-2 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] text-xs text-[#121C15] dark:text-[#F0F4F1] focus:outline-none focus:border-[#16A34A] font-mono"
                        />
                        <select
                          value={plot.areaUnit}
                          onChange={(e) =>
                            handleUpdatePlot(index, {
                              areaUnit: e.target.value as AreaUnit,
                            })
                          }
                          className="w-1/2 px-3 py-2 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] text-xs text-[#121C15] dark:text-[#F0F4F1] focus:outline-none focus:border-[#16A34A]"
                        >
                          <option value="bigha">Bigha (~1,338 m² East)</option>
                          <option value="acre">Acre (~4,047 m²)</option>
                          <option value="guntha">Guntha (~101 m² West)</option>
                          <option value="cent">Cent (~40.5 m² South)</option>
                          <option value="hectare">Hectare (10,000 m²)</option>
                          <option value="sq_meters">Square Metres (m²)</option>
                        </select>
                      </div>
                      <div className="text-[10px] text-[#16A34A] dark:text-[#4ADE80] font-mono">
                        Normalized Section Area: <strong>{plotAreaM2.toLocaleString()} m²</strong>
                      </div>
                    </div>

                    {/* Irrigation Method Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#4D6653] dark:text-[#8FA894] uppercase tracking-wider">
                        {t.irrigationMethod}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdatePlot(index, { irrigationMethod: 'drip' })}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                            plot.irrigationMethod === 'drip'
                              ? 'bg-[#16A34A]/15 border-[#16A34A] text-[#16A34A] dark:text-[#4ADE80]'
                              : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#4D6653] dark:text-[#8FA894]'
                          }`}
                        >
                          <div>{t.drip}</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdatePlot(index, { irrigationMethod: 'sprinkler' })}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                            plot.irrigationMethod === 'sprinkler'
                              ? 'bg-[#0284C7]/15 border-[#0284C7] text-[#0284C7] dark:text-[#38BDF8]'
                              : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#4D6653] dark:text-[#8FA894]'
                          }`}
                        >
                          <div>{t.sprinkler}</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdatePlot(index, { irrigationMethod: 'surface_flood' })}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                            plot.irrigationMethod === 'surface_flood'
                              ? 'bg-[#D97706]/15 border-[#D97706] text-[#D97706] dark:text-[#FBBF24]'
                              : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#4D6653] dark:text-[#8FA894]'
                          }`}
                        >
                          <div>{t.flood}</div>
                        </button>
                      </div>
                    </div>

                    {/* Baseline Irrigation Timeline Setup */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-semibold text-[#4D6653] dark:text-[#8FA894] uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>{t.lastIrrigationPrompt}</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { daysAgo: 1, label: t.lastWateredToday },
                          { daysAgo: 3, label: t.lastWatered3Days },
                          { daysAgo: 5, label: t.lastWatered5Days },
                        ].map((preset) => {
                          const presetDate = new Date(Date.now() - preset.daysAgo * 86400000).toISOString().split('T')[0];
                          const isSelected = plot.lastIrrigationDate === presetDate;

                          return (
                            <button
                              key={preset.daysAgo}
                              type="button"
                              onClick={() => handleUpdatePlot(index, { lastIrrigationDate: presetDate })}
                              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                                isSelected
                                  ? 'bg-[#16A34A]/15 border-[#16A34A] text-[#16A34A] dark:text-[#4ADE80] shadow-xs'
                                  : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#4D6653] dark:text-[#8FA894] hover:border-[#16A34A]/40'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}

                        {/* Custom Date Input */}
                        <div className="relative">
                          <input
                            type="date"
                            max={new Date().toISOString().split('T')[0]}
                            value={plot.lastIrrigationDate || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleUpdatePlot(index, { lastIrrigationDate: e.target.value });
                              }
                            }}
                            className="w-full py-1.5 px-2 rounded-xl text-xs font-bold border bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#121C15] dark:text-[#F0F4F1] focus:outline-none focus:border-[#16A34A] text-center cursor-pointer"
                            title={t.customDate}
                          />
                        </div>
                      </div>
                      <div className="text-[10px] text-[#4D6653] dark:text-[#8FA894] flex items-center justify-between">
                        <span>
                          {t.lastWateredLabel}: <strong className="text-[#16A34A] dark:text-[#4ADE80] font-mono">{plot.lastIrrigationDate || '5 days ago'}</strong>
                        </span>
                        <span className="text-[9px] text-slate-400">Baseline soil deficit calculated dynamically</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* + Add Another Plot Section Button */}
            {plots.length < 6 && (
              <button
                type="button"
                onClick={handleAddPlot}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border-2 border-dashed border-[#16A34A]/40 hover:border-[#16A34A] bg-[#16A34A]/5 hover:bg-[#16A34A]/10 text-[#16A34A] dark:text-[#4ADE80] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addPlot}</span>
              </button>
            )}

            {/* Aggregated Total Land Area Summary */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] flex items-center justify-between text-xs shadow-xs">
              <div>
                <span className="text-[#4D6653] dark:text-[#8FA894] font-medium">{t.totalFarmArea}:</span>{' '}
                <strong className="text-[#121C15] dark:text-[#F0F4F1] font-mono text-sm">
                  {totalCalculatedAreaM2.toLocaleString()} m²
                </strong>
              </div>
              <div className="text-[11px] font-semibold text-[#16A34A] dark:text-[#4ADE80]">
                {plots.length} {plots.length === 1 ? 'Crop Block' : 'Crop Blocks'}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: WATER RESERVE & STORAGE */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-xs text-[#526356] dark:text-[#8FA394]">
              {t.stepReserveSubtitle}
            </p>

            {/* Storage Type Tabs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStorageType('sintex_tank')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  storageType === 'sintex_tank'
                    ? 'bg-[#1D4E89]/15 border-[#1D4E89] text-[#0C2D57] dark:text-[#90CAF9]'
                    : 'bg-white dark:bg-[#121E15] border-[#E1E6DE] dark:border-[#1E3022] text-[#526356] dark:text-[#8FA394]'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Cylinder className="w-4 h-4 shrink-0" />
                  <span>{t.storageBorewell}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStorageType('custom_sump')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  storageType === 'custom_sump'
                    ? 'bg-[#2D6A4F]/15 border-[#2D6A4F] text-[#1B4332] dark:text-[#74C69D]'
                    : 'bg-white dark:bg-[#121E15] border-[#E1E6DE] dark:border-[#1E3022] text-[#526356] dark:text-[#8FA394]'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Waves className="w-4 h-4 shrink-0" />
                  <span>{t.storagePond}</span>
                </span>
              </button>
            </div>

            {/* Tier 1: Standard Tank Slider */}
            {storageType === 'sintex_tank' && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#121E15] border border-[#E1E6DE] dark:border-[#1E3022] space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#526356] dark:text-[#8FA394]">
                    <span>Tank Capacity</span>
                    <span className="font-bold text-[#1D4E89] dark:text-[#64B5F6] font-mono">{tankCapacity.toLocaleString()} Litres</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[1000, 2000, 5000, 10000].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setTankCapacity(cap)}
                        className={`py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                          tankCapacity === cap
                            ? 'bg-[#1D4E89] text-white border-[#1D4E89]'
                            : 'bg-[#F0F4EE] dark:bg-[#1A2A1E] border-[#D5DFD3] dark:border-[#223828] text-[#526356] dark:text-[#8FA394]'
                        }`}
                      >
                        {cap / 1000}k Litres
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs text-[#526356] dark:text-[#8FA394]">
                    <span>Visual Fill Level Gauge</span>
                    <span className="font-bold text-[#2D6A4F] dark:text-[#52B788] font-mono">{fillPercent}% Full</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={fillPercent}
                    onChange={(e) => setFillPercent(parseInt(e.target.value))}
                    className="w-full accent-[#2D6A4F]"
                  />
                  <div className="text-[11px] text-[#526356] dark:text-[#8FA394] flex justify-between">
                    <span>Low (10%)</span>
                    <span>Available: <strong className="text-[#111C15] dark:text-[#ECF2EC]">{Math.round((tankCapacity * fillPercent) / 100).toLocaleString()} L</strong></span>
                    <span>Full (100%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tier 2: Custom Sump Geometric Calculator */}
            {storageType === 'custom_sump' && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#121E15] border border-[#E1E6DE] dark:border-[#1E3022] space-y-3">
                <div className="text-xs font-semibold text-[#2D6A4F] dark:text-[#52B788] flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Geometric Volume Calculator (L × W × D)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-[#526356] dark:text-[#8FA394] uppercase">Length (m)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={sumpLength}
                      onChange={(e) => setSumpLength(parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#121E15] border border-[#D5DFD3] dark:border-[#223828] text-xs text-[#111C15] dark:text-[#ECF2EC]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#526356] dark:text-[#8FA394] uppercase">Width (m)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={sumpWidth}
                      onChange={(e) => setSumpWidth(parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#121E15] border border-[#D5DFD3] dark:border-[#223828] text-xs text-[#111C15] dark:text-[#ECF2EC]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#526356] dark:text-[#8FA394] uppercase">Depth (m)</label>
                    <input
                      type="number"
                      step="0.2"
                      value={sumpDepth}
                      onChange={(e) => setSumpDepth(parseFloat(e.target.value) || 0.5)}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#121E15] border border-[#D5DFD3] dark:border-[#223828] text-xs text-[#111C15] dark:text-[#ECF2EC]"
                    />
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#EAEFE8] dark:bg-[#152319] border border-[#D5DFD3] dark:border-[#223828] text-xs flex justify-between items-center font-mono">
                  <span className="text-[#526356] dark:text-[#8FA394]">Calculated Capacity:</span>
                  <span className="text-[#2D6A4F] dark:text-[#52B788] font-bold">
                    {calculateSumpVolumeLiters(sumpLength, sumpWidth, sumpDepth).toLocaleString()} Litres
                  </span>
                </div>
              </div>
            )}

            {/* Pump Power */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#526356] dark:text-[#8FA394]">
                <span>Tube-well / Pump Power</span>
                <span className="font-bold text-[#111C15] dark:text-[#ECF2EC] font-mono">{pumpHp} HP</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[2, 3, 5, 7.5].map((hp) => (
                  <button
                    key={hp}
                    type="button"
                    onClick={() => setPumpHp(hp)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      pumpHp === hp
                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                        : 'bg-white dark:bg-[#121E15] border-[#E1E6DE] dark:border-[#1E3022] text-[#526356] dark:text-[#8FA394]'
                    }`}
                  >
                    {hp} HP
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Thumb Navigation Bar */}
        <div className="flex items-center justify-between gap-3 pt-5 mt-4 border-t border-[#E1E6DE] dark:border-[#1E3022]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#EAEFE8] dark:bg-[#152319] hover:bg-[#D5DFD3] dark:hover:bg-[#1F3324] border border-[#D5DFD3] dark:border-[#223828] text-sm font-semibold text-[#111C15] dark:text-[#ECF2EC] flex items-center gap-1.5 transition-colors cursor-pointer"
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
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-sm font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <span>{t.nextStep}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-sm font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{t.finishSetup}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
