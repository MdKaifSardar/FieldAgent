export interface EnvironmentalLedger {
  deferredIrrigationDepth_mm: number;
  deferredVolume_liters: number;
  pumpingHoursSaved: number;
  electricitySaved_kwh: number;
  carbonOffset_kg_co2: number;
  estimatedCostSaved_inr: number;
  transparencyNote: string;
}
