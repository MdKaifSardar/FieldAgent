/**
 * Web Speech API text-to-speech adapter for multilingual farmer advisories.
 * Supported locales:
 * - 'hi': Hindi (hi-IN)
 * - 'bn': Bengali (bn-IN)
 * - 'en': Indian English (en-IN) / English (en-US)
 */

export type SupportedLanguage = 'en' | 'hi' | 'bn';

export interface SpeechStatus {
  isSupported: boolean;
  isSpeaking: boolean;
  activeLanguage: SupportedLanguage;
  availableVoices: SpeechSynthesisVoice[];
  hasNativeVoice: boolean;
}

export class SpeechAdapter {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

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
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.voices.length && this.synth) {
      this.voices = this.synth.getVoices();
    }
    return this.voices;
  }

  /**
   * Finds the best voice for the chosen locale.
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

    // 3. Fallback to English (preferably en-IN or default voice)
    const englishVoice = allVoices.find(v => v.lang.toLowerCase().startsWith('en')) || allVoices[0];
    return { voice: englishVoice || null, isExactMatch: false };
  }

  /**
   * Speaks the text aloud.
   */
  public speak(
    text: string,
    lang: SupportedLanguage,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: string) => void;
    }
  ): { hasNativeVoice: boolean } {
    if (!this.synth) {
      callbacks?.onError?.('Speech synthesis is not supported in this browser.');
      return { hasNativeVoice: false };
    }

    // Stop any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    const { voice, isExactMatch } = this.findBestVoice(lang);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'bn' ? 'bn-IN' : 'en-IN';
    }

    // Pacing optimized for clear outdoor listening
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
    this.synth.speak(utterance);

    return { hasNativeVoice: isExactMatch };
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

// Global singleton instance
export const speechService = new SpeechAdapter();
