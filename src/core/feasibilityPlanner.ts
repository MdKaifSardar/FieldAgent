import { CropBlock, WaterReserve, IRRIGATION_EFFICIENCIES, IrrigationMethod } from '../types/farm';
import { DailyWeatherForecast } from '../types/weather';
import { 
  PlotCalculationResult, 
  DecisionState, 
  DecisionResponse,
  IrrigationTimingWindow,
  WaterAllocationSummary,
  PlotAllocationResult
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

/**
 * Evaluates real-time diurnal timing window based on current hour, temperature, and wind.
 */
export function calculateOptimalIrrigationWindow(params: {
  currentHour?: number;
  currentTemp_c?: number;
  currentWindSpeed_kmh?: number;
  urgencyLevel: 'low' | 'moderate' | 'critical';
  irrigationMethod?: IrrigationMethod;
}): IrrigationTimingWindow {
  const currentHour = params.currentHour !== undefined ? params.currentHour : new Date().getHours();
  const currentWind = params.currentWindSpeed_kmh || 10;
  const isHighWind = currentWind >= 18;
  const windWarning = (isHighWind && params.irrigationMethod === 'sprinkler')
    ? `High wind gusts (${currentWind} km/h). Delay overhead sprinkler to prevent airborne drift.`
    : undefined;

  // Midday window: 10:00 AM to 3:30 PM (10 to 15)
  if (currentHour >= 10 && currentHour < 16) {
    if (params.urgencyLevel === 'critical') {
      return {
        recommendedWindow: 'Immediate (Root-Zone Only)',
        advisoryText: 'Critical root-zone moisture deficit. Irrigate immediately at root base to prevent permanent wilting.',
        canIrrigateNow: true,
        evaporativeRisk: 'HIGH',
        windWarning,
      };
    }
    return {
      recommendedWindow: 'Delay until 5:00 PM – 7:00 PM',
      advisoryText: 'Midday heat causes up to 35% evaporative loss. Wait until late afternoon.',
      canIrrigateNow: false,
      evaporativeRisk: 'HIGH',
      windWarning,
    };
  }

  // Early morning window: 5:00 AM to 9:30 AM (5 to 9)
  if (currentHour >= 5 && currentHour < 10) {
    return {
      recommendedWindow: 'Optimal: Now until 9:30 AM',
      advisoryText: 'Cool soil and calm wind minimize evaporation. Ideal application window.',
      canIrrigateNow: true,
      evaporativeRisk: 'LOW',
      windWarning,
    };
  }

  // Late afternoon / Dusk: 4:00 PM to 7:30 PM (16 to 19)
  if (currentHour >= 16 && currentHour < 20) {
    return {
      recommendedWindow: 'Optimal: Now until Dusk (7:30 PM)',
      advisoryText: 'Declining solar heat. Water will safely infiltrate overnight.',
      canIrrigateNow: true,
      evaporativeRisk: 'LOW',
      windWarning,
    };
  }

  // Night: 8:00 PM to 4:30 AM
  return {
    recommendedWindow: 'Tomorrow Morning: 5:30 AM – 7:30 AM',
    advisoryText: 'Avoid nocturnal leaf wetness to reduce fungal risk. Schedule pump for early dawn.',
    canIrrigateNow: false,
    evaporativeRisk: 'LOW',
    windWarning,
  };
}

/**
 * Deterministically allocates constrained water budget across parcels by stress urgency.
 */
export function allocateWaterBudget(
  plots: PlotCalculationResult[],
  availableWater_liters: number,
  pumpHp: number = 5.0
): WaterAllocationSummary {
  const flowRate_lpm = Math.max(10, pumpHp * 20); // 5 HP -> 100 L/min
  let remainingBudget = Math.max(0, availableWater_liters);
  
  // Sort by priority: lowest hours to stress first
  const sorted = [...plots].sort((a, b) => a.hoursToCriticalStress - b.hoursToCriticalStress);
  const allocations: PlotAllocationResult[] = [];
  let totalAllocated = 0;

  for (let idx = 0; idx < sorted.length; idx++) {
    const p = sorted[idx];
    const demand = p.grossWaterNeeded_liters;
    const allocated = Math.min(demand, remainingBudget);
    const unmet = Math.max(0, demand - allocated);
    const pumpMinutes = Math.round(allocated / flowRate_lpm);

    remainingBudget -= allocated;
    totalAllocated += allocated;

    let rationale = '';
    if (allocated === demand) {
      rationale = `Full allocation granted (Rank #${idx + 1}, stress in ${p.hoursToCriticalStress}h).`;
    } else if (allocated > 0) {
      rationale = `Partial allocation (${allocated.toLocaleString()} L of ${demand.toLocaleString()} L) due to restricted storage.`;
    } else {
      rationale = `Deferred: insufficient water reserve. Focus water on higher-urgency plots.`;
    }

    allocations.push({
      plotId: p.plotId,
      cropName: p.cropName,
      demandedLiters: demand,
      allocatedLiters: allocated,
      allocatedPumpMinutes: pumpMinutes,
      unmetLiters: unmet,
      priorityRank: idx + 1,
      rationale,
    });
  }

  return {
    totalBudgetLiters: availableWater_liters,
    totalAllocatedLiters: totalAllocated,
    unallocatedReserveLiters: remainingBudget,
    allocations,
  };
}

export function runFeasibilityPlanner(input: PlanningInput): DecisionResponse {
  const { plots, awc_mm_per_m, reserve, forecast, isDemoPreset = false } = input;

  let totalFarmDemand_liters = 0; // Gross pumping volume needed
  let netFarmDemand_liters = 0;   // Net crop uptake volume needed
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
      0, // Zero irrigation applied today
      etc_mm,
      taw_mm,
      raw_mm
    );

    const hoursToStress = calculateHoursToStress(plot.currentDepletion_mm, raw_mm, etc_mm);

    // Irrigation depth = current depletion Dr in mm
    const irrigationDepth_mm = plot.currentDepletion_mm;
    const netWaterNeeded_liters = Math.round(irrigationDepth_mm * plot.area_sq_meters);

    // Irrigation method application efficiency
    const method: IrrigationMethod = plot.irrigationMethod || 'surface_flood';
    const efficiency = IRRIGATION_EFFICIENCIES[method] || 0.75;
    const grossWaterNeeded_liters = Math.round(netWaterNeeded_liters / efficiency);

    let urgencyLevel: 'low' | 'moderate' | 'critical' = 'low';
    if (plot.currentDepletion_mm >= raw_mm || hoursToStress < 24) {
      urgencyLevel = 'critical';
    } else if (hoursToStress < 48) {
      urgencyLevel = 'moderate';
    }    const pumpHp = reserve.pumpPower_hp || 5.0;
    const flowRate_lpm = Math.max(10, pumpHp * 20);
    const pumpRuntime_minutes = Math.round(grossWaterNeeded_liters / flowRate_lpm);

    netFarmDemand_liters += netWaterNeeded_liters;
    totalFarmDemand_liters += grossWaterNeeded_liters;
    totalFieldArea_m2 += plot.area_sq_meters;
    totalAvoidedDepth_mm += irrigationDepth_mm * plot.area_sq_meters;

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
      waterNeeded_liters: netWaterNeeded_liters,
      grossWaterNeeded_liters,
      pumpRuntime_minutes,
      irrigationMethod: method,
      irrigationEfficiency: efficiency,
      urgencyLevel,
    });
  }

  const avgAvoidedDepth_mm = totalFieldArea_m2 > 0 ? totalAvoidedDepth_mm / totalFieldArea_m2 : 0;
  const availableWater_liters = reserve.currentAvailable_liters;
  const waterShortfall_liters = Math.max(0, totalFarmDemand_liters - availableWater_liters);
  const totalPumpRuntime_minutes = plotResults.reduce((acc, p) => acc + (p.pumpRuntime_minutes || 0), 0);

  // Timing window evaluation
  const anyPlotCritical = plotResults.some(p => p.urgencyLevel === 'critical');
  const anyPlotModerate = plotResults.some(p => p.urgencyLevel === 'moderate');
  const worstUrgency = anyPlotCritical ? 'critical' : anyPlotModerate ? 'moderate' : 'low';
  const dominantMethod = plots[0]?.irrigationMethod;

  const timingWindow = calculateOptimalIrrigationWindow({
    urgencyLevel: worstUrgency,
    irrigationMethod: dominantMethod,
    currentTemp_c: forecast.current_temp_c !== undefined
      ? forecast.current_temp_c
      : forecast.temp_max_c ? (forecast.temp_max_c + (forecast.temp_min_c || 20)) / 2 : undefined,
    currentWindSpeed_kmh: forecast.current_wind_speed_kmh,
  });

  // Water budget allocation if shortfall exists
  let waterAllocation: WaterAllocationSummary | undefined;
  if (waterShortfall_liters > 0) {
    waterAllocation = allocateWaterBudget(plotResults, availableWater_liters, reserve.pumpPower_hp || 5.0);
  }

  // Decision logic
  let decision: DecisionState = 'IRRIGATE_NOW';
  let primaryAction = '';
  let primaryActionHindi = '';
  let primaryActionBengali = '';
  let actionWindow = '';
  let confidence: 'HIGH' | 'MODERATE' | 'LOW' = 'HIGH';
  let confidenceReason = '';

  const hasHighRainForecast = forecast.rainfall_mm >= 10 && forecast.precipitation_probability_pct >= 60;

  // Environmental Ledger calculation early so deferred metrics can enrich advisory
  const deferredDepth = (hasHighRainForecast && !anyPlotCritical) || (!anyPlotCritical && !anyPlotModerate)
    ? avgAvoidedDepth_mm
    : 0;

  const environmentalLedger = calculateEnvironmentalLedger({
    deferredDepth_mm: deferredDepth,
    fieldArea_m2: totalFieldArea_m2,
    pumpPower_hp: reserve.pumpPower_hp || 5,
    knownFlowRate_l_hr: reserve.knownFlowRate_liters_per_hr,
  });

  const pumpHpStr = `${reserve.pumpPower_hp || 5} HP`;
  const formatMins = (mins: number) => {
    if (mins < 60) return `${mins} mins`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h} hrs`;
  };

  const plotsNeedingWater = plotResults.filter(p => p.urgencyLevel === 'critical' || p.urgencyLevel === 'moderate');
  const safePlots = plotResults.filter(p => p.urgencyLevel === 'low');
  const activeFarmDemand_liters = plotsNeedingWater.reduce((acc, p) => acc + p.grossWaterNeeded_liters, 0);
  const activePumpRuntime_minutes = plotsNeedingWater.reduce((acc, p) => acc + (p.pumpRuntime_minutes || 0), 0);

  if (hasHighRainForecast && !anyPlotCritical) {
    decision = 'WAIT_AND_REASSESS';
    const savedVol = environmentalLedger.deferredVolume_liters || 0;
    const savedHours = environmentalLedger.pumpingHoursSaved || 0;
    primaryAction = `Hold off irrigation. Expected rain (${forecast.rainfall_mm} mm) will recharge crops naturally, saving ${savedVol.toLocaleString()} L of water and ~${savedHours.toFixed(1)} hrs of pump operation.`;
    primaryActionHindi = `सिंचाई रोकें। अपेक्षित बारिश (${forecast.rainfall_mm} मिमी) फसल की जड़ों को प्राकृतिक रूप से सींचेगी, जिससे ${savedVol.toLocaleString()} लीटर पानी और ~${savedHours.toFixed(1)} घंटे पंप बिजली बचेगी।`;
    primaryActionBengali = `সেচ স্থগিত রাখুন। প্রত্যাশিত বৃষ্টিপাত (${forecast.rainfall_mm} মিমি) প্রাকৃতিকভাবে জমি ভিজিয়ে দেবে, ফলে ${savedVol.toLocaleString()} লিটার জল এবং প্রায় ${savedHours.toFixed(1)} ঘণ্টা পাম্প চালানো বাঁচবে।`;
    actionWindow = 'Reassess within 24–36 hours post-rainfall';
    confidence = forecast.precipitation_probability_pct >= 75 ? 'HIGH' : 'MODERATE';
    confidenceReason = `Rain forecast is ${forecast.precipitation_probability_pct}% probable (${forecast.rainfall_mm} mm expected).`;
  } else if (waterShortfall_liters > 0 && anyPlotCritical) {
    decision = 'RESOURCE_DEFICIT_ALERT';
    const nearestStress = Math.min(...plotResults.map(p => p.hoursToCriticalStress));
    const topPlot = waterAllocation?.allocations[0];
    const topPlotText = topPlot ? `Prioritize Plot "${topPlot.cropName}" with ${topPlot.allocatedLiters.toLocaleString()} L (${topPlot.allocatedPumpMinutes} mins pump time).` : '';
    const topPlotHindi = topPlot ? `प्राथमिकता के आधार पर पहले "${topPlot.cropName}" को ${topPlot.allocatedLiters.toLocaleString()} लीटर दें (${topPlot.allocatedPumpMinutes} मिनट)।` : '';
    const topPlotBengali = topPlot ? `অগ্রাধিকার ভিত্তিতে প্রথমে "${topPlot.cropName}"-এ ${topPlot.allocatedLiters.toLocaleString()} লিটার দিন (${topPlot.allocatedPumpMinutes} মিনিট)।` : '';

    primaryAction = `Water deficit alert! Need ${totalFarmDemand_liters.toLocaleString()} L, but available reserve is ${availableWater_liters.toLocaleString()} L (shortfall: ${waterShortfall_liters.toLocaleString()} L). ${topPlotText} Timing: ${timingWindow.recommendedWindow}.`;
    primaryActionHindi = `जल संकट चेतावनी! आवश्यकता ${totalFarmDemand_liters.toLocaleString()} लीटर है, पर भंडारण केवल ${availableWater_liters.toLocaleString()} लीटर है (${waterShortfall_liters.toLocaleString()} लीटर कमी)। ${topPlotHindi} उपयुक्त समय: ${timingWindow.recommendedWindow}।`;
    primaryActionBengali = `জলের ঘাটতি সতর্কবার্তা! প্রয়োজন ${totalFarmDemand_liters.toLocaleString()} লিটার, তবে মজুত আছে মাত্র ${availableWater_liters.toLocaleString()} লিটার (ঘাটতি: ${waterShortfall_liters.toLocaleString()} লিটার)। ${topPlotBengali} সময়: ${timingWindow.recommendedWindow}।`;
    actionWindow = `Critical stress deadline in ${nearestStress} hours`;
    confidence = 'HIGH';
    confidenceReason = 'Available tank/reserve volume is insufficient to meet full root-zone recharge.';
  } else if (plotsNeedingWater.length > 0) {
    decision = 'IRRIGATE_NOW';

    if (safePlots.length > 0) {
      // Differential advice: irrigate only plots needing water, explicitly skip safe plots
      const needTextEn = plotsNeedingWater.map(p => `"${p.cropName}" (${p.grossWaterNeeded_liters.toLocaleString()} L, ~${formatMins(p.pumpRuntime_minutes || 0)})`).join(' & ');
      const needTextHi = plotsNeedingWater.map(p => `"${p.cropName}" (${p.grossWaterNeeded_liters.toLocaleString()} लीटर, ~${formatMins(p.pumpRuntime_minutes || 0)})`).join(' और ');
      const needTextBn = plotsNeedingWater.map(p => `"${p.cropName}" (${p.grossWaterNeeded_liters.toLocaleString()} লিটার, ~${formatMins(p.pumpRuntime_minutes || 0)})`).join(' ও ');

      const safeNamesEn = safePlots.map(p => `"${p.cropName}"`).join(' & ');
      const safeNamesHi = safePlots.map(p => `"${p.cropName}"`).join(' और ');
      const safeNamesBn = safePlots.map(p => `"${p.cropName}"`).join(' ও ');

      primaryAction = `Irrigate only ${needTextEn} totaling ${activeFarmDemand_liters.toLocaleString()} L (~${formatMins(activePumpRuntime_minutes)} on ${pumpHpStr} pump). Skip ${safeNamesEn} today (moisture buffer is safe). Optimal window: ${timingWindow.recommendedWindow}.`;
      primaryActionHindi = `केवल ${needTextHi} में कुल ${activeFarmDemand_liters.toLocaleString()} लीटर पानी दें (${pumpHpStr} पंप से ~${formatMins(activePumpRuntime_minutes)})। ${safeNamesHi} में पर्याप्त नमी है—आज इनमें पानी न दें। उपयुक्त समय: ${timingWindow.recommendedWindow}।`;
      primaryActionBengali = `শুধুমাত্র ${needTextBn}-এ মোট ${activeFarmDemand_liters.toLocaleString()} লিটার সেচ দিন (${pumpHpStr} পাম্পে ~${formatMins(activePumpRuntime_minutes)})। ${safeNamesBn}-এ পর্যাপ্ত আর্দ্রতা রয়েছে—আজ এগুলিতে সেচ দেবেন না। উপযুক্ত সময়: ${timingWindow.recommendedWindow}।`;
    } else {
      primaryAction = `Apply ${totalFarmDemand_liters.toLocaleString()} L of irrigation across all plots (~${formatMins(totalPumpRuntime_minutes)} on ${pumpHpStr} pump). Optimal window: ${timingWindow.recommendedWindow}. ${timingWindow.advisoryText}`;
      primaryActionHindi = `सभी खेतों में कुल ${totalFarmDemand_liters.toLocaleString()} लीटर पानी दें (${pumpHpStr} पंप से लगभग ${formatMins(totalPumpRuntime_minutes)})। उपयुक्त समय: ${timingWindow.recommendedWindow}। ${timingWindow.advisoryText}`;
      primaryActionBengali = `সব জমিতে মোট ${totalFarmDemand_liters.toLocaleString()} লিটার সেচ দিন (${pumpHpStr} পাম্পে প্রায় ${formatMins(totalPumpRuntime_minutes)})। উপযুক্ত সময়: ${timingWindow.recommendedWindow}। ${timingWindow.advisoryText}`;
    }

    actionWindow = timingWindow.recommendedWindow;
    confidence = 'HIGH';
    confidenceReason = anyPlotCritical 
      ? 'Critical moisture threshold reached on active plots.'
      : 'Moderate depletion approaching stress threshold on active plots.';
  } else {
    decision = 'WAIT_AND_REASSESS';
    primaryAction = `Soil moisture is within safe levels across all plots. No pumping required today. Reassess in 48 hours.`;
    primaryActionHindi = `सभी खेतों में मिट्टी की नमी सुरक्षित स्तर पर है। आज पंप चलाने की आवश्यकता नहीं है। 48 घंटे बाद पुनः जांचें।`;
    primaryActionBengali = `সব জমিতে মাটির আর্দ্রতা নিরাপদ স্তরে রয়েছে। আজ পাম্প চালানোর প্রয়োজন নেই। ৪৮ ঘণ্টা পর পুনরায় পরীক্ষা করুন।`;
    actionWindow = 'Safe for the next 48 hours';
    confidence = 'HIGH';
    confidenceReason = 'All crop plots have adequate moisture buffer above critical stress.';
  }

  return {
    decision,
    primaryAction,
    actionWindow,
    confidence,
    confidenceReason,
    totalFarmDemand_liters,
    activeFarmDemand_liters,
    activePumpRuntime_minutes,
    netFarmDemand_liters,
    availableWater_liters,
    waterShortfall_liters,
    plots: plotResults,
    environmentalLedger,
    timingWindow,
    waterAllocation,
    advisoryText: {
      english: primaryAction,
      hindi: primaryActionHindi,
      bengali: primaryActionBengali,
    },
    metadata: {
      calculationTimestamp: new Date().toISOString(),
      engineVersion: 'FieldGuard-v1.0-FAO56',
      weatherDataTimestamp: forecast.timestamp,
      isDemoPreset,
    },
  };
}
