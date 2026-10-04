export type AreaUnit = 'acre' | 'bigha' | 'guntha' | 'cent' | 'hectare' | 'sq_meters';

export type SoilTexture = 'sandy' | 'loamy' | 'clay_black' | 'unknown';

export type IrrigationMethod = 'drip' | 'sprinkler' | 'surface_flood';

/**
 * Field application efficiencies benchmarked from FAO & ICAR standards:
 * - Drip Irrigation: ~90% efficiency (minimal evaporative and runoff losses)
 * - Sprinkler Irrigation: ~75% efficiency (wind drift & canopy evaporation)
 * - Surface / Flood / Furrow: ~60% efficiency (percolation beyond root zone & distribution losses)
 */
export const IRRIGATION_EFFICIENCIES: Record<IrrigationMethod, number> = {
  drip: 0.90,
  sprinkler: 0.75,
  surface_flood: 0.60,
};

export interface SoilProperties {
  texture: SoilTexture;
  awc_mm_per_m: number; // Available Water Capacity (mm of water per metre of soil)
  infiltration_rate_mm_hr: number;
}

export interface CropBlock {
  id: string;
  cropName: string; // e.g. "Tomato", "Wheat", "Paddy", "Potato", "Spinach", "Mustard"
  variety?: string;
  growthStage: 'initial' | 'development' | 'mid_season' | 'late_season';
  areaValue: number;
  areaUnit: AreaUnit;
  area_sq_meters: number; // Normalized area in m²
  rootDepth_m: number; // Zr in metres (e.g. 0.6 m)
  cropCoefficient_Kc: number; // Kc from FAO-56 table (e.g. 1.05)
  depletionFraction_p: number; // Stress threshold p (e.g. 0.45)
  currentDepletion_mm: number; // Current soil water deficit Dr in mm
  irrigationMethod: IrrigationMethod;
  lastIrrigationDate?: string;
}

export type StorageTier = 'sintex_tank' | 'custom_sump' | 'borewell_hours';

export interface CustomSumpDimensions {
  length_m: number;
  width_m: number;
  waterDepth_m: number;
}

export interface WaterReserve {
  storageType: StorageTier;
  totalCapacity_liters: number;
  currentAvailable_liters: number;
  sumpDimensions?: CustomSumpDimensions;
  tubewellFlowRate_lph?: number;
  tubewellAvailableHours?: number;
  nextReplenishmentDate?: string;
  replenishmentAmount_liters?: number;
  pumpPower_hp?: number;
  knownFlowRate_liters_per_hr?: number;
}

export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  villageOrPincode: string;
  district?: string;
  state?: string;
  displayName?: string;
}

export interface FarmProfile {
  id: string;
  userId: string;
  farmName: string;
  location: GeocodedLocation;
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

/**
 * Helper to compute geometric volume for sumps/ponds:
 * Volume (L) = Length (m) * Width (m) * Depth (m) * 1,000
 */
export function calculateSumpVolumeLiters(length_m: number, width_m: number, depth_m: number): number {
  return Math.round(length_m * width_m * depth_m * 1000);
}
