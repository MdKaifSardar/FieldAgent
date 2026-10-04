export interface DailyForecastItem {
  date: string;
  rainfall_mm: number;
  precipitation_probability_pct: number;
  et0_mm: number;
  temp_max_c: number;
  temp_min_c: number;
}

export interface DailyWeatherForecast {
  date: string;
  rainfall_mm: number;
  precipitation_probability_pct: number; // PoP (0-100)
  reference_et0_mm: number; // FAO-56 Penman-Monteith ET0
  temp_max_c: number;
  temp_min_c: number;
  relative_humidity_pct: number;
  current_temp_c?: number;
  current_humidity_pct?: number;
  current_wind_speed_kmh?: number;
  sevenDayOutlook?: DailyForecastItem[];
  source: string; // e.g. "Open-Meteo Live API"
  isLive: boolean;
  timestamp: string;
}
