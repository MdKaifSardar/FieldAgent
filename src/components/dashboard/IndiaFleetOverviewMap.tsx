'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { FarmProfile } from '../../types/farm';
import { useLanguage } from '../common/LanguageContext';
import { 
  localizeCrop, 
  localizeLocation, 
  localizeFieldTitle, 
  localizeStorageType 
} from '../../utils/agriculturalLocalization';
import { 
  MapPin, 
  Droplets, 
  Sprout, 
  ArrowRight, 
  Globe, 
  Layers, 
  Plus, 
  Minus,
  Maximize2,
  X
} from 'lucide-react';

interface IndiaFleetOverviewMapProps {
  parcels: FarmProfile[];
  activeParcelId: string | null;
  onSelectParcel: (parcelId: string) => void;
  onNavigateToAdvisory?: () => void;
  className?: string;
  height?: string;
}

// Bounding box for Indian Subcontinent
const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 68.0],
  [37.5, 97.5],
];

export function IndiaFleetOverviewMap({
  parcels,
  activeParcelId,
  onSelectParcel,
  onNavigateToAdvisory,
  className = '',
  height = '310px',
}: IndiaFleetOverviewMapProps) {
  const { language, t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');
  const [selectedParcel, setSelectedParcel] = useState<FarmProfile | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Default to active parcel or first parcel if selected
  useEffect(() => {
    if (activeParcelId) {
      const match = parcels.find((p) => p.id === activeParcelId);
      if (match) setSelectedParcel(match);
    }
  }, [activeParcelId, parcels]);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // 1. Initialize Map Instance
      const map = L.map(mapContainerRef.current, {
        center: [22.5, 82.5],
        zoom: 4.5,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
      });

      // Fit initially to India Bounding Box
      map.fitBounds(INDIA_BOUNDS, { padding: [10, 10], animate: false });

      // 2. Tile Layers
      const satelliteTiles = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      );

      const streetTiles = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19 }
      );

      tileLayerRef.current = mapType === 'satellite' ? satelliteTiles : streetTiles;
      tileLayerRef.current.addTo(map);

      // LayerGroup for Markers
      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      mapInstanceRef.current = map;
      setIsMapReady(true);
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

  // Update Tile Layer when mapType changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((LModule) => {
      const L = LModule.default;
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      if (mapType === 'satellite') {
        tileLayerRef.current = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 18 }
        ).addTo(map);
      } else {
        tileLayerRef.current = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { maxZoom: 19 }
        ).addTo(map);
      }
    });
  }, [mapType]);

  // Plot Parcels as Interactive Radar Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    import('leaflet').then((LModule) => {
      const L = LModule.default;
      markersGroup.clearLayers();

      parcels.forEach((parcel) => {
        const isSelected = selectedParcel?.id === parcel.id;
        const lat = parcel.location?.latitude;
        const lon = parcel.location?.longitude;
        if (typeof lat !== 'number' || typeof lon !== 'number') return;

        const primaryCrop = parcel.plots?.[0]?.cropName || 'Field';
        const cropLabel = localizeCrop(primaryCrop, language);

        const markerHtml = `
          <div class="relative flex flex-col items-center cursor-pointer group" style="transform: translate(-50%, -50%);">
            <!-- Pulsing outer radar ring -->
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${
              isSelected ? 'rgba(56, 189, 248, 0.45)' : 'rgba(16, 185, 129, 0.35)'
            }; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            
            <!-- Pin Center Badge -->
            <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: ${
              isSelected ? '#0284c7' : '#10b981'
            }; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>

            <!-- Micro Floating Pill Title -->
            <div style="margin-top: 4px; padding: 2px 6px; border-radius: 6px; background: rgba(7, 23, 36, 0.88); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.15); color: #f0f9ff; font-size: 10px; font-weight: 600; font-family: monospace; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4); pointer-events: none;">
              ${cropLabel}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-fleet-pin',
          html: markerHtml,
          iconSize: [36, 48],
          iconAnchor: [18, 24],
        });

        const marker = L.marker([lat, lon], {
          icon: customIcon,
        });

        // Click marker: ZOOM into location & open bubble (do NOT open cockpit directly)
        marker.on('click', () => {
          setSelectedParcel(parcel);
          onSelectParcel(parcel.id);
          map.flyTo([lat, lon], 13, { duration: 1.2 });
        });

        markersGroup.addLayer(marker);
      });
    });
  }, [parcels, selectedParcel?.id, onSelectParcel]);

  // Zoom to full India bounds
  const handleResetToAllIndia = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.fitBounds(INDIA_BOUNDS, { padding: [10, 10], animate: true });
  };

  // Zoom in / out controls
  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomOut();
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-[#E1E8DE] dark:border-[#16364D] bg-[#071724] shadow-md select-none ${className}`}
      style={{ height }}
    >
      {/* 1. Leaflet Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 2. Top-Left: Map Radar Header Badge */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#071724]/85 backdrop-blur-md border border-[#16364D] shadow-xs text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-slate-200 text-[11px] font-mono">
          {language === 'bn' ? 'ভারত মানচিত্র ওভারভিউ' : language === 'hi' ? 'अखिल भारतीय नक्शा' : 'Pan-India Overview'}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-mono font-bold">
          {parcels.length} {language === 'bn' ? 'জমি' : language === 'hi' ? 'खेत' : 'Fields'}
        </span>
      </div>

      {/* 3. Top-Right: Map View Controls (Layer Toggle & Reset View) */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5">
        {/* Toggle Satellite / Street */}
        <button
          type="button"
          onClick={() => setMapType(mapType === 'satellite' ? 'street' : 'satellite')}
          className="p-1.5 rounded-xl bg-[#071724]/85 backdrop-blur-md border border-[#16364D] text-slate-300 hover:text-white hover:bg-[#0D2232] transition-colors shadow-xs cursor-pointer"
          title={mapType === 'satellite' ? 'Switch to Street Map' : 'Switch to Satellite Map'}
        >
          <Layers className="w-4 h-4 text-sky-400" />
        </button>

        {/* Reset to All India */}
        <button
          type="button"
          onClick={handleResetToAllIndia}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#071724]/85 backdrop-blur-md border border-[#16364D] text-slate-300 hover:text-white hover:bg-[#0D2232] transition-colors shadow-xs cursor-pointer text-[11px] font-mono font-bold"
          title="Zoom out to show entire India"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{language === 'bn' ? 'সমগ্র ভারত' : language === 'hi' ? 'पूरा भारत' : 'All India'}</span>
        </button>
      </div>

      {/* 4. Bottom-Right: Zoom +/- Controls */}
      <div className="absolute bottom-3 right-3 z-[400] flex flex-col gap-1">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-7 h-7 rounded-lg bg-[#071724]/90 backdrop-blur-md border border-[#16364D] text-slate-200 hover:text-white hover:bg-[#0D2232] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-7 h-7 rounded-lg bg-[#071724]/90 backdrop-blur-md border border-[#16364D] text-slate-200 hover:text-white hover:bg-[#0D2232] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* 5. Selected Parcel Detail Bubble (Hover/Click Detail Modal with "Open Cockpit" Button) */}
      {selectedParcel && (
        <div className="absolute bottom-3 left-3 right-12 sm:right-auto sm:max-w-xs z-[400] p-3 rounded-xl bg-[#071724]/95 backdrop-blur-md border border-sky-500/40 shadow-xl text-xs text-slate-200 transition-all animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 font-mono">
                {localizeLocation(selectedParcel.location?.displayName || selectedParcel.location?.villageOrPincode, language)}
              </span>
              <h4 className="font-bold text-sm text-white truncate font-['Outfit'] mt-0.5">
                {localizeFieldTitle(selectedParcel.farmName, language)}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedParcel(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#16364D] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                {selectedParcel.plots && selectedParcel.plots.length > 0
                  ? selectedParcel.plots
                      .map((p) => `${localizeCrop(p.cropName, language)} (${p.areaValue || 1} ${t.unitBigha})`)
                      .join(', ')
                  : `${localizeCrop(selectedParcel.plots?.[0]?.cropName || 'Tomato', language)}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>
                {selectedParcel.reserve
                  ? `${localizeStorageType(selectedParcel.reserve.storageType, language)} • ${(selectedParcel.reserve.currentAvailable_liters || 0).toLocaleString()} L`
                  : 'Direct Borewell Supply'}
              </span>
            </div>
          </div>

          {/* User Requested: "Open Cockpit" Button Inside the Bubble */}
          <button
            type="button"
            onClick={() => {
              onSelectParcel(selectedParcel.id);
              onNavigateToAdvisory?.();
            }}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
          >
            <span>
              {language === 'bn'
                ? 'অ্যাডভাইজরি ককপিট খুলুন'
                : language === 'hi'
                ? 'सलाहकार कॉकपिट खोलें'
                : 'Open Advisory Cockpit'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
