'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, Square } from 'lucide-react';
import { speechService } from '../../adapters/speechAdapter';
import { useLanguage } from '../common/LanguageContext';

interface AudioAdvisoryButtonProps {
  advisoryText: {
    english: string;
    hindi?: string;
    bengali?: string;
  };
  cropName: string;
  variant?: 'leaf' | 'terracotta' | 'water';
}

export function AudioAdvisoryButton({ advisoryText, cropName, variant = 'leaf' }: AudioAdvisoryButtonProps) {
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

  const buttonStyle = isSpeaking
    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
    : variant === 'terracotta'
    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
    : variant === 'water'
    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs'
    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs';

  const badgeStyle = 'bg-black/20 text-white/90';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <button
        type="button"
        onClick={handleToggleSpeak}
        className={`w-full min-h-[44px] px-4 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer ${buttonStyle}`}
      >
        {isSpeaking ? (
          <>
            <Square className="w-4 h-4 shrink-0" />
            <span>{t.stopAudio}</span>
            <div className="flex items-center gap-1 ml-2">
              <span className="w-1 h-3 bg-white animate-bounce" />
              <span className="w-1 h-4 bg-white animate-bounce [animation-delay:0.15s]" />
              <span className="w-1 h-2 bg-white animate-bounce [animation-delay:0.3s]" />
            </div>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 shrink-0" />
            <span>{t.listenAdvisory}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badgeStyle}`}>
              {language === 'hi' ? 'हिंदी' : language === 'bn' ? 'বাংলা' : 'English'}
            </span>
          </>
        )}
      </button>

      {errorMessage && (
        <p className="text-[11px] text-rose-500 dark:text-rose-400 text-center font-medium">
          {errorMessage}
        </p>
      )}

      {!hasVoicePack && !errorMessage && (
        <p className="text-[10px] text-slate-400 text-center">
          Using synthesized cloud audio stream
        </p>
      )}
    </div>
  );
}
