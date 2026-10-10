'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FarmProfile, 
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
  Hash
} from 'lucide-react';
import { LocationMapPicker } from '../map/LocationMapPicker';

interface StepperWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (farm: FarmProfile) => void;
  initialFarm?: FarmProfile | null;
}

export function StepperWizard({ isOpen, onClose, onSubmit, initialFarm }: StepperWizardProps) {
  const { t } = useLanguage();

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
        const results = await fetchLocationSuggestions(trimmed);
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
  }, [queryLocation]);

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

  // STEP 3: Crop & Land Area state
  const [cropName, setCropName] = useState(
    initialFarm?.plots[0]?.cropName || 'Tomato'
  );
  const [growthStage, setGrowthStage] = useState<'initial' | 'development' | 'mid_season' | 'late_season'>(
    initialFarm?.plots[0]?.growthStage || 'mid_season'
  );
  const [areaValue, setAreaValue] = useState(
    initialFarm?.plots[0]?.areaValue || 1.5
  );
  const [areaUnit, setAreaUnit] = useState<AreaUnit>(
    initialFarm?.plots[0]?.areaUnit || 'bigha'
  );
  const [irrigationMethod, setIrrigationMethod] = useState<IrrigationMethod>(
    initialFarm?.plots[0]?.irrigationMethod || 'drip'
  );

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

  // Final Form Submission
  const handleComplete = () => {
    const awc_mm_per_m = soilTexture === 'sandy' ? 90 : soilTexture === 'clay_black' ? 180 : 150;
    const infiltration_rate_mm_hr = soilTexture === 'sandy' ? 25 : soilTexture === 'clay_black' ? 8 : 15;
    const area_sq_meters = normalizeAreaToSqMeters(areaValue, areaUnit);

    // Documented crop agronomic parameters
    let rootDepth_m = 0.6;
    let cropCoefficient_Kc = 1.05;
    let depletionFraction_p = 0.45;

    if (cropName === 'Spinach') {
      rootDepth_m = 0.25;
      cropCoefficient_Kc = 1.00;
      depletionFraction_p = 0.35;
    } else if (cropName === 'Wheat') {
      rootDepth_m = 0.70;
      cropCoefficient_Kc = growthStage === 'mid_season' ? 1.15 : 0.70;
      depletionFraction_p = 0.55;
    } else if (cropName === 'Paddy') {
      rootDepth_m = 0.40;
      cropCoefficient_Kc = 1.20;
      depletionFraction_p = 0.20;
    } else if (cropName === 'Potato') {
      rootDepth_m = 0.50;
      cropCoefficient_Kc = 1.10;
      depletionFraction_p = 0.35;
    }

    // Determine available water reserve
    let totalCap = tankCapacity;
    let availableLiters = Math.round((tankCapacity * fillPercent) / 100);

    if (storageType === 'custom_sump') {
      totalCap = calculateSumpVolumeLiters(sumpLength, sumpWidth, sumpDepth);
      availableLiters = Math.round((totalCap * fillPercent) / 100);
    }

    const farm: FarmProfile = {
      id: initialFarm?.id || `farm-${Date.now()}`,
      userId: 'farmer-user',
      farmName: `${cropName} Parcel (${district})`,
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
      plots: [
        {
          id: 'plot-primary-01',
          cropName,
          growthStage,
          areaValue,
          areaUnit,
          area_sq_meters,
          rootDepth_m,
          cropCoefficient_Kc,
          depletionFraction_p,
          currentDepletion_mm: 34.0, // Initial soil depletion baseline
          irrigationMethod,
          lastIrrigationDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        },
      ],
      createdAt: initialFarm?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSubmit(farm);
    onClose();
  };

  const calculatedAreaM2 = normalizeAreaToSqMeters(areaValue, areaUnit);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-xl border border-slate-700 p-4 sm:p-6 shadow-2xl relative my-auto">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Step {step} of 4
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">Mobile Onboarding</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
              {step === 1 && (
                <>
                  <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{t.locationStep}</span>
                </>
              )}
              {step === 2 && (
                <>
                  <Layers className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>{t.soilStep}</span>
                </>
              )}
              {step === 3 && (
                <>
                  <Sprout className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{t.cropStep}</span>
                </>
              )}
              {step === 4 && (
                <>
                  <Droplets className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span>{t.reserveStep}</span>
                </>
              )}
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
                s <= step ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50' : 'bg-slate-800'
              }`} 
            />
          ))}
        </div>

        {/* STEP 1: FIELD LOCATION */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              FieldGuard pulls live meteorological and rainfall forecasts from Open-Meteo for your coordinates.
            </p>

            {/* Search as you type with live autocomplete popover */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Search Village, Pincode or Tehsil</span>
                {isLoadingSuggestions && (
                  <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 font-normal">
                    <Loader2 className="w-3 h-3 animate-spin" /> Searching India...
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
                  placeholder="e.g. Bardhaman, 713101, Nashik, or Galsi..."
                  className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
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
                      className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Clear input"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSearchLocation}
                    disabled={isSearchingLocation}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSearchingLocation ? 'Locating...' : 'Find'}
                  </button>
                </div>
              </div>

              {/* Floating Autocomplete Popover (Top-ranking Indian locations) */}
              {isDropdownOpen && suggestions.length > 0 && (
                <div 
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl overflow-hidden divide-y divide-slate-800/80 animate-in fade-in slide-in-from-top-1"
                >
                  <div className="px-3 py-1.5 bg-slate-800/50 text-[10px] font-semibold text-slate-400 flex items-center justify-between uppercase tracking-wider">
                    <span>Indian Location Suggestions</span>
                    <span className="font-mono text-[9px] text-slate-500">Tap or Press Enter</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {suggestions.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className={`w-full min-h-[44px] px-3.5 py-2.5 text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                          selectedIndex === idx
                            ? 'bg-cyan-600/20 text-white'
                            : 'hover:bg-slate-800/60 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 shrink-0">
                            {item.type === 'pincode' ? (
                              <Hash className="w-3.5 h-3.5 text-amber-400" />
                            ) : item.type === 'district' ? (
                              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {[item.district, item.state].filter(Boolean).join(', ')}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-cyan-400 font-semibold block">
                            {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                          </span>
                          <span className="text-[9px] uppercase font-bold text-slate-500">
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
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[11px] text-slate-500 uppercase font-semibold">OR</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* 1-Tap Browser GPS Button (Minimum 48px Touch Target) */}
            <button
              type="button"
              onClick={handleGPSDetect}
              disabled={isLocatingGPS}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Compass className={`w-4 h-4 ${isLocatingGPS ? 'animate-spin' : ''}`} />
              <span>{isLocatingGPS ? t.gpsLocating : t.gpsButton}</span>
            </button>

            {locationFeedback && (
              <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300">
                {locationFeedback}
              </div>
            )}

            {/* Live Interactive Map Preview (Draggable Pin & Satellite/Street View) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Parcel Map (Drag Pin or Tap to Set)</span>
                </span>
                <span className="text-[11px] font-mono text-cyan-300">
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

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Selected Coordinates:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Region: <span className="text-white">{district || 'Local Cluster'}</span>, State: <span className="text-white">{stateName || 'India'}</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SOIL TEXTURE SELECTION */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Select your soil category. FieldGuard uses transparent Available Water Capacity (AWC) values without requiring expensive IoT moisture sensors.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Sandy Tile */}
              <button
                type="button"
                onClick={() => setSoilTexture('sandy')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                  soilTexture === 'sandy'
                    ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/30 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-base font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block shadow-sm" />
                      <span>Sandy Soil</span>
                    </span>
                    {soilTexture === 'sandy' && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Gritty, drains quickly</div>
                </div>
                <div className="text-[11px] font-mono text-amber-400/90 font-semibold mt-2">
                  AWC: 90 mm/m
                </div>
              </button>

              {/* Loamy Tile (Default / Recommended) */}
              <button
                type="button"
                onClick={() => setSoilTexture('loamy')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                  soilTexture === 'loamy'
                    ? 'bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/30 text-emerald-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-base font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-800 inline-block shadow-sm" />
                      <span>Loamy Soil</span>
                    </span>
                    {soilTexture === 'loamy' && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Balanced retention, crumbly</div>
                </div>
                <div className="text-[11px] font-mono text-emerald-400/90 font-semibold mt-2">
                  AWC: 150 mm/m (Ideal)
                </div>
              </button>

              {/* Clay / Black Soil */}
              <button
                type="button"
                onClick={() => setSoilTexture('clay_black')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                  soilTexture === 'clay_black'
                    ? 'bg-cyan-950/30 border-cyan-500 ring-2 ring-cyan-500/30 text-cyan-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-base font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-600 inline-block shadow-sm" />
                      <span>Clay / Black</span>
                    </span>
                    {soilTexture === 'clay_black' && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Dense, high water hold</div>
                </div>
                <div className="text-[11px] font-mono text-cyan-400/90 font-semibold mt-2">
                  AWC: 180 mm/m
                </div>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>AWC (Available Water Capacity)</strong> indicates how many millimetres of water 1 metre of this soil can store before draining.
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: CROP & LAND AREA */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Crop Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Crop
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Tomato', 'Wheat', 'Paddy', 'Potato', 'Mustard', 'Spinach', 'Onion', 'Chilli'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCropName(c)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      cropName === c
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Growth Stage */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Crop Growth Stage
              </label>
              <select
                value={growthStage}
                onChange={(e) => setGrowthStage(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="initial">Initial Stage (Germination / Seedling)</option>
                <option value="development">Vegetative Development</option>
                <option value="mid_season">Mid-Season (Flowering & Fruit Set — Peak Water)</option>
                <option value="late_season">Late Season (Ripening & Harvest)</option>
              </select>
            </div>

            {/* Land Area and Regional Unit Converter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Field Size & Local Unit
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={areaValue}
                  onChange={(e) => setAreaValue(parseFloat(e.target.value) || 0.1)}
                  className="w-1/2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                <select
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                  className="w-1/2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="bigha">Bigha (~1,338 m² East)</option>
                  <option value="acre">Acre (~4,047 m²)</option>
                  <option value="guntha">Guntha (~101 m² West)</option>
                  <option value="cent">Cent (~40.5 m² South)</option>
                  <option value="hectare">Hectare (10,000 m²)</option>
                  <option value="sq_meters">Square Metres (m²)</option>
                </select>
              </div>
              <div className="text-[11px] text-cyan-300 font-mono">
                Normalized Area: <strong>{calculatedAreaM2.toLocaleString()} m²</strong>
              </div>
            </div>

            {/* Irrigation Method Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {t.irrigationMethod}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setIrrigationMethod('drip')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border text-center ${
                    irrigationMethod === 'drip'
                      ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>{t.drip}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setIrrigationMethod('sprinkler')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border text-center ${
                    irrigationMethod === 'sprinkler'
                      ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>{t.sprinkler}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setIrrigationMethod('surface_flood')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border text-center ${
                    irrigationMethod === 'surface_flood'
                      ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>{t.flood}</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: WATER RESERVE & STORAGE */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              FieldGuard checks your usable water storage to make sure recommendations are practically achievable.
            </p>

            {/* Storage Type Tabs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStorageType('sintex_tank')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  storageType === 'sintex_tank'
                    ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Cylinder className="w-4 h-4 shrink-0" />
                  <span>Sintex / Standard Tank</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStorageType('custom_sump')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  storageType === 'custom_sump'
                    ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Waves className="w-4 h-4 shrink-0" />
                  <span>Farm Pond / Custom Sump</span>
                </span>
              </button>
            </div>

            {/* Tier 1: Standard Tank Slider */}
            {storageType === 'sintex_tank' && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Tank Capacity</span>
                    <span className="font-bold text-cyan-400 font-mono">{tankCapacity.toLocaleString()} Litres</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[1000, 2000, 5000, 10000].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setTankCapacity(cap)}
                        className={`py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                          tankCapacity === cap
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400'
                        }`}
                      >
                        {cap / 1000}k Litres
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Visual Fill Level Gauge</span>
                    <span className="font-bold text-emerald-400 font-mono">{fillPercent}% Full</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={fillPercent}
                    onChange={(e) => setFillPercent(parseInt(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Low (10%)</span>
                    <span>Available: <strong>{Math.round((tankCapacity * fillPercent) / 100).toLocaleString()} L</strong></span>
                    <span>Full (100%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tier 2: Custom Sump Geometric Calculator */}
            {storageType === 'custom_sump' && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Geometric Volume Calculator (L × W × D)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Length (m)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={sumpLength}
                      onChange={(e) => setSumpLength(parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Width (m)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={sumpWidth}
                      onChange={(e) => setSumpWidth(parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Depth (m)</label>
                    <input
                      type="number"
                      step="0.2"
                      value={sumpDepth}
                      onChange={(e) => setSumpDepth(parseFloat(e.target.value) || 0.5)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs flex justify-between items-center font-mono">
                  <span className="text-slate-400">Calculated Capacity:</span>
                  <span className="text-cyan-300 font-bold">
                    {calculateSumpVolumeLiters(sumpLength, sumpWidth, sumpDepth).toLocaleString()} Litres
                  </span>
                </div>
              </div>
            )}

            {/* Pump Power */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Tube-well / Pump Power</span>
                <span className="font-bold text-white font-mono">{pumpHp} HP</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[2, 3, 5, 7.5].map((hp) => (
                  <button
                    key={hp}
                    type="button"
                    onClick={() => setPumpHp(hp)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      pumpHp === hp
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    {hp} HP
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Thumb Navigation Bar (Min 48px Touch Targets) */}
        <div className="flex items-center justify-between gap-3 pt-5 mt-4 border-t border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
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
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-600/30"
            >
              <span>{t.nextStep}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
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
