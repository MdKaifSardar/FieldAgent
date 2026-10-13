/**
 * Dual-Engine Hybrid Text-to-Speech (TTS) Adapter for Multilingual Farmer Advisories.
 * 
 * Architecture:
 * 1. Cloud Tier: Amazon Polly (Neural "Kajal" / Standard "Aditi"/"Raveena") for Hindi ('hi') and Indian English ('en')
 * 2. Edge Tier: Web Speech API (window.speechSynthesis) for Bengali ('bn') and offline/low-bandwidth fallback.
 * 
 * Features:
 * - In-memory audio caching for instant replay & zero AWS cost duplication
 * - Seamless automatic failover to Web Speech API if offline or AWS quota exceeded
 * - Chromium synthesis unsticking & memory-safe ObjectURL revocation
 */

export type SupportedLanguage = 'en' | 'hi' | 'bn';

export interface SpeechStatus {
  isSupported: boolean;
  isSpeaking: boolean;
  activeLanguage: SupportedLanguage;
  availableVoices: SpeechSynthesisVoice[];
  hasNativeVoice: boolean;
}

export interface SpeechCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export class SpeechAdapter {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  // Polly Audio Player state
  private currentAudio: HTMLAudioElement | null = null;
  private currentObjectUrl: string | null = null;
  private isAudioPlaying = false;
  private activeAbortController: AbortController | null = null;

  // In-memory cache for audio blobs: "lang:text" -> Blob
  private audioCache = new Map<string, Blob>();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    this.isInitialized = true;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && ('speechSynthesis' in window || 'Audio' in window);
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.voices.length && this.synth) {
      this.voices = this.synth.getVoices();
    }
    return this.voices;
  }

  /**
   * Finds the best browser voice for the chosen locale (used for Bengali and offline fallback).
   */
  public findBestVoice(lang: SupportedLanguage): { voice: SpeechSynthesisVoice | null; isExactMatch: boolean } {
    const allVoices = this.getAvailableVoices();
    if (!allVoices.length) return { voice: null, isExactMatch: false };

    const targetPrefix = lang === 'hi' ? 'hi' : lang === 'bn' ? 'bn' : 'en';

    // 1. Look for exact locale match (e.g. hi-IN, bn-IN, en-IN)
    const exactTag = lang === 'hi' ? 'hi-in' : lang === 'bn' ? 'bn-in' : 'en-in';
    const exactMatch = allVoices.find(v => v.lang.toLowerCase().replace('_', '-') === exactTag);
    if (exactMatch) return { voice: exactMatch, isExactMatch: true };

    // 2. Look for general language prefix (e.g. hi-*, bn-*)
    const prefixMatch = allVoices.find(v => v.lang.toLowerCase().startsWith(targetPrefix));
    if (prefixMatch) return { voice: prefixMatch, isExactMatch: true };

    // 3. Fallback to English
    const englishVoice = allVoices.find(v => v.lang.toLowerCase().startsWith('en')) || allVoices[0];
    return { voice: englishVoice || null, isExactMatch: false };
  }

  /**
   * Speaks the text aloud using Amazon Polly (for Hindi & English) with automatic Web Speech fallback.
   * Bengali ('bn') is routed directly to Web Speech API as Amazon Polly has no native Bengali voice.
   */
  public speak(
    text: string,
    lang: SupportedLanguage,
    callbacks?: SpeechCallbacks
  ): { hasNativeVoice: boolean } {
    // Stop all current audio & speech synthesis
    this.stop();

    if (!text || !text.trim()) {
      callbacks?.onError?.('No text provided to speak.');
      return { hasNativeVoice: false };
    }

    // Route Bengali directly to browser Web Speech API for authentic Bengali phonetics
    if (lang === 'bn') {
      return this.speakWebSpeech(text, lang, callbacks);
    }

    // For Hindi and English, attempt high-fidelity Amazon Polly first
    const cacheKey = `${lang}:${text.trim()}`;
    const cachedBlob = this.audioCache.get(cacheKey);

    if (cachedBlob) {
      this.playAudioBlob(cachedBlob, callbacks, () => {
        // Fallback if audio playback fails
        this.speakWebSpeech(text, lang, callbacks);
      });
      return { hasNativeVoice: true };
    }

    // Fetch from Amazon Polly route asynchronously
    this.activeAbortController = new AbortController();
    const abortSignal = this.activeAbortController.signal;

    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
      signal: abortSignal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`TTS server responded with ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await response.json();
          if (json.fallback) {
            // Server recommended browser fallback
            this.speakWebSpeech(text, lang, callbacks);
            return;
          }
        }

        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error('Received empty audio stream');
        }

        // Cache for replay efficiency (keep max 30 entries)
        if (this.audioCache.size > 30) {
          const firstKey = this.audioCache.keys().next().value;
          if (firstKey) this.audioCache.delete(firstKey);
        }
        this.audioCache.set(cacheKey, blob);

        // Play the audio
        this.playAudioBlob(blob, callbacks, () => {
          this.speakWebSpeech(text, lang, callbacks);
        });
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          // Speak was cancelled by user
          return;
        }
        console.warn('Polly TTS fetch failed, falling back to Web Speech API:', err.message);
        this.speakWebSpeech(text, lang, callbacks);
      });

    return { hasNativeVoice: true };
  }

  /**
   * Plays an audio blob via HTMLAudioElement
   */
  private playAudioBlob(
    blob: Blob,
    callbacks?: SpeechCallbacks,
    onFallbackError?: () => void
  ) {
    try {
      this.cleanupCurrentAudio();

      const objectUrl = URL.createObjectURL(blob);
      this.currentObjectUrl = objectUrl;

      const audio = new Audio(objectUrl);
      this.currentAudio = audio;
      this.isAudioPlaying = true;

      audio.onplay = () => {
        callbacks?.onStart?.();
      };

      audio.onended = () => {
        this.cleanupCurrentAudio();
        callbacks?.onEnd?.();
      };

      audio.onerror = (e) => {
        console.warn('Audio element error, falling back:', e);
        this.cleanupCurrentAudio();
        if (onFallbackError) {
          onFallbackError();
        } else {
          callbacks?.onError?.('Audio playback failed');
        }
      };

      audio.play().catch((playErr) => {
        console.warn('Audio play() promise rejected:', playErr);
        this.cleanupCurrentAudio();
        if (onFallbackError) {
          onFallbackError();
        } else {
          callbacks?.onError?.('Audio play blocked or failed');
        }
      });
    } catch (err: any) {
      console.warn('Error initializing audio blob playback:', err);
      this.cleanupCurrentAudio();
      if (onFallbackError) {
        onFallbackError();
      } else {
        callbacks?.onError?.(err?.message || 'Audio playback initialization error');
      }
    }
  }

  /**
   * Fallback engine: On-device Web Speech API
   */
  private speakWebSpeech(
    text: string,
    lang: SupportedLanguage,
    callbacks?: SpeechCallbacks
  ): { hasNativeVoice: boolean } {
    if (!this.synth) {
      callbacks?.onError?.('Speech synthesis is not supported on this device.');
      return { hasNativeVoice: false };
    }

    // Unstick paused speech synthesis queue in Chromium
    if (this.synth.paused) {
      try { this.synth.resume(); } catch (e) {}
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const { voice, isExactMatch } = this.findBestVoice(lang);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'bn' ? 'bn-IN' : 'en-IN';
    }

    // Pacing optimized for outdoor rural listening
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      callbacks?.onError?.(`Speech synthesis error: ${e.error}`);
    };

    this.currentUtterance = utterance;

    try {
      this.synth.speak(utterance);
      if (this.synth.paused) {
        this.synth.resume();
      }
    } catch (speakErr) {
      console.warn('Speech synthesis speak error:', speakErr);
    }

    return { hasNativeVoice: isExactMatch };
  }

  private cleanupCurrentAudio() {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.removeAttribute('src');
      this.currentAudio.load();
      this.currentAudio = null;
    }
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
    this.isAudioPlaying = false;
  }

  /**
   * Immediately silences both Polly audio and Web Speech synthesis.
   */
  public stop() {
    this.cleanupCurrentAudio();

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    const isSynthSpeaking = this.synth ? this.synth.speaking : false;
    return this.isAudioPlaying || isSynthSpeaking;
  }
}

// Global singleton instance
export const speechService = new SpeechAdapter();
