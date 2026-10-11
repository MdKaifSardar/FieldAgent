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
    <div className="glass-panel p-4 sm:p-5 border border-[#E1E5DC] dark:border-[#1E2F24] shadow-sm relative overflow-hidden transition-all">
      {/* Header bar: Location + Live Badge + Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E1E5DC] dark:border-[#1E2F24]">
        <div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
              forecast.isLive 
                ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#52B788] border border-[#2D6A4F]/25' 
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${forecast.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {forecast.isLive ? t.liveWeather : t.offlineCache}
            </span>
            <span className="text-xs text-[#5A6B60] dark:text-[#8E9F93]">
              {forecast.source}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#111C15] dark:text-[#ECF2EC] mt-1 font-['Outfit'] truncate max-w-md flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788] shrink-0" />
            <span>{locationName}</span>
          </h2>
        </div>

        {/* Action Controls: Live vs Simulation Switch (Dev Only) + Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {latitude && longitude && (
            <button
              type="button"
              onClick={() => setShowMapPreview(!showMapPreview)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showMapPreview
                  ? 'bg-[#2D6A4F]/15 border-[#2D6A4F]/40 text-[#2D6A4F] dark:text-[#52B788]'
                  : 'bg-stone-100 dark:bg-[#121D16] border-[#E1E5DC] dark:border-[#1E2F24] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isSimulating 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-300' 
                  : 'bg-stone-100 dark:bg-[#121D16] border-[#E1E5DC] dark:border-[#1E2F24] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
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
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-[#121D16] dark:hover:bg-[#1E2F24] border border-[#E1E5DC] dark:border-[#1E2F24] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title={t.syncNow}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0284C7]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expandable Live Satellite Map Preview of Active Farm */}
      {showMapPreview && latitude && longitude && (
        <div className="mt-4 pt-3 border-t border-[#E1E5DC] dark:border-[#1E2F24] fade-in">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
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
            <span className="block text-[#5A6B60] dark:text-[#8E9F93] mt-0.5">Operating safely on localized FAO-56 agro-climatic baseline.</span>
          </div>
        </div>
      )}

      {/* Primary Climate Metric Cards Grid (Mobile-First: 2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
        
        {/* Metric 1: Temperature */}
        <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#121D16] border border-[#E1E5DC] dark:border-[#1E2F24] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#5A6B60] dark:text-[#8E9F93] uppercase tracking-wider">{t.temp}</div>
            <div className="text-lg sm:text-xl font-bold text-[#111C15] dark:text-[#ECF2EC] font-['Outfit']">
              {forecast.current_temp_c !== undefined ? forecast.current_temp_c : forecast.temp_max_c}°C
            </div>
            <div className="text-[10px] text-[#5A6B60] dark:text-[#8E9F93]">
              High {forecast.temp_max_c}° / Low {forecast.temp_min_c}°
            </div>
          </div>
        </div>

        {/* Metric 2: Rain Forecast & PoP% */}
        <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#121D16] border border-[#E1E5DC] dark:border-[#1E2F24] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#5A6B60] dark:text-[#8E9F93] uppercase tracking-wider">{t.rainForecast}</div>
            <div className="text-lg sm:text-xl font-bold text-[#111C15] dark:text-[#ECF2EC] font-['Outfit'] flex items-baseline gap-1">
              {forecast.rainfall_mm} <span className="text-xs font-normal text-[#5A6B60] dark:text-[#8E9F93]">mm</span>
            </div>
            <div className={`text-[10px] font-semibold ${
              forecast.precipitation_probability_pct >= 60 ? 'text-[#2D6A4F] dark:text-[#52B788]' : 'text-[#5A6B60] dark:text-[#8E9F93]'
            }`}>
              {forecast.precipitation_probability_pct}% {t.popChance}
            </div>
          </div>
        </div>

        {/* Metric 3: Relative Humidity */}
        <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#121D16] border border-[#E1E5DC] dark:border-[#1E2F24] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#5A6B60] dark:text-[#8E9F93] uppercase tracking-wider">{t.humidity}</div>
            <div className="text-lg sm:text-xl font-bold text-[#111C15] dark:text-[#ECF2EC] font-['Outfit']">
              {forecast.current_humidity_pct !== undefined ? forecast.current_humidity_pct : forecast.relative_humidity_pct}%
            </div>
            <div className="text-[10px] text-[#5A6B60] dark:text-[#8E9F93] flex items-center gap-1">
              <Wind className="w-3 h-3" /> {forecast.current_wind_speed_kmh || 12} {t.windSpeed}
            </div>
          </div>
        </div>

        {/* Metric 4: FAO-56 Reference ET0 (Evaporation) */}
        <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#121D16] border border-[#E1E5DC] dark:border-[#1E2F24] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#52B788] shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#5A6B60] dark:text-[#8E9F93] uppercase tracking-wider">{t.et0}</div>
            <div className="text-lg sm:text-xl font-bold text-[#111C15] dark:text-[#ECF2EC] font-['Outfit'] flex items-baseline gap-1">
              {forecast.reference_et0_mm} <span className="text-xs font-normal text-[#5A6B60] dark:text-[#8E9F93]">mm/day</span>
            </div>
            <div className="text-[10px] text-[#2D6A4F] dark:text-[#52B788] font-medium">
              Penman-Monteith Solar
            </div>
          </div>
        </div>

      </div>

      {/* 7-Day Outlook Toggle */}
      {forecast.sevenDayOutlook && forecast.sevenDayOutlook.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#E1E5DC] dark:border-[#1E2F24]">
          <button
            type="button"
            onClick={() => setShowOutlook(!showOutlook)}
            className="text-xs font-semibold text-[#5A6B60] dark:text-[#8E9F93] hover:text-[#2D6A4F] dark:hover:text-[#52B788] transition-colors flex items-center gap-1.5 cursor-pointer"
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
                    className={`p-2 rounded-lg border text-xs min-w-[48px] ${
                      i === 0 
                        ? 'bg-[#2D6A4F]/15 border-[#2D6A4F]/30 text-[#2D6A4F] dark:text-[#52B788]' 
                        : isRainy
                        ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300'
                        : 'bg-stone-50 dark:bg-[#121D16] border-[#E1E5DC] dark:border-[#1E2F24] text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase">{i === 0 ? t.today : dayName}</div>
                    <div className="text-xs font-bold mt-1 text-[#111C15] dark:text-[#ECF2EC]">{day.temp_max_c}°</div>
                    <div className="text-[10px] text-[#0284C7] dark:text-[#38BDF8] font-semibold mt-0.5">{day.rainfall_mm}mm</div>
                    <div className="text-[9px] text-[#5A6B60] dark:text-[#8E9F93]">{day.precipitation_probability_pct}%</div>
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
