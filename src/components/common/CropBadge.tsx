import React, { useState } from 'react';
import { Sprout, Wheat } from 'lucide-react';
import { CROP_VISUAL_ASSETS } from '../../data/agriculturalVisualAssets';
import { localizeCrop } from '../../utils/agriculturalLocalization';
import type { SupportedLanguage } from '../../adapters/speechAdapter';

export interface CropBadgeProps {
  cropName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rounded?: 'full' | 'md' | 'lg';
  alt?: string;
}

const SIZE_MAP = {
  xs: 'w-4 h-4 min-w-4 min-h-4 text-[10px]',
  sm: 'w-5 h-5 min-w-5 min-h-5 text-xs',
  md: 'w-6 h-6 min-w-6 min-h-6 text-sm',
  lg: 'w-8 h-8 min-w-8 min-h-8 text-base',
  xl: 'w-10 h-10 min-w-10 min-h-10 text-lg',
};

const ICON_SIZE_MAP = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4.5 h-4.5',
  xl: 'w-5 h-5',
};

export function CropBadge({
  cropName,
  size = 'sm',
  className = '',
  rounded = 'full',
  alt,
}: CropBadgeProps) {
  const [hasError, setHasError] = useState(false);

  // Normalize crop lookup
  const normalized = (cropName || '').trim().toLowerCase();
  const asset = CROP_VISUAL_ASSETS[cropName] ||
    Object.values(CROP_VISUAL_ASSETS).find(
      (a) => a.id.toLowerCase() === normalized || a.name.toLowerCase() === normalized
    );

  const roundedClass = rounded === 'full' ? 'rounded-full' : rounded === 'lg' ? 'rounded-xl' : 'rounded-md';
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.sm;
  const iconClasses = ICON_SIZE_MAP[size] || ICON_SIZE_MAP.sm;

  const isWheat = normalized.includes('wheat');

  if (!asset?.imageUrl || hasError) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${sizeClasses} ${roundedClass} bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 ${className}`}
        title={cropName}
      >
        {isWheat ? <Wheat className={iconClasses} /> : <Sprout className={iconClasses} />}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs border border-emerald-500/30 dark:border-emerald-500/40 ring-1 ring-emerald-500/20 bg-slate-900 ${sizeClasses} ${roundedClass} ${className}`}
      title={cropName}
    >
      <img
        src={asset.imageUrl}
        alt={alt || cropName}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </span>
  );
}

export function CropBadgeWithName({
  cropName,
  language = 'en',
  size = 'xs',
  className = '',
}: {
  cropName: string;
  language?: SupportedLanguage;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <CropBadge cropName={cropName} size={size} />
      <span>{localizeCrop(cropName, language)}</span>
    </span>
  );
}
