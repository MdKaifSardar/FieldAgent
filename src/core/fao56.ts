/**
 * FAO-56 Penman-Monteith & Soil Water Balance Core Engine
 * Reference: FAO Irrigation and Drainage Paper No. 56 (Allen et al., 1998)
 */

export interface DailySoilBalanceStep {
  nextDepletion_mm: number;
  effectiveRain_mm: number;
  excessRain_mm: number; // Surface runoff or deep percolation
  etc_mm: number;
  isStressed: boolean;
}

/**
 * Calculates Crop Evapotranspiration: ETc = ET0 * Kc
 */
export function calculateEtc(et0_mm: number, kc: number): number {
  if (et0_mm < 0 || kc < 0) {
    throw new Error('ET0 and Kc must be non-negative numbers');
  }
  return Math.round(et0_mm * kc * 100) / 100;
}

/**
 * Calculates Total Available Water across the active root zone:
 * TAW (mm) = AWC (mm/m) * Root Depth Zr (m)
 */
export function calculateTaw(awc_mm_per_m: number, rootDepth_m: number): number {
  if (awc_mm_per_m <= 0 || rootDepth_m <= 0) {
    throw new Error('AWC and Root Depth must be positive numbers');
  }
  return Math.round(awc_mm_per_m * rootDepth_m * 10) / 10;
}

/**
 * Calculates Readily Available Water (irrigation trigger threshold):
 * RAW (mm) = p * TAW
 */
export function calculateRaw(depletionFraction_p: number, taw_mm: number): number {
  const p = Math.max(0.1, Math.min(0.8, depletionFraction_p));
  return Math.round(p * taw_mm * 10) / 10;
}

/**
 * Daily Infiltration & Effective Rain:
 * In a daily soil-water balance, rain infiltrates only up to the available root-zone deficit Dr.
 * Any rainfall in excess of the current moisture deficit cannot be stored and becomes
 * runoff or deep percolation.
 */
export function calculateDailyEffectiveRain(
  dailyRain_mm: number,
  currentDepletion_mm: number
): { effectiveRain_mm: number; excess_mm: number } {
  const rain = Math.max(0, dailyRain_mm);
  const deficit = Math.max(0, currentDepletion_mm);

  if (rain <= deficit) {
    return {
      effectiveRain_mm: Math.round(rain * 100) / 100,
      excess_mm: 0,
    };
  }

  return {
    effectiveRain_mm: Math.round(deficit * 100) / 100,
    excess_mm: Math.round((rain - deficit) * 100) / 100,
  };
}

/**
 * Step forward the root-zone soil water balance for one daily step:
 * Dr(today) = Dr(yesterday) - (Effective_Rain + Irrigation) + ETc
 * Clamped between 0 (field capacity) and TAW (wilting point).
 */
export function updateDailySoilWaterBalance(
  currentDepletion_mm: number,
  dailyRain_mm: number,
  irrigation_mm: number,
  etc_mm: number,
  taw_mm: number,
  raw_mm: number
): DailySoilBalanceStep {
  const { effectiveRain_mm, excess_mm } = calculateDailyEffectiveRain(dailyRain_mm, currentDepletion_mm);
  const totalWaterInflow = effectiveRain_mm + Math.max(0, irrigation_mm);

  // New unconstrained depletion
  let nextDr = currentDepletion_mm - totalWaterInflow + etc_mm;

  // Physical clamping: cannot hold more water than field capacity (Dr < 0)
  // or exceed wilting capacity (Dr > TAW)
  if (nextDr < 0) {
    nextDr = 0;
  } else if (nextDr > taw_mm) {
    nextDr = taw_mm;
  }

  nextDr = Math.round(nextDr * 100) / 100;

  return {
    nextDepletion_mm: nextDr,
    effectiveRain_mm,
    excessRain_mm: excess_mm,
    etc_mm,
    isStressed: nextDr >= raw_mm,
  };
}

/**
 * Calculate hours remaining until the crop hits the critical moisture stress line (RAW):
 */
export function calculateHoursToStress(
  currentDepletion_mm: number,
  raw_mm: number,
  dailyEtc_mm: number
): number {
  if (currentDepletion_mm >= raw_mm) {
    return 0; // Already stressed
  }

  if (dailyEtc_mm <= 0) {
    return 999;
  }

  const remainingBuffer_mm = raw_mm - currentDepletion_mm;
  const hourlyEtc = dailyEtc_mm / 24.0;
  const hours = remainingBuffer_mm / hourlyEtc;

  return Math.round(hours * 10) / 10;
}
