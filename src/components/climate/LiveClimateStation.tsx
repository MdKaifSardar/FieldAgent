'use client';

import React, { useState } from 'react';
import { DailyWeatherForecast } from '../../types/weather';
import { useLanguage } from '../common/LanguageContext';
import { 
  CloudRain, 
  Sun, 
  Wind, 
  Droplets, 
  Thermometer, 
  RefreshCw, 
  Sliders, 
  Calendar,
  AlertTriangle,
  MapPin,
  Layers
} from 'lucide-react';
import { LocationMapPicker } from '../map/LocationMapPicker';

interface LiveClimateStationProps {
  forecast: DailyWeatherForecast;
  locationName: string;
  latitude?: number;
  longitude?: number;
  isSimulating: boolean;
  onToggleSimulation: (isSim: boolean) => void;
  onRefreshWeather: () => void;
  isRefreshing?: boolean;
  errorMessage?: string;
  showDevLevers?: boolean;
}

export function LiveClimateStation({
  forecast,
  locationName,
  latitude,
  longitude,
  isSimulating,
  onToggleSimulation,
  onRefreshWeather,
  isRefreshing = false,
  errorMessage,
  showDevLevers = false,
}: LiveClimateStationProps) {
  const { t } = useLanguage();
  const [showOutlook, setShowOutlook] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-[#E1E8DE] dark:border-[#1F2D24] bg-white dark:bg-[#141D17] shadow-sm relative overflow-hidden transition-all">
      {/* Header bar: Location + Live Badge + Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E1E8DE] dark:border-[#1F2D24]">
        <div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
              forecast.isLive 
                ? 'bg-[#16A34A]/10 text-[#16A34A] dark:text-[#4ADE80] border border-[#16A34A]/25' 
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${forecast.isLive ? 'bg-[#16A34A] animate-pulse' : 'bg-amber-500'}`} />
              {forecast.isLive ? t.liveWeather : t.offlineCache}
            </span>
            <span className="text-xs text-[#526356] dark:text-[#9BAEA0]">
              {forecast.source}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#121C15] dark:text-[#F0F4F1] mt-1 font-['Outfit'] truncate max-w-md flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80] shrink-0" />
            <span>{locationName}</span>
          </h2>
        </div>

        {/* Action Controls: Live vs Simulation Switch (Dev Only) + Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {latitude && longitude && (
            <button
              type="button"
              onClick={() => setShowMapPreview(!showMapPreview)}
              className={`min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showMapPreview
                  ? 'bg-[#16A34A]/15 border-[#16A34A]/40 text-[#16A34A] dark:text-[#4ADE80]'
                  : 'bg-[#F0F4ED] hover:bg-[#E4EBE0] dark:bg-[#1B2720] dark:hover:bg-[#23322A] border-[#E1E8DE] dark:border-[#2A3E31] text-[#121C15] dark:text-[#F0F4F1]'
              }`}
              title="Inspect Farm Location on Satellite Imagery"
            >
              <Layers className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
              <span>{showMapPreview ? t.hideMap : t.satelliteMap}</span>
            </button>
          )}

          {showDevLevers && (
            <button
              type="button"
              onClick={() => onToggleSimulation(!isSimulating)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isSimulating 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-300' 
                  : 'bg-[#F0F4ED] hover:bg-[#E4EBE0] dark:bg-[#1B2720] dark:hover:bg-[#23322A] border-[#E1E8DE] dark:border-[#2A3E31] text-[#121C15] dark:text-[#F0F4F1]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {isSimulating ? 'Simulation Mode Active' : 'What-If Levers'}
            </button>
          )}

          <button
            type="button"
            onClick={onRefreshWeather}
            disabled={isRefreshing}
            className="min-h-[36px] min-w-[36px] p-2 rounded-xl bg-[#F0F4ED] hover:bg-[#E4EBE0] dark:bg-[#1B2720] dark:hover:bg-[#23322A] border border-[#E1E8DE] dark:border-[#2A3E31] text-[#121C15] dark:text-[#F0F4F1] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
            title={t.syncNow}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0284C7]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expandable Live Satellite Map Preview of Active Farm */}
      {showMapPreview && latitude && longitude && (
        <div className="mt-4 pt-3 border-t border-[#E1E8DE] dark:border-[#1F2D24] fade-in">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-[#121C15] dark:text-[#F0F4F1] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
              <span>{t.satelliteMap} • {locationName}</span>
            </span>
            <span className="font-mono text-[11px] text-[#0284C7] dark:text-[#38BDF8]">
              {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
            </span>
          </div>
          <LocationMapPicker
            latitude={latitude}
            longitude={longitude}
            interactive={false}
            height="240px"
            locationName={locationName}
          />
        </div>
      )}

      {/* Error notification if live sync hit rate limit */}
      {errorMessage && (
        <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Live connection notice:</span> {errorMessage}
            <span className="block text-[#526356] dark:text-[#9BAEA0] mt-0.5">Operating safely on localized FAO-56 agro-climatic baseline.</span>
          </div>
        </div>
      )}

      {/* Primary Climate Metric Cards Grid (Mobile-First: 2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
        
        {/* Metric 1: Temperature */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#526356] dark:text-[#9BAEA0] uppercase tracking-wider">{t.temp}</div>
            <div className="text-lg sm:text-xl font-bold text-[#121C15] dark:text-[#F0F4F1] font-['Outfit']">
              {forecast.current_temp_c !== undefined ? forecast.current_temp_c : forecast.temp_max_c}°C
            </div>
            <div className="text-[10px] text-[#526356] dark:text-[#9BAEA0]">
              High {forecast.temp_max_c}° / Low {forecast.temp_min_c}°
            </div>
          </div>
        </div>

        {/* Metric 2: Rain Forecast & PoP% */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#0284C7]/10 text-[#0284C7] dark:text-[#38BDF8] shrink-0">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#526356] dark:text-[#9BAEA0] uppercase tracking-wider">{t.rainForecast}</div>
            <div className="text-lg sm:text-xl font-bold text-[#121C15] dark:text-[#F0F4F1] font-['Outfit'] flex items-baseline gap-1">
              {forecast.rainfall_mm} <span className="text-xs font-normal text-[#526356] dark:text-[#9BAEA0]">mm</span>
            </div>
            <div className={`text-[10px] font-semibold ${
              forecast.precipitation_probability_pct >= 60 ? 'text-[#16A34A] dark:text-[#4ADE80]' : 'text-[#526356] dark:text-[#9BAEA0]'
            }`}>
              {forecast.precipitation_probability_pct}% {t.popChance}
            </div>
          </div>
        </div>

        {/* Metric 3: Relative Humidity */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9] dark:text-[#38BDF8] shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#526356] dark:text-[#9BAEA0] uppercase tracking-wider">{t.humidity}</div>
            <div className="text-lg sm:text-xl font-bold text-[#121C15] dark:text-[#F0F4F1] font-['Outfit']">
              {forecast.current_humidity_pct !== undefined ? forecast.current_humidity_pct : forecast.relative_humidity_pct}%
            </div>
            <div className="text-[10px] text-[#526356] dark:text-[#9BAEA0] flex items-center gap-1">
              <Wind className="w-3 h-3" /> {forecast.current_wind_speed_kmh || 12} {t.windSpeed}
            </div>
          </div>
        </div>

        {/* Metric 4: FAO-56 Reference ET0 (Evaporation) */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#526356] dark:text-[#9BAEA0] uppercase tracking-wider">{t.et0}</div>
            <div className="text-lg sm:text-xl font-bold text-[#121C15] dark:text-[#F0F4F1] font-['Outfit'] flex items-baseline gap-1">
              {forecast.reference_et0_mm} <span className="text-xs font-normal text-[#526356] dark:text-[#9BAEA0]">mm/day</span>
            </div>
            <div className="text-[10px] text-[#16A34A] dark:text-[#4ADE80] font-medium">
              Penman-Monteith Solar
            </div>
          </div>
        </div>

      </div>

      {/* 7-Day Outlook Toggle */}
      {forecast.sevenDayOutlook && forecast.sevenDayOutlook.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#E1E8DE] dark:border-[#1F2D24]">
          <button
            type="button"
            onClick={() => setShowOutlook(!showOutlook)}
            className="text-xs font-semibold text-[#526356] dark:text-[#9BAEA0] hover:text-[#16A34A] dark:hover:text-[#4ADE80] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.outlook7Day}</span>
          </button>

          {showOutlook && (
            <div className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-center">
              {forecast.sevenDayOutlook.map((day, i) => {
                const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                const isRainy = day.rainfall_mm >= 5;
                return (
                  <div 
                    key={day.date} 
                    className={`p-2 rounded-xl border text-xs min-w-[48px] ${
                      i === 0 
                        ? 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#16A34A] dark:text-[#4ADE80]' 
                        : isRainy
                        ? 'bg-[#0284C7]/10 border-[#0284C7]/30 text-[#0284C7] dark:text-[#38BDF8]'
                        : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#121C15] dark:text-[#F0F4F1]'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase">{i === 0 ? t.today : dayName}</div>
                    <div className="text-xs font-bold mt-1 text-[#121C15] dark:text-[#F0F4F1]">{day.temp_max_c}°</div>
                    <div className="text-[10px] text-[#0284C7] dark:text-[#38BDF8] font-semibold mt-0.5">{day.rainfall_mm}mm</div>
                    <div className="text-[9px] text-[#526356] dark:text-[#9BAEA0]">{day.precipitation_probability_pct}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
