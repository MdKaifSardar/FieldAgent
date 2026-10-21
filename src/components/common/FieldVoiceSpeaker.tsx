'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { speechService } from '../../adapters/speechAdapter';
import { getFieldVoiceScript } from '../../data/fieldVoiceScripts';
import { Volume2, Pause, Play, RotateCcw, X, Loader2 } from 'lucide-react';

type VoiceStatus = 'idle' | 'playing' | 'paused';

interface ActiveVoiceState {
  id: string | null;
  status: VoiceStatus;
}

let activeVoiceState: ActiveVoiceState = { id: null, status: 'idle' };
const listeners = new Set<(state: ActiveVoiceState) => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn(activeVoiceState));
}

/**
 * Immediately cuts off any active field voice guidance across the entire platform.
 * Call this when switching wizard steps, changing tabs, or unmounting.
 */
export function stopAllFieldVoice() {
  speechService.stop();
  activeVoiceState = { id: null, status: 'idle' };
  notifyListeners();
}

interface FieldVoiceSpeakerProps {
  scriptKey: string;
  customText?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function FieldVoiceSpeaker({
  scriptKey,
  customText,
  className = '',
  size = 'sm',
}: FieldVoiceSpeakerProps) {
  const { language } = useLanguage();
  const [voiceState, setVoiceState] = useState<ActiveVoiceState>(activeVoiceState);

  // Subscribe to global mutex updates
  useEffect(() => {
    const handleUpdate = (nextState: ActiveVoiceState) => {
      setVoiceState(nextState);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const isCurrentActive = voiceState.id === scriptKey;
  const isPlaying = isCurrentActive && voiceState.status === 'playing';
  const isPaused = isCurrentActive && voiceState.status === 'paused';

  const textToSpeak = customText || getFieldVoiceScript(scriptKey, language);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!textToSpeak) return;

    // Mutex: stop any previously playing audio
    speechService.stop();

    activeVoiceState = { id: scriptKey, status: 'playing' };
    notifyListeners();

    speechService.speak(textToSpeak, language, {
      onStart: () => {
        activeVoiceState = { id: scriptKey, status: 'playing' };
        notifyListeners();
      },
      onEnd: () => {
        activeVoiceState = { id: null, status: 'idle' };
        notifyListeners();
      },
      onError: (err) => {
        console.warn('Field voice guidance error:', err);
        activeVoiceState = { id: null, status: 'idle' };
        notifyListeners();
      },
    });
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    speechService.pause();
    activeVoiceState = { id: scriptKey, status: 'paused' };
    notifyListeners();
  };

  const handleResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    speechService.resume();
    activeVoiceState = { id: scriptKey, status: 'playing' };
    notifyListeners();
  };

  const handleRepeat = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handlePlay(e);
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    stopAllFieldVoice();
  };

  if (!textToSpeak) return null;

  // ACTIVE PLAYING OR PAUSED MICRO-PILL CONTROLS
  if (isCurrentActive) {
    return (
      <div
        className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full bg-sky-50 dark:bg-[#0D2436] border border-sky-300 dark:border-[#1E4765] shadow-xs select-none transition-all duration-200 z-10 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Acoustic Wave Bars */}
        <div className="flex items-center gap-0.5 px-0.5">
          <span className={`w-0.5 h-2.5 rounded-full bg-sky-500 ${isPlaying ? 'animate-pulse' : 'opacity-50'}`} />
          <span className={`w-0.5 h-3.5 rounded-full bg-sky-500 ${isPlaying ? 'animate-pulse [animation-delay:150ms]' : 'opacity-50'}`} />
          <span className={`w-0.5 h-2.0 rounded-full bg-sky-500 ${isPlaying ? 'animate-pulse [animation-delay:300ms]' : 'opacity-50'}`} />
        </div>

        {/* Toggle Play / Pause */}
        {isPlaying ? (
          <button
            type="button"
            onClick={handlePause}
            title={language === 'bn' ? 'থামান' : language === 'hi' ? 'रोकें' : 'Pause'}
            className="p-1 rounded-md text-sky-700 dark:text-[#38BDF8] hover:bg-sky-100 dark:hover:bg-[#16364D] transition-colors cursor-pointer"
          >
            <Pause className="w-3 h-3" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleResume}
            title={language === 'bn' ? 'চালান' : language === 'hi' ? 'जारी रखें' : 'Resume'}
            className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-[#16364D] transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3" />
          </button>
        )}

        {/* Replay / Repeat */}
        <button
          type="button"
          onClick={handleRepeat}
          title={language === 'bn' ? 'আবার শুনুন' : language === 'hi' ? 'दोबारा सुनें' : 'Repeat'}
          className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-sky-100 dark:hover:bg-[#16364D] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        {/* Stop / Close */}
        <button
          type="button"
          onClick={handleStop}
          title={language === 'bn' ? 'বন্ধ করুন' : language === 'hi' ? 'बंद करें' : 'Stop'}
          className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // IDLE STANDALONE SPEAKER BUTTON
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const buttonPad = size === 'sm' ? 'p-1' : 'p-1.5';

  return (
    <button
      type="button"
      onClick={handlePlay}
      title={
        language === 'bn'
          ? 'সহজ বিবরণ শুনতে চাপুন'
          : language === 'hi'
          ? 'सरल विवरण सुनने के लिए दबाएं'
          : 'Listen to description'
      }
      className={`inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 dark:text-slate-400 dark:hover:text-[#38BDF8] hover:bg-sky-50 dark:hover:bg-[#102A3E] transition-all cursor-pointer ${buttonPad} ${className}`}
    >
      <Volume2 className={iconSize} />
    </button>
  );
}
