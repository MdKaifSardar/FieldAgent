import { describe, it, expect } from 'vitest';
import { 
  calculateEtc, 
  calculateTaw, 
  calculateRaw, 
  calculateDailyEffectiveRain,
  updateDailySoilWaterBalance,
  calculateHoursToStress 
} from '../core/fao56';
import { calculateEnvironmentalLedger } from '../core/environmentalLedger';
import { runFeasibilityPlanner } from '../core/feasibilityPlanner';
import { CropBlock, WaterReserve } from '../types/farm';
import { DailyWeatherForecast } from '../types/weather';

describe('FAO-56 Soil Water Balance Equations', () => {
  it('correctly calculates Crop Evapotranspiration (ETc = ET0 * Kc)', () => {
    // Standard FAO example: ET0 = 4.0 mm, Kc = 1.05 -> ETc = 4.2 mm
    expect(calculateEtc(4.0, 1.05)).toBe(4.2);
    // Paddy mid-season: ET0 = 5.2 mm, Kc = 1.15 -> ETc = 5.98 mm
    expect(calculateEtc(5.2, 1.15)).toBe(5.98);
  });

  it('correctly calculates TAW from AWC and Root Depth (Zr)', () => {
    // Loam soil: AWC = 150 mm/m, Root Depth = 0.6 m -> TAW = 90 mm
    expect(calculateTaw(150, 0.6)).toBe(90.0);
    // Sandy soil: AWC = 90 mm/m, Root Depth = 0.4 m -> TAW = 36 mm
    expect(calculateTaw(90, 0.4)).toBe(36.0);
  });

  it('correctly calculates RAW using depletion fraction p', () => {
    // TAW = 90 mm, p = 0.45 -> RAW = 40.5 mm
    expect(calculateRaw(0.45, 90)).toBe(40.5);
  });

  it('handles daily effective rain vs runoff cleanly', () => {
    // Case 1: Deficit is 35 mm, Rain is 20 mm -> All 20 mm enters root zone
    const case1 = calculateDailyEffectiveRain(20, 35);
    expect(case1.effectiveRain_mm).toBe(20);
    expect(case1.excess_mm).toBe(0);

    // Case 2: Deficit is 12 mm, Rain is 30 mm -> 12 mm fills root zone, 18 mm runs off/percolates
    const case2 = calculateDailyEffectiveRain(30, 12);
    expect(case2.effectiveRain_mm).toBe(12);
    expect(case2.excess_mm).toBe(18);
  });

  it('steps forward daily soil water balance and detects stress', () => {
    const taw = 90;
    const raw = 40.5;
    const etc = 4.2;

    // Start with 30 mm deficit, 0 rain, 0 irrigation -> New deficit = 30 + 4.2 = 34.2 mm (Not stressed)
    const step1 = updateDailySoilWaterBalance(30, 0, 0, etc, taw, raw);
    expect(step1.nextDepletion_mm).toBe(34.2);
    expect(step1.isStressed).toBe(false);

    // Start with 38 mm deficit, 0 rain -> New deficit = 38 + 4.2 = 42.2 mm (Crossed RAW = 40.5, Stressed!)
    const step2 = updateDailySoilWaterBalance(38, 0, 0, etc, taw, raw);
    expect(step2.nextDepletion_mm).toBe(42.2);
    expect(step2.isStressed).toBe(true);
  });

  it('calculates hours to critical stress accurately', () => {
    // Dr = 30 mm, RAW = 42 mm, daily ETc = 4.8 mm -> Buffer = 12 mm, Hourly ETc = 0.2 mm/hr -> 60 hours
    const hours = calculateHoursToStress(30, 42, 4.8);
    expect(hours).toBe(60.0);

    // Already stressed
    expect(calculateHoursToStress(45, 42, 4.8)).toBe(0);
  });
});

describe('Environmental Impact Ledger', () => {
  it('accurately derives deferred irrigation volume (e.g. 16,500 L demo benchmark)', () => {
    // Avoided 8.22 mm application depth over a 2,007 m² plot
    const ledger = calculateEnvironmentalLedger({
      deferredDepth_mm: 8.2212,
      fieldArea_m2: 2007,
      pumpPower_hp: 5.0,
    });

    expect(ledger.deferredVolume_liters).toBe(16500);
    expect(ledger.pumpingHoursSaved).toBe(2.8); // 16,500 L / 6,000 L/hr = 2.75 ~ 2.8 hrs
    expect(ledger.electricitySaved_kwh).toBeGreaterThan(10);
    expect(ledger.carbonOffset_kg_co2).toBeGreaterThan(8);
  });
});

describe('Feasibility Planner & Multi-Crop Decision Logic', () => {
  const mockPlots: CropBlock[] = [
    {
      id: 'plot-1',
      cropName: 'Tomato',
      growthStage: 'mid_season',
      areaValue: 1.5,
      areaUnit: 'bigha',
      area_sq_meters: 2007,
      rootDepth_m: 0.6,
      cropCoefficient_Kc: 1.05,
      depletionFraction_p: 0.45,
      currentDepletion_mm: 35.0,
      irrigationMethod: 'drip',
    },
  ];

  const mockReserve: WaterReserve = {
    storageType: 'sintex_tank',
    totalCapacity_liters: 3000,
    currentAvailable_liters: 2500,
    pumpPower_hp: 5.0,
  };

  it('triggers WAIT_AND_REASSESS when substantial rain is forecast', () => {
    const rainForecast: DailyWeatherForecast = {
      date: '2026-10-10',
      rainfall_mm: 22.0,
      precipitation_probability_pct: 85,
      reference_et0_mm: 4.1,
      temp_max_c: 32,
      temp_min_c: 24,
      relative_humidity_pct: 78,
      source: 'Open-Meteo',
      isLive: false,
      timestamp: new Date().toISOString(),
    };

    const result = runFeasibilityPlanner({
      plots: mockPlots,
      awc_mm_per_m: 150,
      reserve: mockReserve,
      forecast: rainForecast,
      isDemoPreset: true,
    });

    expect(result.decision).toBe('WAIT_AND_REASSESS');
    expect(result.environmentalLedger.deferredVolume_liters).toBeGreaterThan(0);
  });

  it('triggers RESOURCE_DEFICIT_ALERT when water needed exceeds tank reserve', () => {
    const dryForecast: DailyWeatherForecast = {
      date: '2026-10-10',
      rainfall_mm: 0,
      precipitation_probability_pct: 5,
      reference_et0_mm: 4.8,
      temp_max_c: 36,
      temp_min_c: 26,
      relative_humidity_pct: 45,
      source: 'Open-Meteo',
      isLive: false,
      timestamp: new Date().toISOString(),
    };

    // Stressed plot with high depletion (42 mm) needing ~84,000 L, but tank only has 500 L
    const stressedPlot: CropBlock = {
      ...mockPlots[0],
      currentDepletion_mm: 42.0, // Exceeds RAW (40.5 mm)
    };

    const lowReserve: WaterReserve = {
      ...mockReserve,
      currentAvailable_liters: 500,
    };

    const result = runFeasibilityPlanner({
      plots: [stressedPlot],
      awc_mm_per_m: 150,
      reserve: lowReserve,
      forecast: dryForecast,
    });

    expect(result.decision).toBe('RESOURCE_DEFICIT_ALERT');
    expect(result.waterShortfall_liters).toBeGreaterThan(0);
  });
});
