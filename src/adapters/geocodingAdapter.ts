import { GeocodedLocation } from '../types/farm';
import { AppError } from '../types/errors';
import { SupportedLanguage } from './speechAdapter';
import { resolveDistrict, resolveState } from '../data/indiaGazetteer';

/**
 * Curated offline fallback database of prominent Indian agricultural clusters.
 * Ensures zero-failure demo even if third-party Nominatim API is rate-limited or offline.
 */
const INDIAN_AGRI_CENTERS_FALLBACK: Record<string, GeocodedLocation> = {
  '713101': {
    latitude: 23.2324,
    longitude: 87.8615,
    villageOrPincode: 'Bardhaman, West Bengal (713101)',
    district: 'Purba Bardhaman',
    state: 'West Bengal',
    displayName: 'Bardhaman, West Bengal, India',
  },
  'bardhaman': {
    latitude: 23.2324,
    longitude: 87.8615,
    villageOrPincode: 'Bardhaman, West Bengal',
    district: 'Purba Bardhaman',
    state: 'West Bengal',
    displayName: 'Bardhaman, West Bengal, India',
  },
  '422001': {
    latitude: 19.9975,
    longitude: 73.7898,
    villageOrPincode: 'Nashik, Maharashtra (422001)',
    district: 'Nashik',
    state: 'Maharashtra',
    displayName: 'Nashik, Maharashtra, India',
  },
  'nashik': {
    latitude: 19.9975,
    longitude: 73.7898,
    villageOrPincode: 'Nashik, Maharashtra',
    district: 'Nashik',
    state: 'Maharashtra',
    displayName: 'Nashik, Maharashtra, India',
  },
  '132001': {
    latitude: 29.6857,
    longitude: 76.9905,
    villageOrPincode: 'Karnal, Haryana (132001)',
    district: 'Karnal',
    state: 'Haryana',
    displayName: 'Karnal, Haryana, India',
  },
  'karnal': {
    latitude: 29.6857,
    longitude: 76.9905,
    villageOrPincode: 'Karnal, Haryana',
    district: 'Karnal',
    state: 'Haryana',
    displayName: 'Karnal, Haryana, India',
  },
  '571401': {
    latitude: 12.5218,
    longitude: 76.8951,
    villageOrPincode: 'Mandya, Karnataka (571401)',
    district: 'Mandya',
    state: 'Karnataka',
    displayName: 'Mandya, Karnataka, India',
  },
  'mandya': {
    latitude: 12.5218,
    longitude: 76.8951,
    villageOrPincode: 'Mandya, Karnataka',
    district: 'Mandya',
    state: 'Karnataka',
    displayName: 'Mandya, Karnataka, India',
  },
};

export interface LocationSuggestion {
  id: string;
  name: string;
  displayName: string;
  district?: string;
  state?: string;
  latitude: number;
  longitude: number;
  postcode?: string;
  type: 'pincode' | 'village' | 'district' | 'town';
}

export interface GeocodingResponse {
  location: GeocodedLocation;
  isFallback: boolean;
  error?: AppError;
}

/**
 * Real-time debounced location suggestion search for Indian villages, tehsils, and PIN codes.
 */
export async function fetchLocationSuggestions(query: string, lang: SupportedLanguage = 'en'): Promise<LocationSuggestion[]> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) return [];

  const suggestions: LocationSuggestion[] = [];
  const seenCoords = new Set<string>();

  // 1. Instant check against offline curated agricultural hubs
  const lowerQuery = cleanQuery.toLowerCase();
  for (const [key, center] of Object.entries(INDIAN_AGRI_CENTERS_FALLBACK)) {
    if (key.includes(lowerQuery) || lowerQuery.includes(key)) {
      const coordKey = `${center.latitude.toFixed(3)},${center.longitude.toFixed(3)}`;
      if (!seenCoords.has(coordKey)) {
        seenCoords.add(coordKey);
        const locDist = resolveDistrict(center.district, lang) || center.district || '';
        const locState = resolveState(center.state, lang) || center.state || 'India';
        const parts = [center.villageOrPincode.split(',')[0], locDist, locState].filter(Boolean);
        suggestions.push({
          id: `fallback-${key}`,
          name: center.villageOrPincode.split(',')[0],
          displayName: parts.join(', '),
          district: locDist,
          state: locState,
          latitude: center.latitude,
          longitude: center.longitude,
          type: /^\d+$/.test(key) ? 'pincode' : 'district',
        });
      }
    }
  }

  // 2. Query OSM Nominatim locked to India (countrycodes=in) with active language
  try {
    const isPincode = /^\d{3,6}$/.test(cleanQuery);
    const endpoint = isPincode
      ? `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(cleanQuery)}&countrycodes=in&format=json&addressdetails=1&namedetails=1&accept-language=${lang},en&limit=5`
      : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&countrycodes=in&format=json&addressdetails=1&namedetails=1&accept-language=${lang},en&limit=6`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FieldGuard-Agronomic-Engine/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          const coordKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
          if (seenCoords.has(coordKey)) continue;
          seenCoords.add(coordKey);

          const addr = item.address || {};
          const rawDistrict = addr.state_district || addr.county || addr.city || addr.town || '';
          const rawState = addr.state || 'India';
          const district = resolveDistrict(rawDistrict, lang) || rawDistrict;
          const state = resolveState(rawState, lang) || rawState;
          const postcode = addr.postcode || '';
          const name = addr.village || addr.suburb || addr.town || addr.city || item.name || cleanQuery;

          const parts = [name, district, state].filter(Boolean);
          const displayName = parts.length > 0 ? parts.join(', ') : item.display_name;

          suggestions.push({
            id: String(item.place_id || Math.random()),
            name,
            displayName,
            district,
            state,
            latitude: lat,
            longitude: lon,
            postcode,
            type: isPincode ? 'pincode' : addr.village ? 'village' : 'district',
          });
        }
      }
    }
  } catch (err: any) {
    console.warn('[GeocodingAdapter] Online suggestion search warning:', err.message);
  }

  return suggestions.slice(0, 5);
}

/**
 * Resolves Indian village name, district, or 6-digit postal pincode to coordinates.
 */
export async function geocodeLocationQuery(query: string): Promise<GeocodingResponse> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      location: INDIAN_AGRI_CENTERS_FALLBACK['713101'],
      isFallback: true,
    };
  }

  // 1. Try suggestions engine first
  const suggestions = await fetchLocationSuggestions(cleanQuery);
  if (suggestions.length > 0) {
    const top = suggestions[0];
    return {
      location: {
        latitude: top.latitude,
        longitude: top.longitude,
        villageOrPincode: top.displayName,
        district: top.district || 'Selected Region',
        state: top.state || 'India',
        displayName: top.displayName,
      },
      isFallback: false,
    };
  }

  // 2. Fallback to safe Bardhaman baseline
  return {
    location: {
      latitude: 23.2324,
      longitude: 87.8615,
      villageOrPincode: query,
      district: 'Selected Region',
      state: 'India',
      displayName: `${query}, India`,
    },
    isFallback: true,
  };
}

/**
 * Browser 1-Tap Geolocation wrapper with explicit permission diagnostics.
 */
export async function getDeviceCoordinates(): Promise<{
  lat: number;
  lon: number;
  accuracy_m: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
        });
      },
      (err) => {
        let msg = 'Unable to retrieve location.';
        if (err.code === 1) msg = 'Location access was denied. Please allow GPS permissions in your browser or enter your pincode.';
        if (err.code === 2) msg = 'Position unavailable. GPS signal is weak.';
        if (err.code === 3) msg = 'Location request timed out.';
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Reverse geocodes latitude/longitude to a human-readable village/district name.
 */
export async function reverseGeocodeCoordinates(lat: number, lon: number, lang: SupportedLanguage = 'en'): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const endpoint = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14&addressdetails=1&namedetails=1&accept-language=${lang},en`;
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FieldGuard-Agronomic-Engine/1.0',
      },
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const place = addr.village || addr.suburb || addr.hamlet || addr.town || addr.city || addr.county || '';
        const rawDistrict = addr.state_district || addr.county || addr.city || '';
        const rawState = addr.state || '';
        const district = resolveDistrict(rawDistrict, lang) || rawDistrict;
        const state = resolveState(rawState, lang) || rawState;
        const formatted = [place, district, state].filter(Boolean).join(', ');
        if (formatted) return formatted;
      }
    }
  } catch (e) {
    // Fallback to coordinates
  }
  const prefix = lang === 'bn' ? 'পার্সেল' : lang === 'hi' ? 'खेत' : 'Parcel';
  return `${prefix} (${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E)`;
}
