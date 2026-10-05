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
  AlertTriangle
} from 'lucide-react';

interface LiveClimateStationProps {
  forecast: DailyWeatherForecast;
  locationName: string;
  isSimulating: boolean;
  onToggleSimulation: (isSim: boolean) => void;
  onRefreshWeather: () => void;
  isRefreshing?: boolean;
  errorMessage?: string;
}

export function LiveClimateStation({
  forecast,
  locationName,
  isSimulating,
  onToggleSimulation,
  onRefreshWeather,
  isRefreshing = false,
  errorMessage,
}: LiveClimateStationProps) {
  const { t } = useLanguage();
  const [showOutlook, setShowOutlook] = useState(false);

  return (
    <div className="glass-panel p-4 sm:p-5 border border-slate-700/80 shadow-xl relative overflow-hidden transition-all">
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar: Location + Live Badge + Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
              forecast.isLive 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${forecast.isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {forecast.isLive ? 'Live Weather Feed' : 'Cached Baseline'}
            </span>
            <span className="text-xs text-slate-400">
              {forecast.source}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mt-1 font-['Outfit'] truncate max-w-md">
            📍 {locationName}
          </h2>
        </div>

        {/* Action Controls: Live vs Simulation Switch + Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onToggleSimulation(!isSimulating)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isSimulating 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {isSimulating ? 'Simulation Mode Active' : 'What-If Levers'}
          </button>

          <button
            type="button"
            onClick={onRefreshWeather}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title={t.syncNow}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error notification if live sync hit rate limit */}
      {errorMessage && (
        <div className="mt-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Live connection notice:</span> {errorMessage}
            <span className="block text-slate-400 mt-0.5">Operating safely on localized FAO-56 agro-climatic baseline.</span>
          </div>
        </div>
      )}

      {/* Primary Climate Metric Cards Grid (Mobile-First: 2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
        
        {/* Metric 1: Temperature */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{t.temp}</div>
            <div className="text-lg sm:text-xl font-bold text-white font-['Outfit']">
              {forecast.current_temp_c !== undefined ? forecast.current_temp_c : forecast.temp_max_c}°C
            </div>
            <div className="text-[10px] text-slate-500">
              High {forecast.temp_max_c}° / Low {forecast.temp_min_c}°
            </div>
          </div>
        </div>

        {/* Metric 2: Rain Forecast & PoP% */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{t.rainForecast}</div>
            <div className="text-lg sm:text-xl font-bold text-white font-['Outfit'] flex items-baseline gap-1">
              {forecast.rainfall_mm} <span className="text-xs font-normal text-slate-400">mm</span>
            </div>
            <div className={`text-[10px] font-semibold ${
              forecast.precipitation_probability_pct >= 60 ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              {forecast.precipitation_probability_pct}% chance (PoP)
            </div>
          </div>
        </div>

        {/* Metric 3: Relative Humidity */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{t.humidity}</div>
            <div className="text-lg sm:text-xl font-bold text-white font-['Outfit']">
              {forecast.current_humidity_pct !== undefined ? forecast.current_humidity_pct : forecast.relative_humidity_pct}%
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <Wind className="w-3 h-3" /> {forecast.current_wind_speed_kmh || 12} km/h wind
            </div>
          </div>
        </div>

        {/* Metric 4: FAO-56 Reference ET0 (Evaporation) */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{t.et0}</div>
            <div className="text-lg sm:text-xl font-bold text-white font-['Outfit'] flex items-baseline gap-1">
              {forecast.reference_et0_mm} <span className="text-xs font-normal text-slate-400">mm/day</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">
              Penman-Monteith Solar
            </div>
          </div>
        </div>

      </div>

      {/* 7-Day Outlook Toggle */}
      {forecast.sevenDayOutlook && forecast.sevenDayOutlook.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowOutlook(!showOutlook)}
            className="text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            {showOutlook ? 'Hide 7-Day Precipitation Outlook' : 'View 7-Day Precipitation & Solar Outlook'}
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
                        ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200' 
                        : isRainy
                        ? 'bg-blue-950/30 border-blue-500/30 text-blue-200'
                        : 'bg-slate-900/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase">{i === 0 ? 'Today' : dayName}</div>
                    <div className="text-xs font-bold mt-1 text-white">{day.temp_max_c}°</div>
                    <div className="text-[10px] text-cyan-400 font-semibold mt-0.5">{day.rainfall_mm}mm</div>
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
