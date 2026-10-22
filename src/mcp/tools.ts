import { z } from 'zod';
import { 
  getFarmProfileFromDynamo, 
  getFarmsByUserId, 
  logDecisionToDynamo,
  saveFarmProfileToDynamo,
} from '../adapters/dynamoDbAdapter';
import { fetchLiveWeatherForecast } from '../adapters/openMeteoAdapter';
import { runFeasibilityPlanner } from '../core/feasibilityPlanner';
import { PRESET_1_RAIN_AVOIDANCE, PRESET_2_RESOURCE_DEFICIT } from '../core/demoPresets';
import { FarmProfile, IRRIGATION_EFFICIENCIES, IrrigationMethod } from '../types/farm';
import { DailyWeatherForecast } from '../types/weather';
import { DecisionResponse } from '../types/decision';

// Runtime store for active / modified farm profiles
export const farmRuntimeStore = new Map<string, FarmProfile>();

// Long-Term Episodic Farmer Preferences Memory Store
export interface FarmerPreferences {
  userId: string;
  preferredLanguage?: string;
  preferredIrrigationWindow?: string;
  primaryCropFocus?: string;
  lastUpdated: string;
}

export const farmerPreferencesStore = new Map<string, FarmerPreferences>();

export function getFarmerPreferences(userId: string): FarmerPreferences | null {
  return farmerPreferencesStore.get(userId) || null;
}

export function saveFarmerPreferences(userId: string, prefs: Partial<FarmerPreferences>): FarmerPreferences {
  const existing = farmerPreferencesStore.get(userId) || {
    userId,
    preferredLanguage: 'en',
    preferredIrrigationWindow: 'evening (after 6 PM)',
    lastUpdated: new Date().toISOString(),
  };

  const updated: FarmerPreferences = {
    ...existing,
    ...prefs,
    lastUpdated: new Date().toISOString(),
  };

  farmerPreferencesStore.set(userId, updated);
  return updated;
}

// Default presets lookup map
const PRESET_FARMS: Record<string, FarmProfile> = {
  [PRESET_1_RAIN_AVOIDANCE.farm.id]: PRESET_1_RAIN_AVOIDANCE.farm,
  [PRESET_2_RESOURCE_DEFICIT.farm.id]: PRESET_2_RESOURCE_DEFICIT.farm,
  'farm-purba-bardhaman': PRESET_1_RAIN_AVOIDANCE.farm,
  'farm-nashik': PRESET_2_RESOURCE_DEFICIT.farm,
};

/**
 * Resolves a farm profile from DynamoDB, falling back to built-in presets.
 */
export async function resolveFarm(farmId: string): Promise<FarmProfile | null> {
  // Check active runtime cache first
  if (farmRuntimeStore.has(farmId)) {
    return farmRuntimeStore.get(farmId)!;
  }

  // Check presets
  if (PRESET_FARMS[farmId]) {
    const cloned: FarmProfile = JSON.parse(JSON.stringify(PRESET_FARMS[farmId]));
    farmRuntimeStore.set(farmId, cloned);
    return cloned;
  }
  // Check DynamoDB
  const farm = await getFarmProfileFromDynamo(farmId);
  if (farm) {
    farmRuntimeStore.set(farmId, farm);
    return farm;
  }

  // Partial match fallback (e.g. "bardhaman" -> PRESET_1)
  const lower = farmId.toLowerCase();
  if (lower.includes('bardhaman') || lower.includes('tomato')) {
    const cloned: FarmProfile = JSON.parse(JSON.stringify(PRESET_1_RAIN_AVOIDANCE.farm));
    farmRuntimeStore.set(farmId, cloned);
    return cloned;
  }
  if (lower.includes('nashik') || lower.includes('spinach')) {
    const cloned: FarmProfile = JSON.parse(JSON.stringify(PRESET_2_RESOURCE_DEFICIT.farm));
    farmRuntimeStore.set(farmId, cloned);
    return cloned;
  }

  return null;
}

interface WeatherCacheEntry {
  forecast: DailyWeatherForecast;
  expiresAt: number;
}
const weatherCache = new Map<string, WeatherCacheEntry>();
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Resolves live or realistic forecast for a location with in-memory caching.
 */
async function resolveForecast(lat: number, lon: number): Promise<DailyWeatherForecast> {
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.forecast;
  }

  try {
    const res = await fetchLiveWeatherForecast(lat, lon);
    if (res && res.forecast) {
      weatherCache.set(cacheKey, {
        forecast: res.forecast,
        expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
      });
      return res.forecast;
    }
  } catch (err) {
    console.warn('Weather fetch failed in MCP tool, using safe baseline:', err);
  }

  return {
    date: new Date().toISOString().split('T')[0],
    rainfall_mm: 0,
    precipitation_probability_pct: 10,
    reference_et0_mm: 4.5,
    temp_max_c: 33,
    temp_min_c: 23,
    relative_humidity_pct: 55,
    current_temp_c: 31,
    current_humidity_pct: 55,
    current_wind_speed_kmh: 12,
    source: 'Open-Meteo Baseline',
    isLive: false,
    timestamp: new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// TOOL SCHEMAS & IMPLEMENTATIONS
// -------------------------------------------------------------

export const listMyFarmsSchema = {
  userId: z.string().optional().describe('The farmer user identifier. If omitted, returns accessible demo farms.'),
};

export async function handleListMyFarms(args: { userId?: string }) {
  const userId = args.userId || 'farmer-ramesh';
  let farms = await getFarmsByUserId(userId);

  if (!farms || farms.length === 0) {
    farms = [PRESET_1_RAIN_AVOIDANCE.farm, PRESET_2_RESOURCE_DEFICIT.farm];
  }

  const result = farms.map(f => ({
    farmId: f.id,
    name: f.farmName,
    location: f.location.displayName || f.location.villageOrPincode,
    coordinates: { latitude: f.location.latitude, longitude: f.location.longitude },
    soilTexture: f.soil.texture,
    storageType: f.reserve.storageType,
    availableWater_liters: f.reserve.currentAvailable_liters,
    plots: f.plots.map(p => ({
      plotId: p.id,
      cropName: p.cropName,
      growthStage: p.growthStage,
      area_sq_meters: p.area_sq_meters,
      irrigationMethod: p.irrigationMethod,
      lastIrrigationDate: p.lastIrrigationDate,
    })),
  }));

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

export const getFarmContextSchema = {
  farmId: z.string().describe('The unique identifier of the farm (e.g. "farm-bardhaman-01", "farm-nashik-02").'),
};

export async function handleGetFarmContext(args: { farmId: string }) {
  const farm = await resolveFarm(args.farmId);
  if (!farm) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Farm with ID "${args.farmId}" was not found. Available demo farms: "farm-bardhaman-01", "farm-nashik-02".`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(farm, null, 2),
      },
    ],
  };
}

export const getWeatherContextSchema = {
  farmId: z.string().optional().describe('Optional unique identifier of the farm to auto-resolve coordinates'),
  latitude: z.number().optional().describe('Latitude of the field (e.g. 23.2324)'),
  longitude: z.number().optional().describe('Longitude of the field (e.g. 87.8615)'),
};

export async function handleGetWeatherContext(args: { farmId?: string; latitude?: number; longitude?: number }) {
  let lat = args.latitude;
  let lon = args.longitude;

  if ((lat === undefined || lon === undefined) && args.farmId) {
    const farm = await resolveFarm(args.farmId);
    if (farm) {
      lat = farm.location.latitude;
      lon = farm.location.longitude;
    }
  }

  // Fallback to default coordinates if still undefined
  const finalLat = lat ?? 23.2324;
  const finalLon = lon ?? 87.8615;

  const forecast = await resolveForecast(finalLat, finalLon);
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(forecast, null, 2),
      },
    ],
  };
}

export const getPlotWaterStatusSchema = {
  farmId: z.string().describe('The unique identifier of the farm'),
  plotId: z.string().optional().describe('Optional specific plot ID. If omitted, returns all plots on the farm.'),
};

export async function handleGetPlotWaterStatus(args: { farmId: string; plotId?: string }) {
  const farm = await resolveFarm(args.farmId);
  if (!farm) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `Farm "${args.farmId}" not found.` }],
    };
  }

  const forecast = await resolveForecast(farm.location.latitude, farm.location.longitude);
  const decision = runFeasibilityPlanner({
    plots: farm.plots,
    awc_mm_per_m: farm.soil.awc_mm_per_m,
    reserve: farm.reserve,
    forecast,
  });

  const plots = args.plotId
    ? decision.plots.filter(p => p.plotId === args.plotId)
    : decision.plots;

  const result = {
    farmId: farm.id,
    farmName: farm.farmName,
    weather: {
      date: forecast.date,
      rainfall_mm: forecast.rainfall_mm,
      reference_et0_mm: forecast.reference_et0_mm,
      temp_max_c: forecast.temp_max_c,
    },
    primaryAction: decision.primaryAction,
    decisionState: decision.decision,
    totalFarmDemand_liters: decision.totalFarmDemand_liters,
    availableWater_liters: decision.availableWater_liters,
    plots: plots.map(p => ({
      plotId: p.plotId,
      cropName: p.cropName,
      currentDepletion_mm: Math.round(p.currentDepletion_mm * 10) / 10,
      raw_mm: Math.round(p.raw_mm * 10) / 10,
      taw_mm: Math.round(p.taw_mm * 10) / 10,
      hoursToCriticalStress: Math.round(p.hoursToCriticalStress * 10) / 10,
      netWaterNeeded_liters: p.waterNeeded_liters,
      grossWaterNeeded_liters: p.grossWaterNeeded_liters,
      irrigationMethod: p.irrigationMethod,
      irrigationEfficiency: p.irrigationEfficiency,
      urgencyLevel: p.urgencyLevel,
    })),
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

export const allocateLimitedWaterSchema = {
  farmId: z.string().describe('The unique identifier of the farm'),
  availableBudgetLiters: z.number().describe('The available water quantity in Liters (e.g. 800)'),
  irrigationMethod: z.enum(['drip', 'sprinkler', 'surface_flood']).optional().describe('Optional irrigation method override'),
};

export async function handleAllocateLimitedWater(args: {
  farmId: string;
  availableBudgetLiters: number;
  irrigationMethod?: 'drip' | 'sprinkler' | 'surface_flood';
}) {
  const farm = await resolveFarm(args.farmId);
  if (!farm) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `Farm "${args.farmId}" not found.` }],
    };
  }

  const forecast = await resolveForecast(farm.location.latitude, farm.location.longitude);
  
  // Apply method override to plots if provided
  const plotsToEvaluate = farm.plots.map(p => ({
    ...p,
    irrigationMethod: (args.irrigationMethod || p.irrigationMethod || 'surface_flood') as IrrigationMethod,
  }));

  const decision = runFeasibilityPlanner({
    plots: plotsToEvaluate,
    awc_mm_per_m: farm.soil.awc_mm_per_m,
    reserve: {
      ...farm.reserve,
      currentAvailable_liters: args.availableBudgetLiters,
    },
    forecast,
  });

  // Flow rate for pump runtime calculation (Liters/hour)
  const flowRateLph = farm.reserve.knownFlowRate_liters_per_hr || 
    (farm.reserve.pumpPower_hp ? farm.reserve.pumpPower_hp * 1200 : 5000);

  // Triage Allocation: Sort by urgency (critical first, then lowest hoursToCriticalStress)
  const sortedPlots = [...decision.plots].sort((a, b) => {
    if (a.urgencyLevel === 'critical' && b.urgencyLevel !== 'critical') return -1;
    if (b.urgencyLevel === 'critical' && a.urgencyLevel !== 'critical') return 1;
    return a.hoursToCriticalStress - b.hoursToCriticalStress;
  });

  let remainingBudget = args.availableBudgetLiters;
  const allocations = [];

  for (const plot of sortedPlots) {
    const demand = plot.grossWaterNeeded_liters;
    const allocated = Math.min(remainingBudget, demand);
    remainingBudget -= allocated;
    const unmet = demand - allocated;
    const pumpMinutes = flowRateLph > 0 ? Math.round((allocated / flowRateLph) * 60) : 0;

    allocations.push({
      plotId: plot.plotId,
      cropName: plot.cropName,
      grossDemand_liters: demand,
      allocated_liters: allocated,
      unmetDemand_liters: unmet,
      pumpRuntimeMinutes: pumpMinutes,
      urgencyLevel: plot.urgencyLevel,
      hoursToStress: Math.round(plot.hoursToCriticalStress * 10) / 10,
      irrigationMethod: plot.irrigationMethod,
      efficiencyPct: Math.round(plot.irrigationEfficiency * 100),
    });
  }

  const totalAllocated = args.availableBudgetLiters - remainingBudget;
  const totalUnmet = allocations.reduce((sum, a) => sum + a.unmetDemand_liters, 0);
  const totalPumpMinutes = allocations.reduce((sum, a) => sum + a.pumpRuntimeMinutes, 0);

  const summary = {
    farmId: farm.id,
    farmName: farm.farmName,
    availableBudgetLiters: args.availableBudgetLiters,
    totalAllocatedLiters: totalAllocated,
    unallocatedReserveLiters: remainingBudget,
    totalUnmetDemandLiters: totalUnmet,
    totalPumpMinutes,
    allocations,
    triageRationale: `Prioritized plots facing nearest critical moisture stress. ${
      remainingBudget === 0 
        ? `Entire ${args.availableBudgetLiters.toLocaleString()} L budget assigned to highest-risk root zones.` 
        : `All crop demands satisfied with ${remainingBudget.toLocaleString()} L reserve surplus remaining.`
    }`,
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(summary, null, 2),
      },
    ],
  };
}

export const compareIrrigationMethodsSchema = {
  farmId: z.string().describe('The unique identifier of the farm'),
  plotId: z.string().optional().describe('Specific plot to compare. If omitted, uses first plot on farm.'),
  cropName: z.string().optional().describe('Crop name to compare (e.g. "Onion", "Wheat", "Tomato", "Spinach").'),
};

export async function handleCompareIrrigationMethods(args: { farmId: string; plotId?: string; cropName?: string }) {
  const farm = await resolveFarm(args.farmId);
  if (!farm) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `Farm "${args.farmId}" not found.` }],
    };
  }

  let targetPlot = farm.plots[0];
  if (args.plotId) {
    const found = farm.plots.find(p => p.id === args.plotId);
    if (found) targetPlot = found;
  } else if (args.cropName) {
    const search = args.cropName.toLowerCase().trim();
    const found = farm.plots.find(p => p.cropName.toLowerCase().includes(search));
    if (found) {
      targetPlot = found;
    } else {
      // Dynamic FAO-56 standard agronomic parameters for crops not yet added to the farm
      const CROP_DEFAULTS: Record<string, { rootDepth_m: number; depletionFraction_p: number; cropCoefficient_Kc: number; name: string }> = {
        onion: { rootDepth_m: 0.35, depletionFraction_p: 0.30, cropCoefficient_Kc: 1.05, name: 'Onion' },
        wheat: { rootDepth_m: 0.90, depletionFraction_p: 0.55, cropCoefficient_Kc: 1.15, name: 'Wheat' },
        spinach: { rootDepth_m: 0.25, depletionFraction_p: 0.20, cropCoefficient_Kc: 1.00, name: 'Spinach' },
        potato: { rootDepth_m: 0.50, depletionFraction_p: 0.35, cropCoefficient_Kc: 1.10, name: 'Potato' },
        mustard: { rootDepth_m: 0.60, depletionFraction_p: 0.50, cropCoefficient_Kc: 1.05, name: 'Mustard' },
        chilli: { rootDepth_m: 0.55, depletionFraction_p: 0.40, cropCoefficient_Kc: 1.05, name: 'Chilli' },
        paddy: { rootDepth_m: 0.50, depletionFraction_p: 0.20, cropCoefficient_Kc: 1.20, name: 'Paddy' },
        tomato: { rootDepth_m: 0.60, depletionFraction_p: 0.45, cropCoefficient_Kc: 1.05, name: 'Tomato' },
      };

      const matchedKey = Object.keys(CROP_DEFAULTS).find(k => search.includes(k) || k.includes(search));
      const cropSpec = matchedKey ? CROP_DEFAULTS[matchedKey] : { rootDepth_m: 0.5, depletionFraction_p: 0.4, cropCoefficient_Kc: 1.0, name: args.cropName };

      targetPlot = {
        id: `plot-${cropSpec.name.toLowerCase()}-simulated`,
        cropName: cropSpec.name,
        growthStage: 'mid_season',
        areaValue: farm.plots[0]?.areaValue || 1.5,
        areaUnit: farm.plots[0]?.areaUnit || 'bigha',
        area_sq_meters: farm.plots[0]?.area_sq_meters || 2007,
        rootDepth_m: cropSpec.rootDepth_m,
        cropCoefficient_Kc: cropSpec.cropCoefficient_Kc,
        depletionFraction_p: cropSpec.depletionFraction_p,
        currentDepletion_mm: 0,
        irrigationMethod: 'drip',
      } as any;
    }
  }

  if (!targetPlot) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: 'No plots found on this farm to compare.' }],
    };
  }

  // If current depletion is negligible (e.g. plot was watered today, Dr < 5mm),
  // compare against a standard root-zone replenishment cycle (RAW = p * TAW) so the farmer sees real per-cycle savings.
  const awc = farm.soil.awc_mm_per_m || 140;
  const rootDepth = targetPlot.rootDepth_m || 0.6;
  const p = targetPlot.depletionFraction_p || 0.45;
  const standardCycleDepth_mm = Math.round(awc * rootDepth * p * 10) / 10; // e.g. 37.8 mm

  const effectiveDepth_mm = (targetPlot.currentDepletion_mm && targetPlot.currentDepletion_mm >= 5)
    ? targetPlot.currentDepletion_mm
    : (standardCycleDepth_mm > 0 ? standardCycleDepth_mm : 35.0);

  const netWaterLiters = Math.max(1000, Math.round(effectiveDepth_mm * targetPlot.area_sq_meters));
  const flowRateLph = farm.reserve.knownFlowRate_liters_per_hr || 5000;
  const pumpHp = farm.reserve.pumpPower_hp || 5;

  const comparison = (['drip', 'sprinkler', 'surface_flood'] as const).map(method => {
    const eff = IRRIGATION_EFFICIENCIES[method];
    const grossLiters = Math.round(netWaterLiters / eff);
    const pumpHours = Math.round((grossLiters / flowRateLph) * 10) / 10;
    const kwh = Math.round(pumpHours * pumpHp * 0.746 * 10) / 10;
    const co2Kg = Math.round(kwh * 0.82 * 10) / 10; // 0.82 kg CO2 / kWh Indian grid baseline
    const dieselSavingsInr = Math.round(pumpHours * 35); // ~₹35/hr electricity & maintenance tariff

    return {
      method,
      efficiencyPct: Math.round(eff * 100),
      grossWaterRequired_liters: grossLiters,
      pumpHoursRequired: pumpHours,
      electricity_kwh: kwh,
      carbonFootprint_kg_co2: co2Kg,
      operationalCost_inr: dieselSavingsInr,
    };
  });

  const floodData = comparison.find(c => c.method === 'surface_flood')!;
  const dripData = comparison.find(c => c.method === 'drip')!;
  const waterSavedLiters = Math.max(0, floodData.grossWaterRequired_liters - dripData.grossWaterRequired_liters);
  const pumpHoursSaved = Math.max(0, Math.round((floodData.pumpHoursRequired - dripData.pumpHoursRequired) * 10) / 10);
  const costSavedInr = Math.max(0, floodData.operationalCost_inr - dripData.operationalCost_inr);
  const waterSavedPct = floodData.grossWaterRequired_liters > 0
    ? Math.round((waterSavedLiters / floodData.grossWaterRequired_liters) * 100)
    : 33;

  const result = {
    plotId: targetPlot.id,
    cropName: targetPlot.cropName,
    netCropWaterNeed_liters: netWaterLiters,
    comparisonTable: comparison,
    savingsWithDripVsFlood: {
      waterSavedLiters,
      waterSavedPct,
      pumpHoursSaved,
      costSavedInr,
    },
    recommendation: `Switching from Flood (60% eff) to Drip (90% eff) saves ${waterSavedLiters.toLocaleString()} L of water per irrigation cycle (${waterSavedPct}% reduction) and avoids ${pumpHoursSaved} hours of pump runtime.`,
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

export const updateWaterReserveSchema = {
  farmId: z.string().describe('The unique identifier of the farm'),
  fillPercent: z.number().min(0).max(100).optional().describe('Tank fill percentage (0 to 100%)'),
  availableLiters: z.number().optional().describe('Direct available water volume in Liters'),
  totalCapacityLiters: z.number().optional().describe('Total capacity of the tank in Liters'),
};

export async function handleUpdateWaterReserve(args: {
  farmId: string;
  fillPercent?: number;
  availableLiters?: number;
  totalCapacityLiters?: number;
}) {
  const farm = await resolveFarm(args.farmId);
  if (!farm) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `Farm "${args.farmId}" not found.` }],
    };
  }

  const totalCap = args.totalCapacityLiters || farm.reserve.totalCapacity_liters || 4000;
  let available = farm.reserve.currentAvailable_liters;

  let wasOverCapacity = false;
  if (args.fillPercent !== undefined) {
    available = Math.round((totalCap * Math.max(0, Math.min(100, args.fillPercent))) / 100);
  } else if (args.availableLiters !== undefined) {
    const rawVal = Math.round(args.availableLiters);
    if (rawVal > totalCap) {
      wasOverCapacity = true;
    }
    available = Math.max(0, Math.min(totalCap, rawVal));
  }

  const percent = totalCap > 0 ? Math.round((available / totalCap) * 100) : 0;

  farm.reserve = {
    ...farm.reserve,
    totalCapacity_liters: totalCap,
    currentAvailable_liters: available,
  };

  farmRuntimeStore.set(farm.id, farm);
  await saveFarmProfileToDynamo(farm);

  const forecast = await resolveForecast(farm.location.latitude, farm.location.longitude);
  const decision = runFeasibilityPlanner({
    plots: farm.plots,
    awc_mm_per_m: farm.soil.awc_mm_per_m,
    reserve: farm.reserve,
    forecast,
  });

  const isDeficit = available < decision.totalFarmDemand_liters;
  const shortfall = isDeficit ? decision.totalFarmDemand_liters - available : 0;

  const overflowNote = wasOverCapacity
    ? ` Note: Entered volume exceeded physical tank capacity (${totalCap.toLocaleString()} L); reserve capped at 100% full.`
    : '';

  const directive = (isDeficit
    ? `Direct available ${available.toLocaleString()} L exclusively to your most urgent plot (${decision.plots[0]?.cropName || 'primary crop'}). Keep lateral valves to other plots firmly shut so water does not dissipate. Irrigate after 6:00 PM or before 7:00 AM to eliminate solar evaporation loss.`
    : `Tank reserve of ${available.toLocaleString()} L is fully adequate to satisfy total farm demand of ${decision.totalFarmDemand_liters.toLocaleString()} L.`) + overflowNote;

  const result = {
    success: true,
    farmId: farm.id,
    farmName: farm.farmName,
    availableLiters: available,
    totalCapacityLiters: totalCap,
    fillPercent: percent,
    wasOverCapacity,
    isDeficit,
    totalDemand_liters: decision.totalFarmDemand_liters,
    shortfall_liters: shortfall,
    primaryAction: decision.primaryAction,
    advisoryDirective: directive,
    updatedFarm: farm,
    newDecision: decision,
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

export const logIrrigationEventSchema = {
  farmId: z.string().describe('The unique identifier of the farm'),
  cropName: z.string().optional().describe('Name of the crop watered (e.g. "Onion", "Tomato", "Wheat")'),
  plotId: z.string().optional().describe('Specific plot ID watered'),
  irrigationDate: z.string().optional().describe('Date when irrigation occurred (YYYY-MM-DD, "today", or "yesterday")'),
  waterDepth_mm: z.number().optional().describe('Water depth applied in mm'),
};

export async function handleLogIrrigationEvent(args: {
  farmId: string;
  cropName?: string;
  plotId?: string;
  irrigationDate?: string;
  waterDepth_mm?: number;
}) {
  const farm = await resolveFarm(args.farmId);
  if (!farm || !farm.plots || farm.plots.length === 0) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `Farm "${args.farmId}" not found or has no plots.` }],
    };
  }

  let targetPlot = farm.plots[0];
  if (args.plotId) {
    const found = farm.plots.find(p => p.id === args.plotId);
    if (found) targetPlot = found;
  } else if (args.cropName) {
    const search = args.cropName.toLowerCase().trim();
    const found = farm.plots.find(p => p.cropName.toLowerCase().includes(search));
    if (found) targetPlot = found;
  }

  // Parse date
  let resolvedDate = new Date().toISOString().split('T')[0];
  const dateInput = (args.irrigationDate || 'today').toLowerCase().trim();
  if (dateInput === 'yesterday') {
    resolvedDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  } else if (dateInput !== 'today' && !isNaN(new Date(dateInput).getTime())) {
    resolvedDate = new Date(dateInput).toISOString().split('T')[0];
  }

  targetPlot.lastIrrigationDate = resolvedDate;

  // Calculate calendar days elapsed and forward soil moisture balance
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const past = new Date(resolvedDate);
  past.setHours(0, 0, 0, 0);
  const daysElapsed = Math.max(0, Math.round((now.getTime() - past.getTime()) / 86400000));
  const dailyEtc = (targetPlot.cropCoefficient_Kc || 1.05) * 4.1;
  const taw = (farm.soil.awc_mm_per_m || 150) * (targetPlot.rootDepth_m || 0.6);
  const raw = Math.round(taw * (targetPlot.depletionFraction_p || 0.45));
  const newDr = Math.min(taw, Math.round(daysElapsed * dailyEtc * 10) / 10);
  targetPlot.currentDepletion_mm = newDr;

  farmRuntimeStore.set(farm.id, farm);
  await saveFarmProfileToDynamo(farm);

  const forecast = await resolveForecast(farm.location.latitude, farm.location.longitude);
  const decision = runFeasibilityPlanner({
    plots: farm.plots,
    awc_mm_per_m: farm.soil.awc_mm_per_m,
    reserve: farm.reserve,
    forecast,
  });

  const daysToNext = dailyEtc > 0 ? Math.max(1, Math.round((raw - newDr) / dailyEtc)) : 3;

  const result = {
    success: true,
    farmId: farm.id,
    plotId: targetPlot.id,
    cropName: targetPlot.cropName,
    lastIrrigationDate: resolvedDate,
    daysElapsedSinceWatering: daysElapsed,
    currentDepletion_mm: newDr,
    rawThreshold_mm: raw,
    daysUntilNextIrrigation: daysToNext,
    recommendation: `Irrigation recorded for ${targetPlot.cropName} on ${resolvedDate}. Root depletion reset to ${newDr} mm. Next scheduled watering in ~${daysToNext} days.`,
    updatedFarm: farm,
    newDecision: decision,
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

export const updatePlotMethodSchema = {
  farmId: z.string().describe('The unique identifier of the farm'),
  cropName: z.string().optional().describe('Name of the crop (e.g. "Tomato", "Onion")'),
  plotId: z.string().optional().describe('Specific plot ID'),
  irrigationMethod: z.enum(['drip', 'sprinkler', 'surface_flood']).describe('New irrigation method'),
};

export async function handleUpdatePlotMethod(args: {
  farmId: string;
  cropName?: string;
  plotId?: string;
  irrigationMethod: 'drip' | 'sprinkler' | 'surface_flood';
}) {
  const farm = await resolveFarm(args.farmId);
  if (!farm || !farm.plots || farm.plots.length === 0) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `Farm "${args.farmId}" not found or has no plots.` }],
    };
  }

  let targetPlot = farm.plots[0];
  if (args.plotId) {
    const found = farm.plots.find(p => p.id === args.plotId);
    if (found) targetPlot = found;
  } else if (args.cropName) {
    const search = args.cropName.toLowerCase().trim();
    const found = farm.plots.find(p => p.cropName.toLowerCase().includes(search));
    if (found) targetPlot = found;
  }

  const previousMethod = targetPlot.irrigationMethod || 'surface_flood';
  targetPlot.irrigationMethod = args.irrigationMethod;

  farmRuntimeStore.set(farm.id, farm);
  await saveFarmProfileToDynamo(farm);

  const forecast = await resolveForecast(farm.location.latitude, farm.location.longitude);
  const decision = runFeasibilityPlanner({
    plots: farm.plots,
    awc_mm_per_m: farm.soil.awc_mm_per_m,
    reserve: farm.reserve,
    forecast,
  });

  const oldEff = IRRIGATION_EFFICIENCIES[previousMethod as IrrigationMethod] || 0.60;
  const newEff = IRRIGATION_EFFICIENCIES[args.irrigationMethod] || 0.90;
  const waterSavedPct = newEff > oldEff ? Math.round((1 - (oldEff / newEff)) * 100) : 0;

  const result = {
    success: true,
    farmId: farm.id,
    plotId: targetPlot.id,
    cropName: targetPlot.cropName,
    previousMethod,
    newMethod: args.irrigationMethod,
    newEfficiencyPct: Math.round(newEff * 100),
    waterSavedPct,
    totalFarmDemand_liters: decision.totalFarmDemand_liters,
    recommendation: `Switched ${targetPlot.cropName} to ${args.irrigationMethod} (${Math.round(newEff * 100)}% efficiency). ${waterSavedPct > 0 ? `Saves ${waterSavedPct}% water per cycle.` : ''}`,
    updatedFarm: farm,
    newDecision: decision,
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
