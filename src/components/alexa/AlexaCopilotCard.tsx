'use client';

import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Mic, 
  Volume2, 
  VolumeX, 
  Droplets, 
  Sliders, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Maximize2
} from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

interface AlexaCopilotCardProps {
  farmId: string;
  farmName: string;
  currentAdviceText: string;
  onOpenFullModal: (initialPrompt?: string) => void;
}

export function AlexaCopilotCard({
  farmId,
  farmName,
  currentAdviceText,
  onOpenFullModal,
}: AlexaCopilotCardProps) {
  const { language } = useLanguage();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayVoice = async () => {
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setIsPlayingAudio(true);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentAdviceText,
          language: language === 'hi' ? 'hi' : 'en',
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        await audio.play();
      } else {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(currentAdviceText);
          utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
          utterance.onend = () => setIsPlayingAudio(false);
          utterance.onerror = () => setIsPlayingAudio(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setIsPlayingAudio(false);
        }
      }
    } catch {
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4 sm:p-5 text-white shadow-xl">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-500 shadow-[0_0_15px_#38bdf8]" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          {/* Alexa Orb */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-sky-600 via-cyan-500 to-blue-600 shadow-md ${
            isPlayingAudio ? 'ring-2 ring-cyan-400 animate-pulse' : ''
          }`}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base tracking-tight font-['Outfit'] text-white">
                Alexa+ Agronomic Copilot
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                MCP Tool-Powered
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live advisory for <span className="text-sky-300 font-semibold">{farmName}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Polly Voice Read-Aloud */}
          <button
            type="button"
            onClick={handlePlayVoice}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isPlayingAudio
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_#00f0ff]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Listen to spoken recommendation via Amazon Polly"
          >
            {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isPlayingAudio ? 'Stop Voice' : 'Hear Advice'}</span>
          </button>

          {/* Open Full Assistant */}
          <button
            type="button"
            onClick={() => onOpenFullModal()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Open Full Alexa+ Console"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Spoken Recommendation Text */}
      <div className="py-3.5">
        <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed">
          "{currentAdviceText}"
        </p>
      </div>

      {/* Interactive Quick Prompts for Farmers */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Ask Alexa+:
          </span>
          
          <button
            type="button"
            onClick={() => onOpenFullModal('I have 800 Litres of water. Which plot should I irrigate first?')}
            className="px-2.5 py-1 rounded-full text-xs bg-sky-950/60 hover:bg-sky-900/80 text-cyan-300 border border-sky-600/40 transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <Droplets className="w-3 h-3 text-cyan-400" />
            <span>"I have 800L of water"</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenFullModal('What if I switch from Flood to Drip irrigation?')}
            className="px-2.5 py-1 rounded-full text-xs bg-sky-950/60 hover:bg-sky-900/80 text-cyan-300 border border-sky-600/40 transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>"Switch to Drip"</span>
          </button>
        </div>

        {/* Big Tap to Speak Button */}
        <button
          type="button"
          onClick={() => onOpenFullModal()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Tap to Speak with Alexa+</span>
        </button>
      </div>
    </div>
  );
}
