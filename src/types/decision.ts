import { EnvironmentalLedger } from './ledger';
import { IrrigationMethod } from './farm';

export type DecisionState = 
  | 'IRRIGATE_NOW' 
  | 'WAIT_AND_REASSESS' 
  | 'RESOURCE_DEFICIT_ALERT' 
  | 'INSUFFICIENT_DATA';

export interface PlotCalculationResult {
  plotId: string;
  cropName: string;
  taw_mm: number; // Total Available Water: AWC * Zr
  raw_mm: number; // Readily Available Water: p * TAW
  currentDepletion_mm: number; // Dr in mm
  dailyEtc_mm: number; // ETc = ET0 * Kc
  effectiveRain_mm: number; // min(Rain, Dr)
  runoffOrPercolation_mm: number;
  projectedDepletionTomorrow_mm: number;
  hoursToCriticalStress: number; // Hours until Dr reaches RAW
  waterNeeded_liters: number; // Net irrigation application volume in Litres
  grossWaterNeeded_liters: number; // Gross irrigation volume after method efficiency
  irrigationMethod: IrrigationMethod;
  irrigationEfficiency: number; // e.g. 0.90 for drip, 0.60 for flood
  urgencyLevel: 'low' | 'moderate' | 'critical';
}

export interface DecisionResponse {
  decision: DecisionState;
  primaryAction: string;
  actionWindow: string;
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  confidenceReason: string;
  totalFarmDemand_liters: number; // Gross total farm pumping demand
  netFarmDemand_liters: number; // Net crop uptake demand
  availableWater_liters: number;
  waterShortfall_liters: number;
  plots: PlotCalculationResult[];
  environmentalLedger: EnvironmentalLedger;
  advisoryText: {
    english: string;
    hindi?: string;
    bengali?: string;
  };
  metadata: {
    calculationTimestamp: string;
    engineVersion: string;
    weatherDataTimestamp: string;
    isDemoPreset: boolean;
  };
}
