'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../common/LanguageContext';
import { SpeechAdapter, SupportedLanguage } from '../../adapters/speechAdapter';
import { 
  sendEmailOtpCode, 
  verifyEmailOtpCode, 
  sendPhoneOtpCode, 
  verifyPhoneOtpCode,
  AuthSession 
} from '../../adapters/cognitoAdapter';
import { getDeviceCoordinates, geocodeLocationQuery } from '../../adapters/geocodingAdapter';
import { 
  Volume2, 
  VolumeX, 
  Globe, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  RefreshCw, 
  Sparkles, 
  LocateFixed,
  AlertCircle
} from 'lucide-react';

interface VoiceOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
  onComplete: (data: {
    farmerName: string;
    villageOrAddress: string;
    latitude: number;
    longitude: number;
    contact: string;
    channel: 'email' | 'phone';
    session: AuthSession;
  }) => void;
}

const SPEECH_SCRIPTS = {
  step1: {
    en: 'Welcome to FieldGuard. Please choose your preferred language to get started.',
    hi: 'फील्डगार्ड में आपका स्वागत है। आगे बढ़ने के लिए अपनी पसंदीदा भाषा चुनें।',
    bn: 'ক্রপপ্লাসে স্বাগতম। শুরু করতে আপনার পছন্দের ভাষা নির্বাচন করুন।',
  },
  step2: {
    en: 'Please enter your full name, and your village address or pincode.',
    hi: 'कृपया अपना पूरा नाम और अपने गाँव का पता या पिन कोड दर्ज करें।',
    bn: 'দয়া করে আপনার পুরো নাম এবং আপনার গ্রামের ঠিকানা বা পিনকোড লিখুন।',
  },
  step3: {
    en: 'Please enter your mobile number or email address for verification.',
    hi: 'सत्यापन के लिए अपना 10 अंकों का मोबाइल नंबर या ईमेल पता दर्ज करें।',
    bn: 'যাচাইকরণের জন্য আপনার মোবাইল নম্বর বা ইমেল ঠিকানা লিখুন।',
  },
  step4: {
    en: 'Please enter the 6-digit verification code sent to your phone or email.',
    hi: 'अपने फोन या ईमेल पर भेजा गया 6 अंकों का सत्यापन कोड दर्ज करें।',
    bn: 'আপনার ফোন বা ইমেলে পাঠানো ৬ সংখ্যার যাচাইকরণ কোডটি লিখুন।',
  },
  success: {
    en: 'Verification successful! Welcome to your precision irrigation dashboard.',
    hi: 'सत्यापन सफल हुआ! आपके सटीक सिंचाई डैशबोर्ड में आपका स्वागत है।',
    bn: 'যাচাইকরণ সফল হয়েছে! আপনার সেচ ড্যাশবোর্ডে স্বাগতম।',
  },
};

export function VoiceOnboardingModal({ isOpen, onClose, onComplete, onSwitchToLogin }: VoiceOnboardingModalProps) {
  const { language, setLanguage, t } = useLanguage();
  
  // Wizard steps: 1 = Language, 2 = Name & Location, 3 = Contact, 4 = OTP Verify
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Voice Speech Controller
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const speechRef = useRef<SpeechAdapter | null>(null);

  // Form Fields
  const [farmerName, setFarmerName] = useState('');
  const [villageAddress, setVillageAddress] = useState('');
  const [lat, setLat] = useState(23.2324);
  const [lon, setLon] = useState(87.8615);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  // Contact & Auth
  const [contactChannel, setContactChannel] = useState<'phone' | 'email'>('phone');
  const [phoneInput, setPhoneInput] = useState('+91 98765 43210');
  const [emailInput, setEmailInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // Status & Timers
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [destinationNotice, setDestinationNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Initialize Speech Adapter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechRef.current = new SpeechAdapter();
    }
  }, []);

  // Play voice guide on step or language transition
  const playVoicePrompt = (text: string, lang: SupportedLanguage) => {
    if (isVoiceMuted || !speechRef.current) return;
    try {
      speechRef.current.speak(text, lang);
    } catch (e) {
      console.warn('Speech error:', e);
    }
  };

  // Trigger speech on step change
  useEffect(() => {
    if (!isOpen) return;

    if (step === 1) {
      playVoicePrompt(SPEECH_SCRIPTS.step1[language], language);
    } else if (step === 2) {
      playVoicePrompt(SPEECH_SCRIPTS.step2[language], language);
    } else if (step === 3) {
      playVoicePrompt(SPEECH_SCRIPTS.step3[language], language);
    } else if (step === 4) {
      playVoicePrompt(SPEECH_SCRIPTS.step4[language], language);
    }
  }, [step, isOpen, isVoiceMuted]);

  // Resend OTP cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Language Change handler
  const handleSelectLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    playVoicePrompt(SPEECH_SCRIPTS.step1[lang], lang);
  };

  // 1-Tap GPS Detect
  const handleDetectGPS = async () => {
    setIsDetectingGPS(true);
    setGpsNotice(null);
    try {
      const coords = await getDeviceCoordinates();
      setLat(coords.lat);
      setLon(coords.lon);
      setGpsNotice(`GPS locked: ${coords.lat.toFixed(4)}° N, ${coords.lon.toFixed(4)}° E`);
      if (!villageAddress) {
        setVillageAddress(`Current Field Location (${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)})`);
      }
    } catch (err: any) {
      setGpsNotice('Could not retrieve GPS. Please type your village or pin code.');
    } finally {
      setIsDetectingGPS(false);
    }
  };

  // Handle Step 2 Submission (Name + Location)
  const handleNextToContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerName.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया अपना नाम दर्ज करें' : language === 'bn' ? 'দয়া করে আপনার নাম লিখুন' : 'Please enter your name');
      return;
    }
    if (!villageAddress.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया अपना गाँव या पता दर्ज करें' : language === 'bn' ? 'দয়া করে आपका গ্রাম বা ঠিকানা লিখুন' : 'Please enter your village address or pin code');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      // Geocode village query if GPS wasn't used
      if (!gpsNotice) {
        const geo = await geocodeLocationQuery(villageAddress.trim());
        setLat(geo.location.latitude);
        setLon(geo.location.longitude);
      }
      setStep(3);
    } catch (err) {
      // Fallback coordinates are preserved
      setStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 3 Submission (Send OTP)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (contactChannel === 'email') {
        if (!emailInput.includes('@')) {
          setErrorMsg('Please enter a valid email address');
          setIsLoading(false);
          return;
        }

        const res = await sendEmailOtpCode(emailInput.trim());
        if (res.success) {
          setDestinationNotice(`AWS Cognito 6-digit verification code sent to ${res.destinationMasked}`);
          setResendCooldown(60);
          setStep(4);
        } else {
          setErrorMsg(res.error || 'Failed to dispatch verification code to email');
        }
      } else {
        // Phone Channel
        const cleanDigits = phoneInput.replace(/\D/g, '');
        if (cleanDigits.length < 10) {
          setErrorMsg('Please enter a valid 10-digit mobile number');
          setIsLoading(false);
          return;
        }

        const res = await sendPhoneOtpCode(phoneInput.trim());
        if (res.success) {
          setDestinationNotice(`SMS OTP dispatched to ${res.destinationMasked} (Evaluation code: 123456)`);
          setResendCooldown(60);
          setStep(4);
        } else {
          setErrorMsg(res.error || 'Failed to dispatch SMS OTP');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 4 Submission (Verify OTP)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      let result;
      if (contactChannel === 'email') {
        result = await verifyEmailOtpCode(emailInput.trim(), cleanCode, farmerName.trim());
      } else {
        result = await verifyPhoneOtpCode(phoneInput.trim(), cleanCode, farmerName.trim());
      }

      if (result.success && result.session) {
        // Play success audio
        playVoicePrompt(SPEECH_SCRIPTS.success[language], language);

        onComplete({
          farmerName: farmerName.trim(),
          villageOrAddress: villageAddress.trim(),
          latitude: lat,
          longitude: lon,
          contact: contactChannel === 'email' ? emailInput.trim() : phoneInput.trim(),
          channel: contactChannel,
          session: result.session,
        });
        onClose();
      } else {
        setErrorMsg(result.error || 'Invalid 6-digit code. Please verify and try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-[#E1E8DE] dark:border-[#1F2D24] bg-white dark:bg-[#141D17] p-5 sm:p-7 shadow-2xl relative my-auto text-[#121C15] dark:text-[#F0F4F1] overflow-hidden">
        
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 bg-[#16A34A]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Voice Controller + Step Progress */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E1E8DE] dark:border-[#1F2D24]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#16A34A]/10 text-[#16A34A] dark:text-[#4ADE80] flex items-center justify-center font-bold text-sm shadow-2xs">
              {step}/4
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#121C15] dark:text-[#F0F4F1] font-['Outfit'] flex items-center gap-1.5">
                <span>Farmer Sign-Up</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] dark:text-[#4ADE80] border border-[#16A34A]/25 font-semibold">
                  Voice-Guided
                </span>
              </h2>
              <p className="text-[11px] text-[#526356] dark:text-[#9BAEA0]">
                {step === 1 && 'Step 1: Choose Language'}
                {step === 2 && 'Step 2: Name & Village Address'}
                {step === 3 && 'Step 3: Mobile or Email Verification'}
                {step === 4 && 'Step 4: 6-Digit OTP Confirmation'}
              </p>
            </div>
          </div>

          {/* Voice Speech Toggle Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (!isVoiceMuted && speechRef.current) {
                  speechRef.current.stop();
                }
                setIsVoiceMuted(!isVoiceMuted);
              }}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isVoiceMuted
                  ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                  : 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#16A34A] dark:text-[#4ADE80] animate-pulse'
              }`}
              title={isVoiceMuted ? 'Voice Guide Muted (Click to Unmute)' : 'Voice Guide Active (Click to Mute)'}
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="text-[10px] hidden sm:inline font-bold">
                {isVoiceMuted ? 'Muted' : 'Voice Active'}
              </span>
            </button>
          </div>
        </div>

        {/* STEP 1: LANGUAGE SELECTION */}
        {step === 1 && (
          <div className="space-y-4 fade-in">
            <div className="text-center py-2">
              <Globe className="w-10 h-10 text-[#16A34A] dark:text-[#4ADE80] mx-auto mb-2" />
              <h3 className="text-lg font-bold text-[#121C15] dark:text-[#F0F4F1] font-['Outfit']">
                Choose Your Language / भाषा चुनें / ভাষা নির্বাচন করুন
              </h3>
              <p className="text-xs text-[#526356] dark:text-[#9BAEA0] mt-1">
                The voice guide and irrigation advisories will speak in your chosen language.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* English */}
              <button
                type="button"
                onClick={() => handleSelectLanguage('en')}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  language === 'en'
                    ? 'bg-[#16A34A]/15 border-[#16A34A] text-[#16A34A] dark:text-[#4ADE80] shadow-md'
                    : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#121C15] dark:text-[#F0F4F1] hover:border-[#16A34A]/40'
                }`}
              >
                <span className="text-xl font-bold font-['Outfit']">English</span>
                <span className="text-[11px] text-[#526356] dark:text-[#9BAEA0]">Indian English</span>
                {language === 'en' && <Check className="w-4 h-4 mt-1 text-[#16A34A]" />}
              </button>

              {/* Hindi */}
              <button
                type="button"
                onClick={() => handleSelectLanguage('hi')}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  language === 'hi'
                    ? 'bg-[#16A34A]/15 border-[#16A34A] text-[#16A34A] dark:text-[#4ADE80] shadow-md'
                    : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#121C15] dark:text-[#F0F4F1] hover:border-[#16A34A]/40'
                }`}
              >
                <span className="text-xl font-bold font-['Outfit']">हिंदी</span>
                <span className="text-[11px] text-[#526356] dark:text-[#9BAEA0]">हिन्दी आवाज़</span>
                {language === 'hi' && <Check className="w-4 h-4 mt-1 text-[#16A34A]" />}
              </button>

              {/* Bengali */}
              <button
                type="button"
                onClick={() => handleSelectLanguage('bn')}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  language === 'bn'
                    ? 'bg-[#16A34A]/15 border-[#16A34A] text-[#16A34A] dark:text-[#4ADE80] shadow-md'
                    : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#121C15] dark:text-[#F0F4F1] hover:border-[#16A34A]/40'
                }`}
              >
                <span className="text-xl font-bold font-['Outfit']">বাংলা</span>
                <span className="text-[11px] text-[#526356] dark:text-[#9BAEA0]">বাংলা ভয়েস</span>
                {language === 'bn' && <Check className="w-4 h-4 mt-1 text-[#16A34A]" />}
              </button>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              {onSwitchToLogin ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToLogin();
                  }}
                  className="text-xs text-[#16A34A] dark:text-[#4ADE80] font-semibold hover:underline cursor-pointer"
                >
                  Already registered? Sign In with OTP
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: NAME & VILLAGE ADDRESS */}
        {step === 2 && (
          <form onSubmit={handleNextToContact} className="space-y-4 fade-in">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#526356] dark:text-[#9BAEA0] mb-1.5">
                Farmer Full Name / किसान का नाम *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#526356] dark:text-[#9BAEA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra / रमेश कुमार"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] bg-[#F0F4ED] dark:bg-[#1B2720] text-[#121C15] dark:text-[#F0F4F1] text-sm focus:outline-none focus:border-[#16A34A] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#526356] dark:text-[#9BAEA0]">
                  Village / City / Pin Code / गाँव का नाम *
                </label>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isDetectingGPS}
                  className="text-xs font-semibold text-[#0284C7] dark:text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>{isDetectingGPS ? 'Detecting...' : 'Detect GPS'}</span>
                </button>
              </div>

              <div className="relative">
                <MapPin className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Kumrokhali, South 24 Parganas, 700103"
                  value={villageAddress}
                  onChange={(e) => setVillageAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] bg-[#F0F4ED] dark:bg-[#1B2720] text-[#121C15] dark:text-[#F0F4F1] text-sm focus:outline-none focus:border-[#16A34A] transition-colors"
                />
              </div>
              {gpsNotice && (
                <p className="text-[11px] text-[#16A34A] dark:text-[#4ADE80] mt-1 font-medium">
                  ✓ {gpsNotice}
                </p>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] text-xs font-bold text-[#526356] dark:text-[#9BAEA0] hover:bg-[#F0F4ED] dark:hover:bg-[#1B2720] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Processing...' : 'Next: Verification'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: CONTACT IDENTIFIER (MOBILE OR EMAIL) */}
        {step === 3 && (
          <form onSubmit={handleSendOtp} className="space-y-4 fade-in">
            {/* Channel Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31]">
              <button
                type="button"
                onClick={() => { setContactChannel('phone'); setErrorMsg(null); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  contactChannel === 'phone'
                    ? 'bg-white dark:bg-[#141D17] text-[#16A34A] dark:text-[#4ADE80] shadow-xs'
                    : 'text-[#526356] dark:text-[#9BAEA0]'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Mobile (+91)</span>
              </button>

              <button
                type="button"
                onClick={() => { setContactChannel('email'); setErrorMsg(null); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  contactChannel === 'email'
                    ? 'bg-white dark:bg-[#141D17] text-[#16A34A] dark:text-[#4ADE80] shadow-xs'
                    : 'text-[#526356] dark:text-[#9BAEA0]'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Address</span>
              </button>
            </div>

            {contactChannel === 'phone' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#526356] dark:text-[#9BAEA0] mb-1.5">
                  Mobile Number / मोबाइल नंबर *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] bg-[#F0F4ED] dark:bg-[#1B2720] text-[#121C15] dark:text-[#F0F4F1] text-sm focus:outline-none focus:border-[#16A34A] transition-colors"
                  />
                </div>
                <p className="text-[11px] text-[#526356] dark:text-[#9BAEA0] mt-1">
                  We will send a 6-digit SMS OTP to verify your account.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#526356] dark:text-[#9BAEA0] mb-1.5">
                  Email Address / ईमेल पता *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="farmer@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] bg-[#F0F4ED] dark:bg-[#1B2720] text-[#121C15] dark:text-[#F0F4F1] text-sm focus:outline-none focus:border-[#16A34A] transition-colors"
                  />
                </div>
                <p className="text-[11px] text-[#526356] dark:text-[#9BAEA0] mt-1">
                  AWS Cognito will send a 6-digit verification code to your inbox.
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] text-xs font-bold text-[#526356] dark:text-[#9BAEA0] hover:bg-[#F0F4ED] dark:hover:bg-[#1B2720] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: 6-DIGIT OTP VERIFICATION */}
        {step === 4 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 fade-in">
            {destinationNotice && (
              <div className="p-3 rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/30 text-xs text-[#16A34A] dark:text-[#4ADE80] font-medium flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{destinationNotice}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#526356] dark:text-[#9BAEA0] mb-1.5 text-center">
                Enter 6-Digit OTP / सत्यापन कोड दर्ज करें *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="• • • • • •"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full py-3.5 text-center font-mono text-2xl tracking-[0.5em] font-bold rounded-2xl border border-[#E1E8DE] dark:border-[#2A3E31] bg-[#F0F4ED] dark:bg-[#1B2720] text-[#121C15] dark:text-[#F0F4F1] focus:outline-none focus:border-[#16A34A] transition-colors"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-[#526356] dark:text-[#9BAEA0]">
              <span>Didn't receive the code?</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || isLoading}
                onClick={handleSendOtp}
                className="font-bold text-[#16A34A] dark:text-[#4ADE80] hover:underline cursor-pointer disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>

            <div className="pt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] text-xs font-bold text-[#526356] dark:text-[#9BAEA0] hover:bg-[#F0F4ED] dark:hover:bg-[#1B2720] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Contact</span>
              </button>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="px-6 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Enter Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
