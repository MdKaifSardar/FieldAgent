'use client';

import React, { useState } from 'react';
import { FarmProfile, AreaUnit, SoilTexture, normalizeAreaToSqMeters } from '../types/farm';
import { X, MapPin, Sprout, Database, Check } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (farm: FarmProfile) => void;
}

export function OnboardingModal({ isOpen, onClose, onSubmit }: OnboardingModalProps) {
  if (!isOpen) return null;

  const [farmName, setFarmName] = useState('My Farm Parcel');
  const [pincodeOrVillage, setPincodeOrVillage] = useState('713101');
  const [lat, setLat] = useState(23.2324);
  const [lon, setLon] = useState(87.8615);
  const [isLocating, setIsLocating] = useState(false);

  // Crop & Land
  const [cropName, setCropName] = useState('Tomato');
  const [growthStage, setGrowthStage] = useState<'initial' | 'development' | 'mid_season' | 'late_season'>('mid_season');
  const [areaValue, setAreaValue] = useState(1.5);
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('bigha');

  // Soil
  const [soilTexture, setSoilTexture] = useState<SoilTexture>('loamy');

  // Water Reserve
  const [tankCapacity, setTankCapacity] = useState(5000);
  const [fillPercent, setFillPercent] = useState(70);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
        setPincodeOrVillage(`GPS: ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`);
        setIsLocating(false);
      },
      (err) => {
        alert('Could not detect location: ' + err.message);
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const awc_mm_per_m = soilTexture === 'sandy' ? 90 : soilTexture === 'clay_black' ? 180 : 150;
    const area_sq_meters = normalizeAreaToSqMeters(areaValue, areaUnit);

    // Param mappings
    const rootDepth_m = cropName === 'Spinach' ? 0.25 : cropName === 'Wheat' ? 0.6 : 0.6;
    const cropCoefficient_Kc = growthStage === 'mid_season' ? 1.05 : 0.75;
    const depletionFraction_p = cropName === 'Spinach' ? 0.35 : 0.45;

    const available_liters = Math.round((tankCapacity * fillPercent) / 100);

    const newFarm: FarmProfile = {
      id: 'custom-farm-' + Date.now(),
      userId: 'farmer-user',
      farmName,
      location: {
        latitude: lat,
        longitude: lon,
        villageOrPincode: pincodeOrVillage,
      },
      soil: {
        texture: soilTexture,
        awc_mm_per_m,
        infiltration_rate_mm_hr: 12,
      },
      reserve: {
        storageType: 'sintex_tank',
        totalCapacity_liters: tankCapacity,
        currentAvailable_liters: available_liters,
        pumpPower_hp: 5.0,
      },
      plots: [
        {
          id: 'plot-1',
          cropName,
          growthStage,
          areaValue,
          areaUnit,
          area_sq_meters,
          rootDepth_m,
          cropCoefficient_Kc,
          depletionFraction_p,
          currentDepletion_mm: 32.0, // Initial estimate
          irrigationMethod: 'drip',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSubmit(newFarm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
      <div className="glass-panel w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-700 p-6 shadow-2xl">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              60-Second Setup
            </span>
            <h3 className="text-xl font-bold text-white font-['Outfit']">
              Configure Your Farm Profile
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          
          {/* 1. Location */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" /> 1. Field Location (For Weather Feed)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pincodeOrVillage}
                onChange={(e) => setPincodeOrVillage(e.target.value)}
                placeholder="Pincode or Village (e.g. 713101)"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleDetectGPS}
                className="px-3 py-2 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                {isLocating ? 'Detecting...' : '📍 GPS Detect'}
              </button>
            </div>
          </div>

          {/* 2. Crop & Land Area */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-emerald-400" /> 2. Crop & Land Area
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Crop Type</span>
                <select
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Tomato">Tomato (Flowering/Fruiting)</option>
                  <option value="Wheat">Wheat (Rabi Grain)</option>
                  <option value="Paddy">Paddy / Rice (Kharif)</option>
                  <option value="Spinach">Spinach / Leafy Greens</option>
                  <option value="Mustard">Mustard</option>
                  <option value="Chilli">Chilli / Pepper</option>
                </select>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Growth Stage</span>
                <select
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="initial">Initial / Germination</option>
                  <option value="development">Vegetative Growth</option>
                  <option value="mid_season">Mid-Season (Flowering)</option>
                  <option value="late_season">Late Season (Maturity)</option>
                </select>
              </div>
            </div>

            {/* Area & Local Units */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Plot Size</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={areaValue}
                  onChange={(e) => setAreaValue(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Unit</span>
                <select
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="bigha">Bigha (Eastern / Central India)</option>
                  <option value="acre">Acre (Pan-India)</option>
                  <option value="guntha">Guntha (MH / KA)</option>
                  <option value="cent">Cent / Ground (South India)</option>
                  <option value="hectare">Hectare</option>
                </select>
              </div>
            </div>
            <p className="text-[11px] text-emerald-400/80">
              Normalized Area: {normalizeAreaToSqMeters(areaValue, areaUnit).toLocaleString()} m²
            </p>
          </div>

          {/* 3. Soil Texture Confirmation */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              3. Soil Texture (Zero Jargon)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSoilTexture('loamy')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  soilTexture === 'loamy'
                    ? 'bg-emerald-500/20 border-emerald-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-xs mb-0.5">🟫 Loamy</div>
                <div className="text-[10px] text-slate-400">Dark brown, holds water well</div>
              </button>

              <button
                type="button"
                onClick={() => setSoilTexture('clay_black')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  soilTexture === 'clay_black'
                    ? 'bg-emerald-500/20 border-emerald-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-xs mb-0.5">⚫ Black / Clay</div>
                <div className="text-[10px] text-slate-400">Sticky, cracks when dry</div>
              </button>

              <button
                type="button"
                onClick={() => setSoilTexture('sandy')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  soilTexture === 'sandy'
                    ? 'bg-emerald-500/20 border-emerald-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-xs mb-0.5">🟤 Sandy</div>
                <div className="text-[10px] text-slate-400">Gritty, drains fast</div>
              </button>
            </div>
          </div>

          {/* 4. Tank Water Reserve */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-400" /> 4. Usable Water Storage
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Tank Capacity (Litres)</span>
                <input
                  type="number"
                  step="500"
                  value={tankCapacity}
                  onChange={(e) => setTankCapacity(parseInt(e.target.value) || 1000)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Fill Level: {fillPercent}%</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={fillPercent}
                  onChange={(e) => setFillPercent(parseInt(e.target.value) || 50)}
                  className="w-full mt-2 accent-amber-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-amber-400/80">
              Current Available Water: {Math.round((tankCapacity * fillPercent) / 100).toLocaleString()} Litres
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Run Irrigation Decision Engine
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
