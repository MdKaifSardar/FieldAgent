export interface EnvironmentalLedger {
  deferredIrrigationDepth_mm: number;
  deferredVolume_liters: number;
  pumpingHoursSaved: number;
  electricitySaved_kwh: number;
  carbonOffset_kg_co2: number;
  estimatedCostSaved_inr?: number; // Optional: calculated only when tariff or fuel price is available
  dieselSaved_liters?: number;
  energyMode?: 'subsidized_grid' | 'metered_grid' | 'diesel';
  transparencyNote: string;
}
