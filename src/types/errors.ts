/**
 * Standard typed application error structure for FieldGuard.
 * Enables zero silent failures, user-friendly mobile guidance,
 * and copyable technical traces for debugging and system evaluation.
 */
export type ErrorCategory = 
  | 'NETWORK' 
  | 'GEOCODING' 
  | 'WEATHER_PROVIDER' 
  | 'AUDIO_SPEECH' 
  | 'AGRONOMIC_VALIDATION' 
  | 'AWS_CLOUD';

export interface DiagnosticTrace {
  timestamp: string;
  source: string; // e.g. "openMeteoAdapter", "geocodingAdapter", "speechAdapter"
  requestUrl?: string;
  statusCode?: number;
  rawResponse?: string;
  deviceInfo?: string;
}

export interface AppError {
  id: string;
  category: ErrorCategory;
  title: string;
  userFriendlyMessage: string;
  technicalDetails?: string;
  actionLabel?: string;
  diagnostic?: DiagnosticTrace;
  isRecoverable: boolean;
  onRetry?: () => void;
}
