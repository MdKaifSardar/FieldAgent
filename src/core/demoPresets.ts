import { FarmProfile } from '../types/farm';
import { DailyWeatherForecast } from '../types/weather';
import { runFeasibilityPlanner } from './feasibilityPlanner';
import { DecisionResponse } from '../types/decision';

export interface DemoPreset {
  id: string;
  title: string;
  subtitle: string;
  farm: FarmProfile;
  forecast: DailyWeatherForecast;
}

/**
 * PRESET 1: Rain Avoidance Decision Shift (Water Conservation)
 * Context: Tomato crop in Bardhaman with moderate root deficit (35 mm).
 * Forecast: 22 mm rain incoming with 85% probability.
 * Outcome: "WAIT & REASSESS" -> 16,500 Litres of irrigation deferred!
 */
export const PRESET_1_RAIN_AVOIDANCE: DemoPreset = {
  id: 'preset_rain_avoidance',
  title: 'Scenario A: Rain Avoidance (Water Conserved)',
  subtitle: '22 mm effective rain forecast incoming within 36 hours. Irrigation deferred.',
  farm: {
    id: 'farm-bardhaman-01',
    userId: 'farmer-ramesh',
    farmName: "Ramesh's Tomato Field",
    location: {
      latitude: 23.2324,
      longitude: 87.8615,
      villageOrPincode: 'Bardhaman, West Bengal (713101)',
    },
    soil: {
      texture: 'loamy',
      awc_mm_per_m: 150, // Loamy soil: 150 mm water capacity per metre
      infiltration_rate_mm_hr: 15,
    },
    reserve: {
      storageType: 'sintex_tank',
      totalCapacity_liters: 5000,
      currentAvailable_liters: 3200,
      nextReplenishmentDate: '2026-10-14',
      pumpPower_hp: 5.0,
      knownFlowRate_liters_per_hr: 6000,
    },
    plots: [
      {
        id: 'plot-tomato-01',
        cropName: 'Tomato',
        variety: 'Pusa Ruby',
        growthStage: 'mid_season',
        areaValue: 1.5,
        areaUnit: 'bigha',
        area_sq_meters: 2007, // 1.5 Bigha = 2,007 m²
        rootDepth_m: 0.6,
        cropCoefficient_Kc: 1.05,
        depletionFraction_p: 0.45,
        currentDepletion_mm: 35.0,
        lastIrrigationDate: '2026-10-04',
      },
    ],
    createdAt: '2026-10-08T09:00:00.000Z',
    updatedAt: '2026-10-08T09:00:00.000Z',
  },
  forecast: {
    date: '2026-10-09',
    rainfall_mm: 22.0,
    precipitation_probability_pct: 85,
    reference_et0_mm: 4.1,
    temp_max_c: 31,
    temp_min_c: 24,
    relative_humidity_pct: 82,
    source: 'Open-Meteo Meteorological Feed',
    timestamp: '2026-10-09T06:00:00.000Z',
  },
};

/**
 * PRESET 2: Resource Deficit Alert (Multi-Crop Water Rationing)
 * Context: Multi-crop farm (Tomato + Spinach) in Nashik facing high temperature (36°C) and zero rain.
 * Storage: Tank has only 800 L available against 3,300 L demand.
 * Outcome: "RESOURCE DEFICIT ALERT" -> flags Spinach shallow-root wilting deadline in 20 hours.
 */
export const PRESET_2_RESOURCE_DEFICIT: DemoPreset = {
  id: 'preset_resource_deficit',
  title: 'Scenario B: Severe Drought / Tank Deficit',
  subtitle: '36°C heatwave, zero rain. Total need is 3,300 L but tank only has 800 L.',
  farm: {
    id: 'farm-nashik-02',
    userId: 'farmer-ramesh',
    farmName: 'Ramesh Multi-Crop Parcel',
    location: {
      latitude: 19.9975,
      longitude: 73.7898,
      villageOrPincode: 'Nashik, Maharashtra (422001)',
    },
    soil: {
      texture: 'clay_black',
      awc_mm_per_m: 180,
      infiltration_rate_mm_hr: 8,
    },
    reserve: {
      storageType: 'custom_sump',
      totalCapacity_liters: 4000,
      currentAvailable_liters: 800, // Deficit!
      nextReplenishmentDate: '2026-10-12',
      pumpPower_hp: 3.0,
      knownFlowRate_liters_per_hr: 4500,
    },
    plots: [
      {
        id: 'plot-tomato-main',
        cropName: 'Tomato',
        growthStage: 'mid_season',
        areaValue: 1.0,
        areaUnit: 'bigha',
        area_sq_meters: 1338,
        rootDepth_m: 0.6,
        cropCoefficient_Kc: 1.05,
        depletionFraction_p: 0.45,
        currentDepletion_mm: 38.0,
      },
      {
        id: 'plot-spinach-greens',
        cropName: 'Spinach',
        growthStage: 'development',
        areaValue: 0.5,
        areaUnit: 'bigha',
        area_sq_meters: 669,
        rootDepth_m: 0.25, // Shallow roots!
        cropCoefficient_Kc: 1.00,
        depletionFraction_p: 0.35,
        currentDepletion_mm: 14.5,
      },
    ],
    createdAt: '2026-10-08T10:00:00.000Z',
    updatedAt: '2026-10-08T10:00:00.000Z',
  },
  forecast: {
    date: '2026-10-09',
    rainfall_mm: 0.0,
    precipitation_probability_pct: 5,
    reference_et0_mm: 5.2,
    temp_max_c: 36.5,
    temp_min_c: 25.0,
    relative_humidity_pct: 38,
    source: 'Open-Meteo Meteorological Feed',
    timestamp: '2026-10-09T06:00:00.000Z',
  },
};

export const DEMO_PRESETS: Record<string, DemoPreset> = {
  [PRESET_1_RAIN_AVOIDANCE.id]: PRESET_1_RAIN_AVOIDANCE,
  [PRESET_2_RESOURCE_DEFICIT.id]: PRESET_2_RESOURCE_DEFICIT,
};

export function executePreset(presetId: string): DecisionResponse {
  const preset = DEMO_PRESETS[presetId] || PRESET_1_RAIN_AVOIDANCE;
  return runFeasibilityPlanner({
    plots: preset.farm.plots,
    awc_mm_per_m: preset.farm.soil.awc_mm_per_m,
    reserve: preset.farm.reserve,
    forecast: preset.forecast,
    isDemoPreset: true,
  });
}
