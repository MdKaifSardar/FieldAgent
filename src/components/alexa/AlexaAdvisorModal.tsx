'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Droplets, 
  Zap, 
  CheckCircle2, 
  RotateCcw,
  Sliders,
  ChevronRight,
  Database,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';
import { ToolAuditEntry } from '../../core/agent/bedrockAgent';

interface ChatMessage {
  id: string;
  sender: 'user' | 'alexa';
  text: string;
  spokenText?: string;
  toolAudits?: ToolAuditEntry[];
  structuredData?: any;
  activeScenario?: string;
  timestamp: string;
}

interface AlexaAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
  farmName?: string;
  initialPrompt?: string;
}

export function AlexaAdvisorModal({
  isOpen,
  onClose,
  farmId,
  farmName = 'Your Farm',
  initialPrompt,
}: AlexaAdvisorModalProps) {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setIsListening(false);
          handleSendQuery(transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [language]);

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeText = language === 'hi'
        ? `नमस्ते! मैं आपका Alexa+ कृषि सलाहकार हूँ। आप मुझसे पानी के बजट (उदा. "मेरे पास 800 लीटर पानी है"), ड्रिप सिंचाई की तुलना, या योजना सहेजने के बारे में पूछ सकते हैं।`
        : `Hello! I am your Alexa+ Field Advisor. Ask me about your water budget (e.g. "I have 800 Litres of water"), comparing Drip vs Flood irrigation, or saving an allocation plan.`;

      setMessages([
        {
          id: 'welcome',
          sender: 'alexa',
          text: welcomeText,
          spokenText: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      if (initialPrompt) {
        handleSendQuery(initialPrompt);
      }
    }
  }, [isOpen, initialPrompt]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Play audio via Polly / TTS endpoint
  const speakText = async (text: string) => {
    if (isMuted || !text) return;

    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      setIsPlayingAudio(true);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: language === 'hi' ? 'hi' : 'en',
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlayingAudio(false);
        };
        audio.onerror = () => {
          setIsPlayingAudio(false);
        };
        await audio.play();
      } else {
        // Fallback to browser SpeechSynthesis
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
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

  const toggleMic = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputText('');
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/alexa/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          farmId,
          language,
          history: messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        const alexaMsg: ChatMessage = {
          id: `alexa-${Date.now()}`,
          sender: 'alexa',
          text: data.reply,
          spokenText: data.spokenReply || data.reply,
          toolAudits: data.toolAudits,
          structuredData: data.structuredData,
          activeScenario: data.activeScenario,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, alexaMsg]);
        speakText(alexaMsg.spokenText || alexaMsg.text);
      } else {
        const errorMsg: ChatMessage = {
          id: `alexa-err-${Date.now()}`,
          sender: 'alexa',
          text: `I encountered an issue: ${data.error || 'Please try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `alexa-err-${Date.now()}`,
        sender: 'alexa',
        text: 'Network connection issue. Please check your connection and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlanClick = () => {
    handleSendQuery(language === 'hi' ? 'यह योजना सुरक्षित करें' : 'Save this plan for my farm');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-[90vh] max-h-[820px] flex flex-col bg-slate-900 border border-sky-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* TOP ALEXA HEADER */}
        <div className="relative px-5 py-3.5 border-b border-sky-500/20 bg-gradient-to-r from-slate-950 via-sky-950/60 to-slate-950 flex items-center justify-between shrink-0">
          {/* Pulsing Light Ring Accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-500 shadow-[0_0_12px_#38bdf8]" />

          <div className="flex items-center gap-3">
            {/* Glowing Alexa Orb */}
            <div className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isPlayingAudio ? 'ring-4 ring-cyan-400/60 shadow-[0_0_20px_#00f0ff]' : 'ring-2 ring-sky-500/40 shadow-md'
            } bg-gradient-to-tr from-sky-600 via-cyan-500 to-blue-600`}>
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white font-['Outfit']">
                  Alexa+ Field Advisor
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                  MCP v2025-11-25
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                Context: <span className="text-sky-300 font-medium">{farmName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mute/Unmute audio button */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isMuted 
                  ? 'bg-slate-800 border-slate-700 text-slate-400' 
                  : 'bg-sky-500/20 border-sky-500/40 text-sky-300 hover:bg-sky-500/30'
              }`}
              title={isMuted ? 'Voice Muted' : 'Voice Active (Polly)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CHAT MESSAGES CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-radial from-slate-900 via-slate-950 to-black">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
            >
              {/* Chat Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-br-xs font-medium'
                    : 'bg-slate-800/90 border border-slate-700/70 text-slate-100 rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Read aloud icon on assistant message */}
                {msg.sender === 'alexa' && msg.spokenText && (
                  <button
                    type="button"
                    onClick={() => speakText(msg.spokenText!)}
                    className="mt-2 text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Play voice read-aloud</span>
                  </button>
                )}
              </div>

              {/* LIVE MCP TOOL AUDIT BADGES (Visible proof of tool execution) */}
              {msg.toolAudits && msg.toolAudits.length > 0 && (
                <div className="mt-2 w-full max-w-[85%] sm:max-w-[82%] space-y-1.5">
                  {msg.toolAudits.map((audit, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-sky-500/30 flex items-center justify-between text-xs font-mono shadow-xs text-sky-300"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-semibold text-white">mcp.{audit.toolName}</span>
                        <span className="text-[10px] text-slate-400 truncate">
                          ({JSON.stringify(audit.arguments)})
                        </span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-cyan-300 border border-sky-800/60 shrink-0 ml-2">
                        {audit.durationMs}ms
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* MULTIMODAL INTERACTIVE RESULT CARDS */}
              {msg.structuredData && msg.activeScenario === 'water_allocation' && (
                <div className="mt-3 w-full max-w-[88%] sm:max-w-[84%] p-3.5 sm:p-4 rounded-xl bg-slate-800/95 border border-cyan-500/40 shadow-lg text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                    <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-cyan-300">
                      <Droplets className="w-4 h-4 text-cyan-400" />
                      Triage Water Allocation
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                      Budget: {msg.structuredData.availableBudgetLiters.toLocaleString()} L
                    </span>
                  </div>

                  {/* Allocation Table */}
                  <div className="space-y-2">
                    {msg.structuredData.allocations.map((alloc: any) => (
                      <div
                        key={alloc.plotId}
                        className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/70 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{alloc.cropName}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                              alloc.urgencyLevel === 'critical' ? 'bg-red-500/20 text-red-300' : 'bg-slate-700 text-slate-300'
                            }`}>
                              {alloc.urgencyLevel}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Demand: {alloc.grossDemand_liters.toLocaleString()} L | Method: {alloc.irrigationMethod} ({alloc.efficiencyPct}%)
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-cyan-300 block font-mono">
                            {alloc.allocated_liters.toLocaleString()} L
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Pump: ~{alloc.pumpRuntimeMinutes} mins
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 1-Click Save Plan Button */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 italic">
                      Ready to execute this recommendation?
                    </span>
                    <button
                      type="button"
                      onClick={handleSavePlanClick}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm & Save Plan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Method Comparison Card */}
              {msg.structuredData && msg.activeScenario === 'method_comparison' && (
                <div className="mt-3 w-full max-w-[88%] sm:max-w-[84%] p-3.5 sm:p-4 rounded-xl bg-slate-800/95 border border-sky-500/40 shadow-lg text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                    <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-sky-300">
                      <Sliders className="w-4 h-4 text-sky-400" />
                      Irrigation Efficiency Comparison
                    </span>
                    <span className="text-[11px] text-slate-300 font-mono">
                      Crop: {msg.structuredData.cropName}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {msg.structuredData.comparisonTable.map((c: any) => (
                      <div
                        key={c.method}
                        className={`p-2.5 rounded-lg border ${
                          c.method === 'drip'
                            ? 'bg-sky-950/60 border-cyan-400 text-cyan-200'
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span className="font-bold uppercase text-[10px] block">{c.method}</span>
                        <span className="text-[10px] text-slate-400 block mb-1">Eff: {c.efficiencyPct}%</span>
                        <span className="text-xs font-mono font-bold block">{c.grossWaterRequired_liters.toLocaleString()} L</span>
                        <span className="text-[10px] text-slate-400 block">{c.pumpHoursRequired} hrs pump</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-between">
                    <span>💧 Drip Saves:</span>
                    <span className="font-bold">
                      {msg.structuredData.savingsWithDripVsFlood.waterSavedLiters.toLocaleString()} L ({msg.structuredData.savingsWithDripVsFlood.waterSavedPct}%)
                    </span>
                  </div>
                </div>
              )}

              {/* Plan Saved / Retrieved Banner Card */}
              {msg.structuredData && msg.activeScenario === 'plan_saved' && (
                <div className="mt-2.5 w-full max-w-[88%] sm:max-w-[84%] p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white block">
                          {msg.structuredData.activePlan ? 'Active Irrigation Plan' : 'Plan Persisted to Amazon DynamoDB'}
                        </span>
                        <span className="text-[10px] text-emerald-300 font-mono">
                          ID: {msg.structuredData.activePlan?.planId || msg.structuredData.planId}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-800/60 text-[10px] font-mono text-white">
                      {msg.structuredData.activePlan?.status || 'CONFIRMED'}
                    </span>
                  </div>

                  {msg.structuredData.activePlan && (
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-emerald-800/40 space-y-2">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Committed Volume:</span>
                        <span className="font-bold font-mono text-cyan-300">{msg.structuredData.activePlan.totalCommittedLiters.toLocaleString()} L</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Strategy:</span>
                        <span className="font-semibold text-emerald-300">{msg.structuredData.activePlan.strategy}</span>
                      </div>
                      {msg.structuredData.activePlan.allocatedPlots && (
                        <div className="border-t border-slate-800 pt-1.5 space-y-1">
                          {msg.structuredData.activePlan.allocatedPlots.map((p: any) => (
                            <div key={p.plotId} className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>🌾 {p.cropName} ({p.irrigationMethod || 'drip'})</span>
                              <span className="font-mono text-white">{p.allocatedLiters?.toLocaleString()} L</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 py-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono">Alexa+ is consulting MCP tools & soil physics...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* QUICK SUGGESTION CHIPS */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { label: '💧 800L Water Budget', query: 'I have 800 Litres of water. Which plot should I irrigate first?' },
            { label: '🔄 Compare Drip vs Flood', query: 'What if I switch from Flood to Drip irrigation?' },
            { label: '💾 Save Confirmed Plan', query: 'Save this irrigation plan for my farm' },
            { label: '📋 View Saved Plan', query: 'Show me my saved irrigation plan' },
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendQuery(chip.query)}
              className="px-2.5 py-1 rounded-full text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* BOTTOM INPUT BAR WITH MICROPHONE */}
        <div className="p-3 sm:p-4 border-t border-sky-500/20 bg-slate-950 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2"
          >
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleMic}
              disabled={!speechSupported}
              className={`p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_#ef4444]'
                  : speechSupported
                  ? 'bg-sky-500/20 hover:bg-sky-500/30 text-cyan-300 border border-sky-500/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title={speechSupported ? (isListening ? 'Listening... (Tap to stop)' : 'Tap to Speak') : 'Speech Recognition not supported in this browser'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? 'Listening to your voice...' : 'Ask Alexa+ (e.g. "I have 800L of water...")'}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
