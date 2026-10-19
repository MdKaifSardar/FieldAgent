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
    <div className="h-full flex flex-col justify-between p-4 sm:p-5 rounded-xl border border-[#E1E8DE] dark:border-[#16364D] bg-white dark:bg-[#0D2232] shadow-xs relative overflow-hidden transition-all">
      {/* Top Section */}
      <div>
        {/* Header bar: Location + Live Badge + Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-[#E1E8DE] dark:border-[#16364D]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                forecast.isLive 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25' 
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${forecast.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {forecast.isLive ? t.liveWeather : t.offlineCache}
              </span>
              <span className="text-xs text-slate-500 dark:text-[#94A3B8] truncate">
                {forecast.source}
              </span>
            </div>
            <h2 
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F0F9FF] mt-1 font-['Outfit'] truncate flex items-center gap-1.5"
              title={locationName}
            >
              <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
              <span className="truncate">{locationName}</span>
            </h2>
          </div>

          {/* Action Controls: Satellite map + simulation switch + refresh */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            {latitude && longitude && (
              <button
                type="button"
                onClick={() => setShowMapPreview(!showMapPreview)}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  showMapPreview
                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-[#38BDF8]'
                    : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-[#112B3E] dark:hover:bg-[#16364D] border-slate-200 dark:border-[#16364D] text-slate-700 dark:text-[#F0F9FF]'
                }`}
                title="Inspect Farm Location on Satellite Imagery"
              >
                <Layers className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="hidden sm:inline text-[11px]">{showMapPreview ? t.hideMap : t.satelliteMap}</span>
              </button>
            )}

            {showDevLevers && (
              <button
                type="button"
                onClick={() => onToggleSimulation(!isSimulating)}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  isSimulating 
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-300' 
                    : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-[#112B3E] dark:hover:bg-[#16364D] border-slate-200 dark:border-[#16364D] text-slate-700 dark:text-[#F0F9FF]'
                }`}
                title="What-If Levers"
              >
                <Sliders className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline text-[11px]">{isSimulating ? 'Sim Active' : 'What-If'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRefreshWeather}
              disabled={isRefreshing}
              className="min-h-[32px] min-w-[32px] p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-[#112B3E] dark:hover:bg-[#16364D] border border-slate-200 dark:border-[#16364D] text-slate-700 dark:text-[#F0F9FF] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0"
              title={t.syncNow}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expandable Live Satellite Map Preview of Active Farm */}
        {showMapPreview && latitude && longitude && (
          <div className="mt-4 pt-3 border-t border-[#E1E8DE] dark:border-[#16364D] fade-in">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-800 dark:text-[#F0F9FF] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-500" />
                <span>{t.satelliteMap} • {locationName}</span>
              </span>
              <span className="font-mono text-[11px] text-sky-600 dark:text-[#38BDF8]">
                {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
              </span>
            </div>
            <LocationMapPicker
              latitude={latitude}
              longitude={longitude}
              interactive={false}
              height="220px"
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
              <span className="block text-slate-400 mt-0.5">Operating safely on localized FAO-56 agro-climatic baseline.</span>
            </div>
          </div>
        )}

        {/* Primary Climate Metric Cards Grid (2x2 grid) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-3.5">
          {/* Metric 1: Temperature */}
          <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50/80 dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Thermometer className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider truncate">{t.temp}</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
                {forecast.current_temp_c !== undefined ? forecast.current_temp_c : forecast.temp_max_c}°C
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                High {forecast.temp_max_c}° / Low {forecast.temp_min_c}°
              </div>
            </div>
          </div>

          {/* Metric 2: Rain Forecast & PoP% */}
          <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50/80 dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-[#38BDF8] shrink-0">
              <CloudRain className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider truncate">{t.rainForecast}</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] flex items-baseline gap-1">
                {forecast.rainfall_mm} <span className="text-xs font-normal text-slate-400">mm</span>
              </div>
              <div className={`text-[10px] font-semibold truncate ${
                forecast.precipitation_probability_pct >= 60 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
              }`}>
                {forecast.precipitation_probability_pct}% {t.popChance}
              </div>
            </div>
          </div>

          {/* Metric 3: Relative Humidity */}
          <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50/80 dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
              <Droplets className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider truncate">{t.humidity}</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit']">
                {forecast.current_humidity_pct !== undefined ? forecast.current_humidity_pct : forecast.relative_humidity_pct}%
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                <Wind className="w-3 h-3 shrink-0" /> {forecast.current_wind_speed_kmh || 12} {t.windSpeed}
              </div>
            </div>
          </div>

          {/* Metric 4: FAO-56 Reference ET0 */}
          <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50/80 dark:bg-[#0A1C2A] border border-[#E1E8DE] dark:border-[#16364D] flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider truncate">{t.et0}</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F0F9FF] font-['Outfit'] flex items-baseline gap-1">
                {forecast.reference_et0_mm} <span className="text-xs font-normal text-slate-400">mm/d</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                Penman-Monteith Solar
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Outlook Toggle */}
      {forecast.sevenDayOutlook && forecast.sevenDayOutlook.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#E1E8DE] dark:border-[#16364D]">
          <button
            type="button"
            onClick={() => setShowOutlook(!showOutlook)}
            className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8] hover:text-sky-600 dark:hover:text-[#38BDF8] transition-colors flex items-center gap-1.5 cursor-pointer"
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
                        ? 'bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-[#38BDF8]' 
                        : isRainy
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-300'
                        : 'bg-slate-50 dark:bg-[#0A1C2A] border-[#E1E8DE] dark:border-[#16364D] text-slate-800 dark:text-[#F0F9FF]'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase">{i === 0 ? t.today : dayName}</div>
                    <div className="text-xs font-bold mt-1 text-slate-900 dark:text-[#F0F9FF]">{day.temp_max_c}°</div>
                    <div className="text-[10px] text-sky-600 dark:text-[#38BDF8] font-semibold mt-0.5">{day.rainfall_mm}mm</div>
                    <div className="text-[9px] text-slate-400">{day.precipitation_probability_pct}%</div>
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
