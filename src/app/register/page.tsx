'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sprout, 
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
  AlertCircle,
  X,
  ChevronDown,
  Layers,
  Droplets
} from 'lucide-react';
import { 
  sendEmailOtpCode, 
  verifyEmailOtpCode, 
  sendPhoneOtpCode, 
  verifyPhoneOtpCode,
  isSessionValid,
  AuthSession 
} from '../../adapters/cognitoAdapter';
import { SpeechAdapter, SupportedLanguage, speechService } from '../../adapters/speechAdapter';
import { getDeviceCoordinates } from '../../adapters/geocodingAdapter';
import { ThemeProvider } from '../../components/common/ThemeContext';
import { LanguageProvider, useLanguage } from '../../components/common/LanguageContext';

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

function RegisterPageContent() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  
  // Route Guard
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Wizard Steps: 1 = Language, 2 = Name & Location, 3 = Contact, 4 = OTP Verify
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Voice Speech Controller
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

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
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Language Dropdown
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Route Guard on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fieldguard_auth');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as AuthSession;
          if (isSessionValid(parsed)) {
            router.replace('/');
            return;
          }
        } catch (e) {}
      }
      setIsCheckingAuth(false);
    }
  }, [router]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Click outside listener for language menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    }
    if (isLangDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isLangDropdownOpen]);

  // Helper to play audio prompt
  const playVoicePrompt = (text: string, lang: SupportedLanguage) => {
    if (isVoiceMuted) return;
    speechService.speak(text, lang, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Replay voice for current step
  const handleReplayCurrentStepVoice = () => {
    let scriptText = '';
    if (step === 1) scriptText = SPEECH_SCRIPTS.step1[language];
    else if (step === 2) scriptText = SPEECH_SCRIPTS.step2[language];
    else if (step === 3) scriptText = SPEECH_SCRIPTS.step3[language];
    else if (step === 4) scriptText = SPEECH_SCRIPTS.step4[language];
    playVoicePrompt(scriptText, language);
  };

  // Language selection with immediate voice feedback
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
      setGpsNotice(`GPS coordinates locked: ${coords.lat.toFixed(4)}° N, ${coords.lon.toFixed(4)}° E`);
      if (!villageAddress) {
        setVillageAddress(`Current Field Location (${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)})`);
      }
    } catch (err: any) {
      setGpsNotice('Could not retrieve GPS automatically. Please enter your village or pincode below.');
    } finally {
      setIsDetectingGPS(false);
    }
  };

  // Handle Step 2 -> Step 3
  const handleNextToContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerName.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया अपना नाम दर्ज करें' : language === 'bn' ? 'দয়া করে আপনার নাম লিখুন' : 'Please enter your full name');
      return;
    }
    if (!villageAddress.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया अपना गाँव या पता दर्ज करें' : language === 'bn' ? 'দয়া করে আপনার গ্রাম বা ঠিকানা লিখুন' : 'Please enter your village address or pin code');
      return;
    }

    setErrorMsg(null);
    setStep(3);
    playVoicePrompt(SPEECH_SCRIPTS.step3[language], language);
  };

  // Handle Step 3 -> Step 4 (Send OTP)
  const handleSendContactOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);
    setIsLoading(true);

    try {
      if (contactChannel === 'phone') {
        if (phoneInput.length < 10) {
          setErrorMsg(language === 'hi' ? 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें' : language === 'bn' ? '১০ সংখ্যার মোবাইল নম্বর লিখুন' : 'Please enter a valid 10-digit mobile number');
          setIsLoading(false);
          return;
        }

        const res = await sendPhoneOtpCode(phoneInput.trim());
        if (res.success) {
          setStep(4);
          setResendCooldown(30);
          setSuccessNotice(`SMS OTP sent to ${res.destinationMasked} (Evaluation PIN: 123456)`);
          playVoicePrompt(SPEECH_SCRIPTS.step4[language], language);
        } else {
          setErrorMsg(res.error || 'Failed to dispatch phone verification OTP');
        }
      } else {
        if (!emailInput.includes('@')) {
          setErrorMsg(language === 'hi' ? 'कृपया एक मान्य ईमेल दर्ज करें' : language === 'bn' ? 'একটি বৈধ ইমেল ঠিকানা লিখুন' : 'Please enter a valid email address');
          setIsLoading(false);
          return;
        }

        const res = await sendEmailOtpCode(emailInput.trim());
        if (res.success) {
          setStep(4);
          setResendCooldown(30);
          setSuccessNotice(`AWS Cognito OTP code sent to ${res.destinationMasked}`);
          playVoicePrompt(SPEECH_SCRIPTS.step4[language], language);
        } else {
          setErrorMsg(res.error || 'Failed to dispatch email verification OTP');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 4 (Verify OTP & Complete Registration)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMsg('Please enter the full 6-digit confirmation code');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      let result;
      if (contactChannel === 'phone') {
        result = await verifyPhoneOtpCode(phoneInput.trim(), otpCode.trim(), farmerName.trim());
      } else {
        result = await verifyEmailOtpCode(emailInput.trim(), otpCode.trim(), farmerName.trim());
      }

      if (result.success && result.session) {
        // Save farmer details
        if (typeof window !== 'undefined') {
          localStorage.setItem('fieldguard_farmer_name', farmerName.trim());
          localStorage.setItem('fieldguard_village', villageAddress.trim());
          localStorage.setItem('fieldguard_farmer_lat', String(lat));
          localStorage.setItem('fieldguard_farmer_lon', String(lon));
        }

        playVoicePrompt(SPEECH_SCRIPTS.success[language], language);
        router.replace('/');
      } else {
        setErrorMsg(result.error || 'Invalid 6-digit OTP code. Please re-enter.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAF8] dark:bg-[#0D1310] text-[#121C15] dark:text-[#F0F4F1]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#16A34A] animate-spin" />
          <p className="text-xs font-semibold text-[#526356] dark:text-[#9BAEA0]">Checking session credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAF8] dark:bg-[#0D1310] text-[#121C15] dark:text-[#F0F4F1] transition-colors">
      
      {/* Top Header Bar */}
      <header className="w-full border-b border-[#E1E8DE] dark:border-[#1F2D24] bg-white/95 dark:bg-[#0D1310]/95 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="h-9 w-9 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shadow-xs">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#121C15] dark:text-[#F0F4F1] font-['Outfit'] group-hover:text-[#16A34A] transition-colors">
                {t.appName}
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold text-[#16A34A] dark:text-[#4ADE80] px-2 py-0.5 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/25">
                Voice Onboarding
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            {/* Voice Controller Button */}
            <button
              type="button"
              onClick={() => {
                if (!isVoiceMuted) speechService.stop();
                setIsVoiceMuted(!isVoiceMuted);
              }}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isVoiceMuted
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#16A34A] dark:text-[#4ADE80]'
              }`}
              title={isVoiceMuted ? 'Voice Guide Muted (Click to Unmute)' : 'Voice Guide Active (Click to Mute)'}
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isVoiceMuted ? 'Audio Off' : 'Audio On'}</span>
            </button>

            {/* Back to Home / Close Button */}
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] bg-[#F0F4ED] hover:bg-[#E4EBE0] dark:bg-[#1B2720] dark:hover:bg-[#23322A] text-xs font-bold flex items-center gap-1 text-[#526356] dark:text-[#9BAEA0] hover:text-[#121C15] dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        
        {/* Wizard Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 bg-[#16A34A]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Step Progress & Audio Wave Companion Bar */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E1E8DE] dark:border-[#1F2D24]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#16A34A]/10 text-[#16A34A] dark:text-[#4ADE80] flex items-center justify-center font-bold text-sm">
                {step}/4
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-[#121C15] dark:text-[#F0F4F1] font-['Outfit']">
                  {step === 1 && 'Step 1: Choose Your Language'}
                  {step === 2 && 'Step 2: Farmer Name & Village'}
                  {step === 3 && 'Step 3: Mobile or Email Verification'}
                  {step === 4 && 'Step 4: Confirm 6-Digit OTP'}
                </h1>
                <p className="text-[11px] text-[#526356] dark:text-[#9BAEA0]">
                  {step === 1 && 'भाषा चुनें • ভাষা নির্বাচন করুন'}
                  {step === 2 && 'नाम और गाँव का पता • নাম এবং গ্রামের ঠিকানা'}
                  {step === 3 && 'सत्यापन विवरण • যাচাইকরণ বিবরণ'}
                  {step === 4 && 'ओटीपी सत्यापन • ওটিপি যাচাইকরণ'}
                </p>
              </div>
            </div>

            {/* Replay Audio Guide Button */}
            <button
              type="button"
              onClick={handleReplayCurrentStepVoice}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs animate-pulse'
                  : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#16A34A] dark:text-[#4ADE80]'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeaking ? 'Speaking...' : 'Listen Guide'}</span>
            </button>
          </div>

          {/* Status Alerts */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {successNotice && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              {successNotice}
            </div>
          )}

          {/* STEP 1: LANGUAGE SELECTION */}
          {step === 1 && (
            <div className="space-y-6">
              <p className="text-xs text-[#526356] dark:text-[#9BAEA0]">
                Select your preferred language. All future weather alerts and irrigation advisories will speak in this language.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {[
                  { code: 'en' as SupportedLanguage, label: 'English', sub: 'Indian English Voice' },
                  { code: 'hi' as SupportedLanguage, label: 'हिन्दी', sub: 'हिंदी आवाज' },
                  { code: 'bn' as SupportedLanguage, label: 'বাংলা', sub: 'বাংলা ভয়েস' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleSelectLanguage(item.code)}
                    className={`p-5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      language === item.code
                        ? 'bg-[#16A34A]/15 border-[#16A34A] text-[#16A34A] dark:text-[#4ADE80] shadow-md scale-[1.02]'
                        : 'bg-[#F0F4ED] dark:bg-[#1B2720] border-[#E1E8DE] dark:border-[#2A3E31] text-[#121C15] dark:text-[#F0F4F1] hover:border-[#16A34A]/40'
                    }`}
                  >
                    <span className="text-xl font-bold font-['Outfit']">{item.label}</span>
                    <span className="text-[11px] text-[#526356] dark:text-[#9BAEA0]">{item.sub}</span>
                    {language === item.code && <Check className="w-4 h-4 mt-1 text-[#16A34A]" />}
                  </button>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Link
                  href="/login"
                  className="text-xs text-[#16A34A] dark:text-[#4ADE80] font-semibold hover:underline cursor-pointer"
                >
                  Already registered? Sign In with OTP
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setStep(2);
                    playVoicePrompt(SPEECH_SCRIPTS.step2[language], language);
                  }}
                  className="px-6 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: NAME & VILLAGE LOCATION */}
          {step === 2 && (
            <form onSubmit={handleNextToContact} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#526356] dark:text-[#9BAEA0] mb-1.5">
                  Farmer Full Name / किसान का नाम *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#526356] dark:text-[#9BAEA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Ramesh Chandra / रमेश कुमार"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] bg-[#F0F4ED] dark:bg-[#1B2720] text-sm text-[#121C15] dark:text-[#F0F4F1] focus:outline-none focus:border-[#16A34A] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#526356] dark:text-[#9BAEA0]">
                    Village / District / Tehsil *
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isDetectingGPS}
                    className="text-xs text-[#0284C7] dark:text-[#38BDF8] hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span>{isDetectingGPS ? 'Detecting GPS...' : 'Auto-Detect via GPS'}</span>
                  </button>
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#526356] dark:text-[#9BAEA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bardhaman, Purba Bardhaman / बर्दवान"
                    value={villageAddress}
                    onChange={(e) => setVillageAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] bg-[#F0F4ED] dark:bg-[#1B2720] text-sm text-[#121C15] dark:text-[#F0F4F1] focus:outline-none focus:border-[#16A34A] transition-colors"
                  />
                </div>
                {gpsNotice && (
                  <p className="mt-1 text-[11px] text-[#16A34A] dark:text-[#4ADE80]">{gpsNotice}</p>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between gap-3">
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
                  className="px-6 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: CONTACT INFORMATION */}
          {step === 3 && (
            <form onSubmit={handleSendContactOtp} className="space-y-5">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setContactChannel('phone'); setErrorMsg(null); }}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    contactChannel === 'phone'
                      ? 'bg-white dark:bg-[#141D17] text-[#16A34A] dark:text-[#4ADE80] shadow-xs'
                      : 'text-[#526356] dark:text-[#9BAEA0]'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Mobile OTP (+91)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setContactChannel('email'); setErrorMsg(null); }}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    contactChannel === 'email'
                      ? 'bg-white dark:bg-[#141D17] text-[#16A34A] dark:text-[#4ADE80] shadow-xs'
                      : 'text-[#526356] dark:text-[#9BAEA0]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email OTP</span>
                </button>
              </div>

              {contactChannel === 'phone' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#526356] dark:text-[#9BAEA0] mb-1.5">
                    10-Digit Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#526356] dark:text-[#9BAEA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      autoFocus
                      placeholder="+91 98765 43210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] bg-[#F0F4ED] dark:bg-[#1B2720] text-sm text-[#121C15] dark:text-[#F0F4F1] focus:outline-none focus:border-[#16A34A] transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#526356] dark:text-[#9BAEA0] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#526356] dark:text-[#9BAEA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="farmer@fieldguard.in"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] bg-[#F0F4ED] dark:bg-[#1B2720] text-sm text-[#121C15] dark:text-[#F0F4F1] focus:outline-none focus:border-[#16A34A] transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between gap-3">
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
                      <span>Sending OTP...</span>
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

          {/* STEP 4: OTP VERIFICATION */}
          {step === 4 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#526356] dark:text-[#9BAEA0]">
                    Enter 6-Digit OTP Code
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep(3); setOtpCode(''); }}
                    className="text-xs text-[#16A34A] dark:text-[#4ADE80] font-semibold hover:underline cursor-pointer"
                  >
                    Change Contact
                  </button>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-3 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] bg-[#F0F4ED] dark:bg-[#1B2720] text-center text-lg font-mono font-bold tracking-[0.5em] text-[#16A34A] dark:text-[#4ADE80] focus:outline-none focus:border-[#16A34A] transition-colors"
                />
              </div>

              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] text-xs font-bold text-[#526356] dark:text-[#9BAEA0] hover:bg-[#F0F4ED] dark:hover:bg-[#1B2720] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
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

      </main>

    </div>
  );
}

export default function RegisterPage() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <RegisterPageContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}
