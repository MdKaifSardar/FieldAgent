import { DailyWeatherForecast } from '../types/weather';

export async function fetchLiveWeatherForecast(
  latitude: number,
  longitude: number
): Promise<DailyWeatherForecast> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration,temperature_2m_max,temperature_2m_min&timezone=auto`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const daily = data.daily;

    if (!daily || !daily.time || daily.time.length === 0) {
      throw new Error('Malformed daily weather response from Open-Meteo');
    }

    // Look at today (index 0) or next 24h
    const date = daily.time[0];
    const rainfall_mm = daily.precipitation_sum ? Math.max(0, daily.precipitation_sum[0] || 0) : 0;
    const precipitation_probability_pct = daily.precipitation_probability_max 
      ? Math.max(0, daily.precipitation_probability_max[0] || 0) 
      : 0;
    const reference_et0_mm = daily.et0_fao_evapotranspiration 
      ? Math.max(1.0, daily.et0_fao_evapotranspiration[0] || 4.0) 
      : 4.2;
    const temp_max_c = daily.temperature_2m_max ? daily.temperature_2m_max[0] : 32.0;
    const temp_min_c = daily.temperature_2m_min ? daily.temperature_2m_min[0] : 22.0;

    return {
      date,
      rainfall_mm,
      precipitation_probability_pct,
      reference_et0_mm,
      temp_max_c,
      temp_min_c,
      relative_humidity_pct: 65, // Default average when not indexed
      source: 'Open-Meteo Live API',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Live weather fetch failed, returning localized safe estimate:', error);
    // Safe deterministic fallback
    return {
      date: new Date().toISOString().split('T')[0],
      rainfall_mm: 0.0,
      precipitation_probability_pct: 10,
      reference_et0_mm: 4.5,
      temp_max_c: 33.0,
      temp_min_c: 24.0,
      relative_humidity_pct: 60,
      source: 'Open-Meteo Offline Fallback',
      timestamp: new Date().toISOString(),
    };
  }
}
