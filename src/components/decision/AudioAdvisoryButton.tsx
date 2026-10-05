'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, Square, AlertCircle } from 'lucide-react';
import { speechService, SupportedLanguage } from '../../adapters/speechAdapter';
import { useLanguage } from '../common/LanguageContext';

interface AudioAdvisoryButtonProps {
  advisoryText: {
    english: string;
    hindi?: string;
    bengali?: string;
  };
  cropName: string;
}

export function AudioAdvisoryButton({ advisoryText, cropName }: AudioAdvisoryButtonProps) {
  const { language, t } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasVoicePack, setHasVoicePack] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      return;
    }

    setErrorMessage(null);

    // Pick text based on active locale
    let textToSpeak = advisoryText.english;
    if (language === 'hi' && advisoryText.hindi) {
      textToSpeak = advisoryText.hindi;
    } else if (language === 'bn' && advisoryText.bengali) {
      textToSpeak = advisoryText.bengali;
    }

    const { hasNativeVoice } = speechService.speak(textToSpeak, language, {
      onStart: () => {
        setIsSpeaking(true);
      },
      onEnd: () => {
        setIsSpeaking(false);
      },
      onError: (err) => {
        setIsSpeaking(false);
        setErrorMessage(err);
      },
    });

    setHasVoicePack(hasNativeVoice);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <button
        type="button"
        onClick={handleToggleSpeak}
        className={`w-full min-h-[48px] px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg active:scale-98 ${
          isSpeaking
            ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
      >
        {isSpeaking ? (
          <>
            <Square className="w-5 h-5 shrink-0" />
            <span>{t.stopAudio}</span>
            <div className="flex items-center gap-1 ml-2">
              <span className="w-1 h-3 bg-white animate-bounce" />
              <span className="w-1 h-5 bg-white animate-bounce [animation-delay:0.15s]" />
              <span className="w-1 h-2 bg-white animate-bounce [animation-delay:0.3s]" />
            </div>
          </>
        ) : (
          <>
            <Volume2 className="w-5 h-5 shrink-0" />
            <span>{t.listenAdvisory}</span>
            <span className="text-xs bg-emerald-700/60 px-2 py-0.5 rounded-full font-medium">
              {language === 'hi' ? 'हिंदी' : language === 'bn' ? 'বাংলা' : 'English'}
            </span>
          </>
        )}
      </button>

      {/* Device voice capability hint */}
      {!hasVoicePack && isSpeaking && (
        <div className="text-[11px] text-amber-300 flex items-center justify-center gap-1.5 py-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Device using standard voice synthesizer fallback</span>
        </div>
      )}

      {errorMessage && (
        <div className="text-[11px] text-rose-300 flex items-center justify-center gap-1.5 py-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
