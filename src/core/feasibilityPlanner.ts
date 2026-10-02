import { CropBlock, WaterReserve } from '../types/farm';
import { DailyWeatherForecast } from '../types/weather';
import { 
  PlotCalculationResult, 
  DecisionState, 
  DecisionResponse 
} from '../types/decision';
import { 
  calculateEtc, 
  calculateTaw, 
  calculateRaw, 
  calculateDailyEffectiveRain,
  calculateHoursToStress,
  updateDailySoilWaterBalance 
} from './fao56';
import { calculateEnvironmentalLedger } from './environmentalLedger';

export interface PlanningInput {
  plots: CropBlock[];
  awc_mm_per_m: number;
  reserve: WaterReserve;
  forecast: DailyWeatherForecast;
  isDemoPreset?: boolean;
}

export function runFeasibilityPlanner(input: PlanningInput): DecisionResponse {
  const { plots, awc_mm_per_m, reserve, forecast, isDemoPreset = false } = input;

  let totalFarmDemand_liters = 0;
  let totalAvoidedDepth_mm = 0;
  let totalFieldArea_m2 = 0;

  const plotResults: PlotCalculationResult[] = [];

  for (const plot of plots) {
    const taw_mm = calculateTaw(awc_mm_per_m, plot.rootDepth_m);
    const raw_mm = calculateRaw(plot.depletionFraction_p, taw_mm);
    const etc_mm = calculateEtc(forecast.reference_et0_mm, plot.cropCoefficient_Kc);

    const { effectiveRain_mm, excess_mm } = calculateDailyEffectiveRain(
      forecast.rainfall_mm,
      plot.currentDepletion_mm
    );

    // Projected next-day state if no irrigation is applied
    const nextDayState = updateDailySoilWaterBalance(
      plot.currentDepletion_mm,
      forecast.rainfall_mm,
      0, // Zero irrigation
      etc_mm,
      taw_mm,
      raw_mm
    );

    const hoursToStress = calculateHoursToStress(plot.currentDepletion_mm, raw_mm, etc_mm);

    // Water needed to refill root zone up to field capacity (or up to RAW threshold)
    // Application depth = current depletion Dr (in mm)
    const irrigationDepth_mm = plot.currentDepletion_mm;
    const waterNeeded_liters = Math.round(irrigationDepth_mm * plot.area_sq_meters);

    let urgencyLevel: 'low' | 'moderate' | 'critical' = 'low';
    if (plot.currentDepletion_mm >= raw_mm || hoursToStress < 24) {
      urgencyLevel = 'critical';
    } else if (hoursToStress < 48) {
      urgencyLevel = 'moderate';
    }

    totalFarmDemand_liters += waterNeeded_liters;
    totalFieldArea_m2 += plot.area_sq_meters;
    totalAvoidedDepth_mm += irrigationDepth_mm * (plot.area_sq_meters); // Area-weighted

    plotResults.push({
      plotId: plot.id,
      cropName: plot.cropName,
      taw_mm,
      raw_mm,
      currentDepletion_mm: plot.currentDepletion_mm,
      dailyEtc_mm: etc_mm,
      effectiveRain_mm,
      runoffOrPercolation_mm: excess_mm,
      projectedDepletionTomorrow_mm: nextDayState.nextDepletion_mm,
      hoursToCriticalStress: hoursToStress,
      waterNeeded_liters,
      urgencyLevel,
    });
  }

  const avgAvoidedDepth_mm = totalFieldArea_m2 > 0 ? totalAvoidedDepth_mm / totalFieldArea_m2 : 0;
  const availableWater_liters = reserve.currentAvailable_liters;
  const waterShortfall_liters = Math.max(0, totalFarmDemand_liters - availableWater_liters);

  // Decision logic
  let decision: DecisionState = 'IRRIGATE_NOW';
  let primaryAction = '';
  let actionWindow = '';
  let confidence: 'HIGH' | 'MODERATE' | 'LOW' = 'HIGH';
  let confidenceReason = '';

  const hasHighRainForecast = forecast.rainfall_mm >= 10 && forecast.precipitation_probability_pct >= 60;
  const anyPlotCritical = plotResults.some(p => p.urgencyLevel === 'critical');

  if (hasHighRainForecast && !anyPlotCritical) {
    // Rain is coming and no crop is currently in critical drought stress -> WAIT
    decision = 'WAIT_AND_REASSESS';
    primaryAction = `Hold off irrigation. Expected effective rainfall (${forecast.rainfall_mm} mm) can recharge the root zone safely.`;
    actionWindow = 'Reassess within 24–36 hours post-rainfall';
    confidence = forecast.precipitation_probability_pct >= 75 ? 'HIGH' : 'MODERATE';
    confidenceReason = `Rain forecast is ${forecast.precipitation_probability_pct}% probable (${forecast.rainfall_mm} mm expected).`;
  } else if (waterShortfall_liters > 0 && anyPlotCritical) {
    // Water needed exceeds current reserve
    decision = 'RESOURCE_DEFICIT_ALERT';
    const nearestStress = Math.min(...plotResults.map(p => p.hoursToCriticalStress));
    primaryAction = `Water deficit detected! Total farm need is ${totalFarmDemand_liters.toLocaleString()} L, but available reserve is ${availableWater_liters.toLocaleString()} L (Shortfall: ${waterShortfall_liters.toLocaleString()} L).`;
    actionWindow = `Critical stress deadline in ${nearestStress} hours`;
    confidence = 'HIGH';
    confidenceReason = 'Available tank/reserve volume is insufficient to meet full root-zone recharge.';
  } else if (anyPlotCritical) {
    decision = 'IRRIGATE_NOW';
    primaryAction = `Apply irrigation to replenish root zones before critical moisture threshold is crossed.`;
    actionWindow = 'Apply within 12–24 hours';
    confidence = 'HIGH';
    confidenceReason = 'Root-zone depletion has reached or is rapidly approaching the crop stress threshold.';
  } else {
    decision = 'WAIT_AND_REASSESS';
    primaryAction = `Soil moisture is within safe levels. Monitor weather and reassess in 2 days.`;
    actionWindow = 'Safe for the next 48 hours';
    confidence = 'HIGH';
    confidenceReason = 'All crop plots have adequate moisture buffer above critical stress.';
  }

  // Environmental Ledger calculation:
  // If decision is WAIT_AND_REASSESS, calculate avoided scheduled irrigation depth
  const deferredDepth = decision === 'WAIT_AND_REASSESS' ? avgAvoidedDepth_mm : 0;
  const environmentalLedger = calculateEnvironmentalLedger({
    deferredDepth_mm: deferredDepth,
    fieldArea_m2: totalFieldArea_m2,
    pumpPower_hp: reserve.pumpPower_hp || 5,
    knownFlowRate_l_hr: reserve.knownFlowRate_liters_per_hr,
  });

  return {
    decision,
    primaryAction,
    actionWindow,
    confidence,
    confidenceReason,
    totalFarmDemand_liters,
    availableWater_liters,
    waterShortfall_liters,
    plots: plotResults,
    environmentalLedger,
    advisoryText: {
      english: primaryAction,
    },
    metadata: {
      calculationTimestamp: new Date().toISOString(),
      engineVersion: 'FieldGuard-v1.0-FAO56',
      weatherDataTimestamp: forecast.timestamp,
      isDemoPreset,
    },
  };
}
