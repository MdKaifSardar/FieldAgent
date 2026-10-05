import { DailyWeatherForecast, DailyForecastItem } from '../types/weather';

export interface WeatherFetchResult {
  forecast: DailyWeatherForecast;
  isLive: boolean;
  errorMessage?: string;
}

export async function fetchLiveWeatherForecast(
  latitude: number,
  longitude: number
): Promise<WeatherFetchResult> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration,temperature_2m_max,temperature_2m_min&timezone=auto`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo API HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const daily = data.daily;
    const current = data.current || {};

    if (!daily || !daily.time || daily.time.length === 0) {
      throw new Error('Malformed daily weather response from Open-Meteo');
    }

    // Today (index 0)
    const date = daily.time[0];
    const rainfall_mm = daily.precipitation_sum ? Math.max(0, daily.precipitation_sum[0] || 0) : 0;
    const precipitation_probability_pct = daily.precipitation_probability_max 
      ? Math.max(0, daily.precipitation_probability_max[0] || 0) 
      : 0;
    const reference_et0_mm = daily.et0_fao_evapotranspiration 
      ? Math.max(1.0, Math.round((daily.et0_fao_evapotranspiration[0] || 4.0) * 10) / 10) 
      : 4.2;
    const temp_max_c = daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[0]) : 32;
    const temp_min_c = daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[0]) : 22;

    const current_temp_c = current.temperature_2m !== undefined ? Math.round(current.temperature_2m) : temp_max_c;
    const current_humidity_pct = current.relative_humidity_2m !== undefined ? Math.round(current.relative_humidity_2m) : 65;
    const current_wind_speed_kmh = current.wind_speed_10m !== undefined ? Math.round(current.wind_speed_10m) : 12;

    // Build 7-day outlook
    const sevenDayOutlook: DailyForecastItem[] = daily.time.slice(0, 7).map((d: string, idx: number) => ({
      date: d,
      rainfall_mm: daily.precipitation_sum ? Math.max(0, daily.precipitation_sum[idx] || 0) : 0,
      precipitation_probability_pct: daily.precipitation_probability_max ? Math.max(0, daily.precipitation_probability_max[idx] || 0) : 0,
      et0_mm: daily.et0_fao_evapotranspiration ? Math.max(1.0, daily.et0_fao_evapotranspiration[idx] || 4.0) : 4.0,
      temp_max_c: daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[idx]) : 30,
      temp_min_c: daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[idx]) : 20,
    }));

    return {
      forecast: {
        date,
        rainfall_mm,
        precipitation_probability_pct,
        reference_et0_mm,
        temp_max_c,
        temp_min_c,
        relative_humidity_pct: current_humidity_pct,
        current_temp_c,
        current_humidity_pct,
        current_wind_speed_kmh,
        sevenDayOutlook,
        source: 'Open-Meteo Meteorological Feed',
        isLive: true,
        timestamp: new Date().toISOString(),
      },
      isLive: true,
    };
  } catch (error: any) {
    const errorMsg = error.message || 'Unknown network error';
    console.warn('[openMeteoAdapter] Weather sync failed, activating fallback:', errorMsg);

    return {
      forecast: {
        date: new Date().toISOString().split('T')[0],
        rainfall_mm: 0.0,
        precipitation_probability_pct: 10,
        reference_et0_mm: 4.5,
        temp_max_c: 33,
        temp_min_c: 24,
        relative_humidity_pct: 58,
        current_temp_c: 31,
        current_humidity_pct: 58,
        current_wind_speed_kmh: 11,
        source: 'Regional Agro-Climatic Baseline (Offline Cache)',
        isLive: false,
        timestamp: new Date().toISOString(),
      },
      isLive: false,
      errorMessage: errorMsg,
    };
  }
}
