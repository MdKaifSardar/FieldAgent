import { GeocodedLocation } from '../types/farm';
import { AppError } from '../types/errors';

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

export interface GeocodingResponse {
  location: GeocodedLocation;
  isFallback: boolean;
  error?: AppError;
}

/**
 * Resolves Indian village name, district, or 6-digit postal pincode to coordinates.
 */
export async function geocodeLocationQuery(query: string): Promise<GeocodingResponse> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return {
      location: INDIAN_AGRI_CENTERS_FALLBACK['713101'],
      isFallback: true,
    };
  }

  // 1. Check instant offline dictionary
  for (const [key, center] of Object.entries(INDIAN_AGRI_CENTERS_FALLBACK)) {
    if (cleanQuery.includes(key) || key.includes(cleanQuery)) {
      return {
        location: center,
        isFallback: false,
      };
    }
  }

  // 2. Query OpenStreetMap Nominatim with 3-second timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query + ', India'
    )}&format=json&addressdetails=1&limit=1`;

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FieldGuard-Agronomic-Engine/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Nominatim HTTP ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      const address = item.address || {};
      const district = address.state_district || address.county || address.city || 'District';
      const state = address.state || 'India';
      const postcode = address.postcode || query;

      return {
        location: {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          villageOrPincode: `${district}, ${state} (${postcode})`,
          district,
          state,
          displayName: item.display_name,
        },
        isFallback: false,
      };
    }
  } catch (err: any) {
    console.warn('[GeocodingAdapter] Online search failed, using default baseline:', err.message);
  }

  // Fallback to safe Bardhaman baseline with helpful trace
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
