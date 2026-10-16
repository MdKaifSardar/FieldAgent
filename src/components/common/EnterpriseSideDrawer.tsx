'use client';

import React from 'react';
import { 
  X, 
  MapPin, 
  Droplets, 
  Plus, 
  Check, 
  Trash2, 
  Edit3, 
  Sprout, 
  Layers, 
  User, 
  Zap,
  Waves,
  Cylinder,
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { FarmProfile, normalizeAreaToSqMeters } from '../../types/farm';
import { AuthSession } from '../../adapters/cognitoAdapter';
import { useLanguage } from './LanguageContext';

interface EnterpriseSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  parcels: FarmProfile[];
  activeParcelId: string | null;
  onSelectParcel: (parcelId: string) => void;
  onAddNewParcel: () => void;
  onEditParcel: (parcel: FarmProfile) => void;
  onDeleteParcel: (parcelId: string) => void;
  authSession: AuthSession | null;
}

export function EnterpriseSideDrawer({
  isOpen,
  onClose,
  parcels,
  activeParcelId,
  onSelectParcel,
  onAddNewParcel,
  onEditParcel,
  onDeleteParcel,
  authSession,
}: EnterpriseSideDrawerProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  // Compute aggregate statistics across all parcels
  const totalParcelsCount = parcels.length;
  const totalAreaM2 = parcels.reduce((sum, p) => {
    const parcelArea = p.plots.reduce((pSum, plot) => pSum + (plot.area_sq_meters || 0), 0);
    return sum + parcelArea;
  }, 0);
  const totalBigha = (totalAreaM2 / 1338).toFixed(1);
  const totalAcres = (totalAreaM2 / 4046.86).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 animate-slideLeft">
          
          {/* Header */}
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-[#F8FAF6] dark:bg-zinc-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                  Farm Command Center
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Multi-Parcel & Water Portfolio
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="p-5 bg-linear-to-br from-emerald-950 via-zinc-900 to-zinc-950 text-white border-b border-zinc-800">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-zinc-100 truncate">
                    {authSession?.emailOrPhone || authSession?.displayName || 'Registered Agricultural Member'}
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
                <p className="text-xs text-zinc-400 truncate">
                  ID: {authSession?.userId ? `${authSession.userId.slice(0, 14)}...` : 'Local Farmer Session'}
                </p>
              </div>
            </div>

            {/* Micro Stats Bar */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800/80">
              <div className="bg-zinc-800/50 rounded-xl p-2.5 border border-zinc-700/50">
                <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  Managed Parcels
                </div>
                <div className="text-lg font-black text-emerald-400">
                  {totalParcelsCount} {totalParcelsCount === 1 ? 'Field' : 'Fields'}
                </div>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-2.5 border border-zinc-700/50">
                <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  Total Land Area
                </div>
                <div className="text-lg font-black text-amber-400">
                  {totalBigha} Bigha <span className="text-xs text-zinc-400 font-normal">({totalAcres} ac)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parcels List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Independent Parcels ({parcels.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddNewParcel();
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Field
              </button>
            </div>

            {parcels.length === 0 ? (
              <div className="py-12 px-4 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <Sprout className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  No Parcels Registered Yet
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 max-w-xs mx-auto">
                  Add your first agricultural parcel with its dedicated water supply to activate the cockpit.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAddNewParcel();
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 mx-auto shadow-sm cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Set Up First Parcel
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {parcels.map((p) => {
                  const isActive = p.id === activeParcelId;
                  const parcelAreaM2 = p.plots.reduce((sum, plot) => sum + (plot.area_sq_meters || 0), 0);
                  const parcelBigha = (parcelAreaM2 / 1338).toFixed(1);

                  // Water reserve badge details
                  let waterLabel = 'Unknown Supply';
                  let WaterIcon = Droplets;
                  if (p.reserve.storageType === 'borewell_hours') {
                    waterLabel = `${p.reserve.pumpPower_hp || 5} HP Tube-well (${p.reserve.tubewellAvailableHours || 4}h/day)`;
                    WaterIcon = Zap;
                  } else if (p.reserve.storageType === 'custom_sump') {
                    waterLabel = `Rain Pond / Sump (${p.reserve.totalCapacity_liters?.toLocaleString() || 0} L)`;
                    WaterIcon = Waves;
                  } else if (p.reserve.storageType === 'sintex_tank') {
                    waterLabel = `Sintex Tank (${p.reserve.totalCapacity_liters?.toLocaleString() || 0} L)`;
                    WaterIcon = Cylinder;
                  }

                  return (
                    <div
                      key={p.id}
                      className={`group relative rounded-2xl p-4 transition-all border text-left cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/60 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-white dark:bg-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700/60 shadow-xs'
                      }`}
                      onClick={() => {
                        onSelectParcel(p.id);
                        onClose();
                      }}
                    >
                      {/* Top Row: Name & Active Indicator */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                          }`}>
                            <Sprout className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {p.farmName || 'Unnamed Parcel'}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{p.location.villageOrPincode || 'Location saved'}</span>
                              <span>•</span>
                              <span>{parcelBigha} Bigha</span>
                            </div>
                          </div>
                        </div>

                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 transition-colors" />
                        )}
                      </div>

                      {/* Middle: Dedicated Water Supply */}
                      <div className="mb-2.5 px-2.5 py-1.5 rounded-lg bg-zinc-100/70 dark:bg-zinc-900/60 flex items-center gap-2 text-xs">
                        <WaterIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                          {waterLabel}
                        </span>
                      </div>

                      {/* Bottom Row: Crops tags & Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-700/40 text-xs">
                        <div className="flex flex-wrap gap-1 min-w-0">
                          {p.plots.slice(0, 3).map((plot) => (
                            <span
                              key={plot.id}
                              className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-medium"
                            >
                              {plot.cropName} ({plot.irrigationMethod})
                            </span>
                          ))}
                          {p.plots.length > 3 && (
                            <span className="text-[10px] text-zinc-400">
                              +{p.plots.length - 3} more
                            </span>
                          )}
                        </div>

                        {/* Edit & Delete Controls */}
                        <div 
                          className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditParcel(p);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Edit this parcel"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {parcels.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove "${p.farmName}"?`)) {
                                  onDeleteParcel(p.id);
                                }
                              }}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Delete this parcel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-[#F8FAF6] dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddNewParcel();
              }}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register Another Field / Water Source
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
