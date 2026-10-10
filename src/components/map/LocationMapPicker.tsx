'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapPin, Layers, Crosshair, Loader2, Globe } from 'lucide-react';
import { getDeviceCoordinates, reverseGeocodeCoordinates } from '../../adapters/geocodingAdapter';

interface LocationMapPickerProps {
  latitude: number;
  longitude: number;
  onChangeLocation?: (lat: number, lon: number, displayName?: string) => void;
  interactive?: boolean;
  height?: string;
  locationName?: string;
  zoom?: number;
}

export function LocationMapPicker({
  latitude,
  longitude,
  onChangeLocation,
  interactive = true,
  height = '280px',
  locationName,
  zoom = 14,
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number }>({
    lat: latitude,
    lon: longitude,
  });

  // Keep internal coords state synced with incoming props
  useEffect(() => {
    setCurrentCoords({ lat: latitude, lon: longitude });
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.panTo([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Handle marker drag or map click
  const handleLocationChange = useCallback(
    async (lat: number, lon: number) => {
      const roundedLat = parseFloat(lat.toFixed(4));
      const roundedLon = parseFloat(lon.toFixed(4));
      setCurrentCoords({ lat: roundedLat, lon: roundedLon });

      if (onChangeLocation) {
        setIsReverseGeocoding(true);
        try {
          const resolvedName = await reverseGeocodeCoordinates(roundedLat, roundedLon);
          onChangeLocation(roundedLat, roundedLon, resolvedName);
        } catch {
          onChangeLocation(roundedLat, roundedLon);
        } finally {
          setIsReverseGeocoding(false);
        }
      }
    },
    [onChangeLocation]
  );

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      // Dynamically import Leaflet on client-side
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Custom high-contrast SVG pin with animated pulse
      const customPin = L.divIcon({
        className: 'fieldguard-leaflet-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: ${interactive ? 'grab' : 'default'};">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(16, 185, 129, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 32],
      });

      // Create Leaflet Map instance
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Layer 1: ESRI Satellite Imagery
      const satelliteTiles = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      );

      // Layer 2: OpenStreetMap Standard
      const streetTiles = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19 }
      );

      // Default active tile layer
      tileLayerRef.current = mapType === 'satellite' ? satelliteTiles : streetTiles;
      tileLayerRef.current.addTo(map);

      // Create Marker (Draggable if interactive)
      const marker = L.marker([latitude, longitude], {
        icon: customPin,
        draggable: interactive,
      }).addTo(map);

      if (interactive) {
        // Drag listener
        marker.on('dragend', (e: any) => {
          const latlng = e.target.getLatLng();
          handleLocationChange(latlng.lat, latlng.lng);
        });

        // Click on map to reposition pin
        map.on('click', (e: any) => {
          marker.setLatLng(e.latlng);
          map.panTo(e.latlng);
          handleLocationChange(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Add compact zoom control at bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch Tile Layer between Satellite and Street
  const handleToggleMapType = async () => {
    if (!mapInstanceRef.current) return;
    const L = (await import('leaflet')).default;

    const nextType = mapType === 'satellite' ? 'street' : 'satellite';
    setMapType(nextType);

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    if (nextType === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(mapInstanceRef.current);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19 }
      ).addTo(mapInstanceRef.current);
    }
  };

  // Re-center on user GPS device
  const handleCenterDeviceLocation = async () => {
    setIsLocating(true);
    try {
      const coords = await getDeviceCoordinates();
      if (mapInstanceRef.current && markerRef.current) {
        markerRef.current.setLatLng([coords.lat, coords.lon]);
        mapInstanceRef.current.flyTo([coords.lat, coords.lon], 15, { duration: 1.2 });
        handleLocationChange(coords.lat, coords.lon);
      }
    } catch (err: any) {
      console.warn('GPS location error:', err.message);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner group">
      
      {/* Map DOM Canvas */}
      <div 
        ref={mapContainerRef} 
        style={{ height, width: '100%' }}
        className="z-0 bg-slate-900"
      />

      {/* Floating Top Bar Controls */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
        
        {/* Coordinates & Status Badge */}
        <div className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[11px] font-mono text-white border border-white/10 shadow-lg">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {currentCoords.lat.toFixed(4)}° N, {currentCoords.lon.toFixed(4)}° E
          </span>
          {isReverseGeocoding && (
            <Loader2 className="w-3 h-3 text-cyan-400 animate-spin ml-1" />
          )}
        </div>

        {/* Action Buttons: Satellite Toggle & 1-Tap GPS */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleMapType}
            className="px-2 py-1 rounded-lg bg-black/75 hover:bg-black/90 backdrop-blur-md text-[11px] font-medium text-white border border-white/10 shadow-lg transition-colors cursor-pointer flex items-center gap-1"
            title="Switch Map Type"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="capitalize">{mapType === 'satellite' ? 'Street' : 'Satellite'}</span>
          </button>

          {interactive && (
            <button
              type="button"
              onClick={handleCenterDeviceLocation}
              disabled={isLocating}
              className="p-1.5 rounded-lg bg-black/75 hover:bg-black/90 backdrop-blur-md text-white border border-white/10 shadow-lg transition-colors cursor-pointer disabled:opacity-50"
              title="1-Tap GPS Re-center"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
            </button>
          )}
        </div>
      </div>

      {/* Bottom helper pill (Only in interactive mode) */}
      {interactive && (
        <div className="absolute bottom-2.5 left-2.5 pointer-events-none z-10">
          <span className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-[10px] text-slate-300 border border-white/10 shadow-md">
            Drag marker or tap map to refine farm parcel
          </span>
        </div>
      )}

      {/* Location Name Pill if provided */}
      {locationName && !interactive && (
        <div className="absolute bottom-2.5 left-2.5 pointer-events-none z-10">
          <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[11px] font-medium text-white border border-white/10 shadow-md truncate max-w-[200px] inline-block">
            {locationName}
          </span>
        </div>
      )}

    </div>
  );
}
