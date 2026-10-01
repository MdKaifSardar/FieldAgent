export type AreaUnit = 'acre' | 'bigha' | 'guntha' | 'cent' | 'hectare' | 'sq_meters';

export type SoilTexture = 'sandy' | 'loamy' | 'clay_black' | 'unknown';

export interface SoilProperties {
  texture: SoilTexture;
  awc_mm_per_m: number; // Available Water Capacity (mm of water per metre of soil)
  infiltration_rate_mm_hr: number;
}

export interface CropBlock {
  id: string;
  cropName: string; // e.g. "Tomato", "Wheat", "Paddy", "Spinach"
  variety?: string;
  growthStage: 'initial' | 'development' | 'mid_season' | 'late_season';
  areaValue: number;
  areaUnit: AreaUnit;
  area_sq_meters: number; // Normalized area in m²
  rootDepth_m: number; // Zr in metres (e.g. 0.6 m)
  cropCoefficient_Kc: number; // Kc from FAO-56 table (e.g. 1.05)
  depletionFraction_p: number; // Stress threshold p (e.g. 0.45)
  currentDepletion_mm: number; // Current soil water deficit Dr in mm
  lastIrrigationDate?: string;
}

export interface WaterReserve {
  storageType: 'sintex_tank' | 'custom_sump' | 'borewell_hours';
  totalCapacity_liters: number;
  currentAvailable_liters: number;
  nextReplenishmentDate?: string;
  replenishmentAmount_liters?: number;
  pumpPower_hp?: number;
  knownFlowRate_liters_per_hr?: number; // Optional user-entered flow rate
}

export interface FarmProfile {
  id: string;
  userId: string;
  farmName: string;
  location: {
    latitude: number;
    longitude: number;
    villageOrPincode: string;
  };
  soil: SoilProperties;
  reserve: WaterReserve;
  plots: CropBlock[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Standard unit conversions to square meters (m²)
 */
export const AREA_CONVERSIONS_TO_SQ_METERS: Record<AreaUnit, number> = {
  acre: 4046.86,
  bigha: 1338.0, // Standard Eastern Indian Bigha (~1,338 m²)
  guntha: 101.17, // Standard Maharashtra/Karnataka Guntha
  cent: 40.47, // Standard South Indian Cent
  hectare: 10000.0,
  sq_meters: 1.0,
};

export function normalizeAreaToSqMeters(value: number, unit: AreaUnit): number {
  const factor = AREA_CONVERSIONS_TO_SQ_METERS[unit] || 1.0;
  return Math.round(value * factor * 100) / 100;
}
