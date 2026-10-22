import { describe, it, expect } from 'vitest';
import { 
  calculateEtc, 
  calculateTaw, 
  calculateRaw, 
  calculateDailyEffectiveRain,
  updateDailySoilWaterBalance,
  calculateHoursToStress,
  computeBaselineDepletionFromDate,
  advanceSoilWaterBalanceToDate
} from '../core/fao56';
import { calculateEnvironmentalLedger } from '../core/environmentalLedger';
import { 
  runFeasibilityPlanner, 
  calculateOptimalIrrigationWindow, 
  allocateWaterBudget 
} from '../core/feasibilityPlanner';
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

  it('correctly aggregates water demand and prioritizes stress across multiple crop field sections', () => {
    const multiPlots: CropBlock[] = [
      {
        id: 'plot-tomato',
        cropName: 'Tomato',
        growthStage: 'mid_season',
        areaValue: 1.0,
        areaUnit: 'bigha',
        area_sq_meters: 1338,
        rootDepth_m: 0.6,
        cropCoefficient_Kc: 1.05,
        depletionFraction_p: 0.45,
        currentDepletion_mm: 30.0,
        irrigationMethod: 'drip',
      },
      {
        id: 'plot-wheat',
        cropName: 'Wheat',
        growthStage: 'mid_season',
        areaValue: 2.0,
        areaUnit: 'bigha',
        area_sq_meters: 2676,
        rootDepth_m: 0.7,
        cropCoefficient_Kc: 1.15,
        depletionFraction_p: 0.55,
        currentDepletion_mm: 55.0, // Stressed!
        irrigationMethod: 'sprinkler',
      },
      {
        id: 'plot-spinach',
        cropName: 'Spinach',
        growthStage: 'development',
        areaValue: 0.5,
        areaUnit: 'bigha',
        area_sq_meters: 669,
        rootDepth_m: 0.25,
        cropCoefficient_Kc: 1.00,
        depletionFraction_p: 0.35,
        currentDepletion_mm: 2.0,
        irrigationMethod: 'drip',
      },
    ];

    const dryForecast: DailyWeatherForecast = {
      date: '2026-10-10',
      rainfall_mm: 0,
      precipitation_probability_pct: 10,
      reference_et0_mm: 4.5,
      temp_max_c: 34,
      temp_min_c: 24,
      relative_humidity_pct: 50,
      source: 'Open-Meteo',
      isLive: false,
      timestamp: new Date().toISOString(),
    };

    const bigReserve: WaterReserve = {
      storageType: 'custom_sump',
      totalCapacity_liters: 500000,
      currentAvailable_liters: 450000,
      pumpPower_hp: 5.0,
    };

    const plan = runFeasibilityPlanner({
      plots: multiPlots,
      awc_mm_per_m: 150,
      reserve: bigReserve,
      forecast: dryForecast,
    });

    // 1. Should have calculations for all 3 plots
    expect(plan.plots).toHaveLength(3);

    // 2. Wheat plot with 55 mm depletion on 0.7m root depth has crossed RAW limit
    const wheatResult = plan.plots.find((p) => p.plotId === 'plot-wheat');
    expect(wheatResult).toBeDefined();
    expect(wheatResult?.urgencyLevel).toBe('critical');

    // 3. Spinach has small deficit and safe buffer
    const spinachResult = plan.plots.find((p) => p.plotId === 'plot-spinach');
    expect(spinachResult).toBeDefined();
    expect(spinachResult?.urgencyLevel).toBe('low');

    // 4. Total farm demand is the sum of gross demands across all 3 plots
    const sumGrossDemands = plan.plots.reduce((acc, p) => acc + p.grossWaterNeeded_liters, 0);
    expect(plan.totalFarmDemand_liters).toBe(sumGrossDemands);

    // 5. Verify pumpRuntime_minutes is computed for each plot based on 5 HP pump
    for (const plotRes of plan.plots) {
      expect(plotRes.pumpRuntime_minutes).toBeGreaterThan(0);
      // Flow rate for 5 HP is 100 L/min
      const expectedMins = Math.round(plotRes.grossWaterNeeded_liters / 100);
      expect(plotRes.pumpRuntime_minutes).toBe(expectedMins);
    }

    // 6. Verify timing window is attached
    expect(plan.timingWindow).toBeDefined();
    expect(plan.timingWindow?.recommendedWindow).toBeDefined();

    // 7. Verify differential plot advice: advises irrigating only Wheat and skipping Tomato & Spinach
    expect(plan.decision).toBe('IRRIGATE_NOW');
    expect(plan.primaryAction).toContain('Irrigate only "Wheat"');
    expect(plan.primaryAction).toContain('Skip "Tomato" & "Spinach" today');
    expect(plan.activeFarmDemand_liters).toBe(wheatResult?.grossWaterNeeded_liters);
  });
});

describe('Diurnal Timing Window Optimization', () => {
  it('delays midday irrigation when urgency is non-critical to prevent evaporative loss', () => {
    const window = calculateOptimalIrrigationWindow({
      currentHour: 13, // 1:00 PM
      urgencyLevel: 'moderate',
      irrigationMethod: 'drip',
    });
    expect(window.canIrrigateNow).toBe(false);
    expect(window.evaporativeRisk).toBe('HIGH');
    expect(window.recommendedWindow).toContain('Delay until');
  });

  it('permits immediate root-zone irrigation during midday if crop stress is critical', () => {
    const window = calculateOptimalIrrigationWindow({
      currentHour: 12, // 12:00 PM
      urgencyLevel: 'critical',
      irrigationMethod: 'drip',
    });
    expect(window.canIrrigateNow).toBe(true);
    expect(window.recommendedWindow).toContain('Immediate');
  });

  it('recommends morning window between 5 AM and 9:30 AM', () => {
    const window = calculateOptimalIrrigationWindow({
      currentHour: 7, // 7:00 AM
      urgencyLevel: 'low',
    });
    expect(window.canIrrigateNow).toBe(true);
    expect(window.evaporativeRisk).toBe('LOW');
    expect(window.recommendedWindow).toContain('Optimal');
  });

  it('warns against sprinkler irrigation during high wind gusts (drift risk)', () => {
    const window = calculateOptimalIrrigationWindow({
      currentHour: 8,
      currentWindSpeed_kmh: 22,
      urgencyLevel: 'low',
      irrigationMethod: 'sprinkler',
    });
    expect(window.windWarning).toBeDefined();
    expect(window.windWarning).toContain('sprinkler');
  });
});

describe('Water Budget Allocator (Shortfall Scenarios)', () => {
  it('prioritizes parcels with lowest hoursToCriticalStress and rations limited storage', () => {
    const mockPlotResults: any[] = [
      {
        plotId: 'plot-low-urgency',
        cropName: 'Tomato',
        grossWaterNeeded_liters: 10000,
        hoursToCriticalStress: 36,
      },
      {
        plotId: 'plot-urgent',
        cropName: 'Wheat',
        grossWaterNeeded_liters: 8000,
        hoursToCriticalStress: 6,
      },
    ];

    // Only 10,000 L available when total needed is 18,000 L
    const allocation = allocateWaterBudget(mockPlotResults, 10000, 5.0);

    expect(allocation.totalBudgetLiters).toBe(10000);
    expect(allocation.totalAllocatedLiters).toBe(10000);
    expect(allocation.unallocatedReserveLiters).toBe(0);

    // Wheat (urgent) must be rank 1 and get full 8,000 L
    const wheatAlloc = allocation.allocations.find(a => a.plotId === 'plot-urgent');
    expect(wheatAlloc?.priorityRank).toBe(1);
    expect(wheatAlloc?.allocatedLiters).toBe(8000);
    expect(wheatAlloc?.unmetLiters).toBe(0);

    // Tomato (lower urgency) gets remaining 2,000 L
    const tomatoAlloc = allocation.allocations.find(a => a.plotId === 'plot-low-urgency');
    expect(tomatoAlloc?.priorityRank).toBe(2);
    expect(tomatoAlloc?.allocatedLiters).toBe(2000);
    expect(tomatoAlloc?.unmetLiters).toBe(8000);
  });
});

describe('Environmental Ledger Energy Modes', () => {
  it('correctly tracks subsidized grid mode with zero direct monetary cost but valid energy savings', () => {
    const ledger = calculateEnvironmentalLedger({
      deferredDepth_mm: 10,
      fieldArea_m2: 1000, // 10,000 L
      pumpPower_hp: 5.0,
      energyMode: 'subsidized_grid',
    });

    expect(ledger.deferredVolume_liters).toBe(10000);
    expect(ledger.electricitySaved_kwh).toBeGreaterThan(0);
    expect(ledger.estimatedCostSaved_inr).toBe(0);
    expect(ledger.transparencyNote).toContain('Subsidized agricultural grid mode');
  });

  it('correctly calculates metered tariff when tariff rate is provided', () => {
    const ledger = calculateEnvironmentalLedger({
      deferredDepth_mm: 10,
      fieldArea_m2: 1000,
      pumpPower_hp: 5.0,
      energyMode: 'metered_grid',
      electricityTariff_inr_per_kwh: 5.0, // ₹5/kWh
    });

    expect(ledger.estimatedCostSaved_inr).toBeDefined();
    expect(ledger.estimatedCostSaved_inr).toBe(Math.round(ledger.electricitySaved_kwh * 5.0));
  });

  it('correctly calculates diesel generator fuel and cost savings in diesel mode', () => {
    const ledger = calculateEnvironmentalLedger({
      deferredDepth_mm: 10,
      fieldArea_m2: 1000,
      pumpPower_hp: 5.0,
      energyMode: 'diesel',
      dieselPrice_inr_per_liter: 95.0,
    });

    expect(ledger.dieselSaved_liters).toBeGreaterThan(0);
    expect(ledger.estimatedCostSaved_inr).toBe(Math.round((ledger.dieselSaved_liters || 0) * 95.0));
    expect(ledger.transparencyNote).toContain('Estimated diesel savings');
  });
});

describe('Dynamic Irrigation Timeline & Daily Water Balance Catch-up', () => {
  it('computes 0 mm depletion when plot was irrigated today', () => {
    const res = computeBaselineDepletionFromDate({
      awc_mm_per_m: 150,
      rootDepth_m: 0.6,
      cropCoefficient_Kc: 1.05,
      dailyEt0_mm: 4.0,
      lastIrrigationDate: '2026-10-22',
      todayDate: '2026-10-22',
    });

    expect(res.elapsedDays).toBe(0);
    expect(res.currentDepletion_mm).toBe(0);
    expect(res.taw_mm).toBe(90);
  });

  it('safely clamps future dates to 0 mm depletion without negative errors', () => {
    const res = computeBaselineDepletionFromDate({
      awc_mm_per_m: 150,
      rootDepth_m: 0.6,
      cropCoefficient_Kc: 1.05,
      dailyEt0_mm: 4.0,
      lastIrrigationDate: '2026-10-25', // Future date
      todayDate: '2026-10-22',
    });

    expect(res.elapsedDays).toBe(0);
    expect(res.currentDepletion_mm).toBe(0);
  });

  it('accumulates exact ETc deficit across elapsed days', () => {
    // dailyEtc = 4.0 * 1.05 = 4.2 mm/day
    // 3 days elapsed -> 3 * 4.2 = 12.6 mm
    const res = computeBaselineDepletionFromDate({
      awc_mm_per_m: 150,
      rootDepth_m: 0.6,
      cropCoefficient_Kc: 1.05,
      dailyEt0_mm: 4.0,
      lastIrrigationDate: '2026-10-19',
      todayDate: '2026-10-22',
    });

    expect(res.elapsedDays).toBe(3);
    expect(res.dailyEtc_mm).toBe(4.2);
    expect(res.currentDepletion_mm).toBe(12.6);
  });

  it('strictly bounds depletion by TAW (Permanent Wilting Point limit) for old dates', () => {
    // TAW = 150 * 0.4 = 60 mm
    // 90 days elapsed at 4.2 mm/day = 378 mm -> must be clamped to 60 mm
    const res = computeBaselineDepletionFromDate({
      awc_mm_per_m: 150,
      rootDepth_m: 0.4,
      cropCoefficient_Kc: 1.05,
      dailyEt0_mm: 4.0,
      lastIrrigationDate: '2026-07-24',
      todayDate: '2026-10-22',
    });

    expect(res.elapsedDays).toBe(90);
    expect(res.taw_mm).toBe(60);
    expect(res.currentDepletion_mm).toBe(60); // Clamped at TAW
  });

  it('advances daily water balance day-by-day with rainfall and ETc', () => {
    // Starting with 10 mm depletion
    // Over 2 elapsed days: ETc = 3.0 mm/day, Rain = 0 mm
    // Day 1: 10 + 3 = 13 mm
    // Day 2: 13 + 3 = 16 mm
    const stepDry = advanceSoilWaterBalanceToDate({
      currentDepletion_mm: 10.0,
      taw_mm: 60.0,
      raw_mm: 30.0,
      dailyEtc_mm: 3.0,
      dailyRain_mm: 0.0,
      lastCalculationDate: '2026-10-20',
      todayDate: '2026-10-22',
    });

    expect(stepDry.elapsedDays).toBe(2);
    expect(stepDry.newDepletion_mm).toBe(16.0);
    expect(stepDry.isStressed).toBe(false);

    // With rain replenishment: 20 mm rain on 16 mm depletion
    // 16 - 16(effective) + 3(ETc) = 3 mm
    const stepRain = advanceSoilWaterBalanceToDate({
      currentDepletion_mm: 16.0,
      taw_mm: 60.0,
      raw_mm: 30.0,
      dailyEtc_mm: 3.0,
      dailyRain_mm: 20.0,
      lastCalculationDate: '2026-10-21',
      todayDate: '2026-10-22',
    });

    expect(stepRain.elapsedDays).toBe(1);
    expect(stepRain.newDepletion_mm).toBe(3.0);
  });
});


