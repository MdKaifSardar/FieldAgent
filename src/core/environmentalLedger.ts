import { EnvironmentalLedger } from '../types/ledger';

export interface LedgerInput {
  deferredDepth_mm: number;
  fieldArea_m2: number;
  pumpPower_hp?: number;
  knownFlowRate_l_hr?: number;
}

export function calculateEnvironmentalLedger(input: LedgerInput): EnvironmentalLedger {
  const { 
    deferredDepth_mm, 
    fieldArea_m2, 
    pumpPower_hp = 5.0, 
    knownFlowRate_l_hr 
  } = input;

  if (deferredDepth_mm <= 0 || fieldArea_m2 <= 0) {
    return {
      deferredIrrigationDepth_mm: 0,
      deferredVolume_liters: 0,
      pumpingHoursSaved: 0,
      electricitySaved_kwh: 0,
      carbonOffset_kg_co2: 0,
      estimatedCostSaved_inr: 0,
      transparencyNote: 'No irrigation was deferred in this scenario.',
    };
  }

  // 1 mm over 1 m² = 1 Litre
  const deferredVolume_liters = Math.round(deferredDepth_mm * fieldArea_m2);

  // Pump flow rate estimation:
  // If user provides a known flow rate, use it. Otherwise assume standard 5 HP pump ~ 6,000 L/hr.
  const flowRate_l_hr = knownFlowRate_l_hr && knownFlowRate_l_hr > 0
    ? knownFlowRate_l_hr
    : (pumpPower_hp * 1200); // e.g. 5 HP * 1,200 L/hr = 6,000 L/hr at typical 30m head

  const pumpingHoursSaved = Math.round((deferredVolume_liters / flowRate_l_hr) * 10) / 10;

  // 1 HP = 0.746 kW. Average pump efficiency ~ 75% -> Electrical draw = HP * 0.746 / 0.75 ≈ HP * 1.0 kW
  const electricalPower_kw = pumpPower_hp * 0.746 / 0.75;
  const electricitySaved_kwh = Math.round(pumpingHoursSaved * electricalPower_kw * 10) / 10;

  // Indian grid average emission factor: ~0.82 kg CO2 per kWh (Central Electricity Authority)
  const carbonOffset_kg_co2 = Math.round(electricitySaved_kwh * 0.82 * 10) / 10;

  // Average agricultural power tariff / diesel equivalent in India: ~₹6.50 per kWh or fuel equivalent
  const estimatedCostSaved_inr = Math.round(electricitySaved_kwh * 6.50);

  return {
    deferredIrrigationDepth_mm: Math.round(deferredDepth_mm * 100) / 100,
    deferredVolume_liters,
    pumpingHoursSaved,
    electricitySaved_kwh,
    carbonOffset_kg_co2,
    estimatedCostSaved_inr,
    transparencyNote: `Estimated irrigation deferred based on an avoided ${deferredDepth_mm.toFixed(1)} mm application over ${fieldArea_m2.toLocaleString()} m² area using standard regional pump benchmarks.`,
  };
}
