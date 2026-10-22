'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sprout, 
  Mail, 
  Phone, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Globe, 
  ChevronDown, 
  Check, 
  X,
  Droplets,
  Cpu,
  Server
} from 'lucide-react';
import { 
  sendEmailOtpCode, 
  verifyEmailOtpCode, 
  sendPhoneOtpCode, 
  verifyPhoneOtpCode,
  isSessionValid,
  AuthSession 
} from '../../adapters/cognitoAdapter';
import { SupportedLanguage } from '../../adapters/speechAdapter';
import { ThemeProvider } from '../../components/common/ThemeContext';
import { LanguageProvider, useLanguage } from '../../components/common/LanguageContext';

function LoginPageContent() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  
  // Route guard: Do not display login if already authenticated
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Form State
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Language Dropdown
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is already authenticated
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fieldguard_auth');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as AuthSession;
          if (isSessionValid(parsed)) {
            router.replace('/fields');
            return;
          }
        } catch (e) {}
      }

      // Check if resuming a pending auth flow from sessionStorage
      const rawPending = sessionStorage.getItem('fieldguard_pending_auth');
      if (rawPending) {
        try {
          const parsed = JSON.parse(rawPending);
          if (parsed?.email) {
            setEmail(parsed.email);
            setAuthMethod('email');
            setStep('verify');
            setSuccessNotice(`Resumed verification for ${parsed.email}`);
          }
        } catch (e) {}
      }
      setIsCheckingAuth(false);
    }
  }, [router]);

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

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);
    setIsLoading(true);

    try {
      if (authMethod === 'email') {
        if (!email.includes('@')) {
          setErrorMsg(language === 'hi' ? 'कृपया एक मान्य ईमेल पता दर्ज करें' : language === 'bn' ? 'একটি বৈধ ইমেল ঠিকানা লিখুন' : 'Please enter a valid email address');
          setIsLoading(false);
          return;
        }

        const res = await sendEmailOtpCode(email.trim());
        if (res.success) {
          setStep('verify');
          setResendCooldown(30);
          setSuccessNotice(
            res.isExistingUser
              ? `Verification OTP sent to ${res.destinationMasked}`
              : `New farmer verification code sent to ${res.destinationMasked}`
          );
        } else {
          setErrorMsg(res.error || 'Failed to dispatch verification code');
        }
      } else {
        if (phone.length < 10) {
          setErrorMsg(language === 'hi' ? 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें' : language === 'bn' ? '১০ সংখ্যার মোবাইল নম্বর লিখুন' : 'Please enter a valid 10-digit mobile number');
          setIsLoading(false);
          return;
        }

        const res = await sendPhoneOtpCode(phone.trim());
        if (res.success) {
          setStep('verify');
          setResendCooldown(30);
          setSuccessNotice(`Verification code sent to ${res.destinationMasked} (Evaluation PIN: 123456)`);
        } else {
          setErrorMsg(res.error || 'Failed to send OTP code');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit OTP code');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (authMethod === 'email') {
        const res = await verifyEmailOtpCode(email.trim(), otpCode.trim());
        if (res.success && res.session) {
          router.replace('/fields');
        } else {
          setErrorMsg(res.error || 'Invalid OTP code. Please check and try again.');
        }
      } else {
        const res = await verifyPhoneOtpCode(phone.trim(), otpCode.trim());
        if (res.success && res.session) {
          router.replace('/fields');
        } else {
          setErrorMsg(res.error || 'Invalid OTP code. Please check and try again.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg(null);
    setIsLoading(true);
    try {
      if (authMethod === 'email') {
        const res = await sendEmailOtpCode(email.trim());
        if (res.success) {
          setResendCooldown(30);
          setSuccessNotice(`New code sent to ${res.destinationMasked}`);
        } else {
          setErrorMsg(res.error || 'Failed to resend code');
        }
      } else {
        setResendCooldown(30);
        setSuccessNotice('New SMS OTP sent (Evaluation PIN: 123456)');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not resend code');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="h-9 w-9 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shadow-xs">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#121C15] dark:text-[#F0F4F1] font-['Outfit'] group-hover:text-[#16A34A] transition-colors">
                {t.appName}
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold text-[#16A34A] dark:text-[#4ADE80] px-2 py-0.5 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/25">
                AI Telemetry
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Language Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="px-3 py-1.5 rounded-xl bg-[#F0F4ED] hover:bg-[#E4EBE0] dark:bg-[#1B2720] dark:hover:bg-[#23322A] border border-[#E1E8DE] dark:border-[#2A3E31] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>{language === 'en' ? 'English' : language === 'hi' ? 'हिन्दी' : 'বাংলা'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#2A3E31] shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {[
                    { code: 'en' as SupportedLanguage, label: 'English' },
                    { code: 'hi' as SupportedLanguage, label: 'हिन्दी' },
                    { code: 'bn' as SupportedLanguage, label: 'বাংলা' },
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLanguage(item.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between cursor-pointer ${
                        language === item.code
                          ? 'bg-[#16A34A]/10 text-[#16A34A] dark:text-[#4ADE80]'
                          : 'text-[#121C15] dark:text-[#F0F4F1] hover:bg-[#F0F4ED] dark:hover:bg-[#1B2720]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {language === item.code && <Check className="w-3.5 h-3.5 text-[#16A34A]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

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

      {/* Main Content: Split Screen Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Mission & Trust Value Props */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#16A34A]/10 text-[#16A34A] dark:text-[#4ADE80] border border-[#16A34A]/25">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autonomous Agronomic Decision Cockpit</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#121C15] dark:text-[#F0F4F1] font-['Outfit'] leading-tight">
              Sign In to Your <span className="text-[#16A34A] dark:text-[#4ADE80]">Field Advisor</span>
            </h1>

            <p className="text-sm sm:text-base text-[#526356] dark:text-[#9BAEA0] max-w-lg leading-relaxed">
              Access your calibrated soil-water balance, live Open-Meteo microclimate telemetry, and real-time FAO-56 irrigation advisories.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-xs">
                <div className="font-extrabold text-xl text-[#16A34A] dark:text-[#4ADE80] font-['Outfit']">16,500 L</div>
                <div className="text-xs font-bold text-[#121C15] dark:text-[#F0F4F1] mt-0.5">Avg. Conserved</div>
                <div className="text-[11px] text-[#526356] dark:text-[#9BAEA0] mt-0.5">Per rain avoidance</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-xs">
                <div className="font-extrabold text-xl text-[#0284C7] dark:text-[#38BDF8] font-['Outfit']">Zero IoT</div>
                <div className="text-xs font-bold text-[#121C15] dark:text-[#F0F4F1] mt-0.5">Hardware-Free</div>
                <div className="text-[11px] text-[#526356] dark:text-[#9BAEA0] mt-0.5">Open satellite grids</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-xs">
                <div className="font-extrabold text-xl text-[#D97706] dark:text-[#FBBF24] font-['Outfit']">&lt; 50 ms</div>
                <div className="text-xs font-bold text-[#121C15] dark:text-[#F0F4F1] mt-0.5">Sub-Second</div>
                <div className="text-[11px] text-[#526356] dark:text-[#9BAEA0] mt-0.5">AWS DynamoDB sync</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-[#526356] dark:text-[#9BAEA0]">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span>Passwordless 6-digit OTP verified via Amazon Cognito (ap-south-1 Mumbai)</span>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#141D17] border border-[#E1E8DE] dark:border-[#1F2D24] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 h-48 bg-[#16A34A]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#121C15] dark:text-[#F0F4F1] font-['Outfit']">
                  {step === 'input' ? 'Sign In with OTP' : 'Verify 6-Digit Code'}
                </h2>
                <p className="text-xs text-[#526356] dark:text-[#9BAEA0] mt-1">
                  {step === 'input' 
                    ? 'Enter your mobile number or email to receive a secure login PIN.' 
                    : `Enter the 6-digit confirmation code dispatched to ${authMethod === 'email' ? email : phone}.`}
                </p>
              </div>

              {/* Status & Error Alerts */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {successNotice && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                  {successNotice}
                </div>
              )}

              {/* STEP 1: CONTACT INPUT FORM */}
              {step === 'input' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  {/* Channel Switcher */}
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F0F4ED] dark:bg-[#1B2720] border border-[#E1E8DE] dark:border-[#2A3E31] text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => { setAuthMethod('email'); setErrorMsg(null); }}
                      className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        authMethod === 'email'
                          ? 'bg-white dark:bg-[#141D17] text-[#16A34A] dark:text-[#4ADE80] shadow-xs'
                          : 'text-[#526356] dark:text-[#9BAEA0]'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email OTP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setAuthMethod('phone'); setErrorMsg(null); }}
                      className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        authMethod === 'phone'
                          ? 'bg-white dark:bg-[#141D17] text-[#16A34A] dark:text-[#4ADE80] shadow-xs'
                          : 'text-[#526356] dark:text-[#9BAEA0]'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Mobile OTP (+91)</span>
                    </button>
                  </div>

                  {/* Input Field */}
                  {authMethod === 'email' ? (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#526356] dark:text-[#9BAEA0] mb-1.5">
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#526356] dark:text-[#9BAEA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          autoFocus
                          placeholder="e.g. farmer@fieldguard.in"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] bg-[#F0F4ED] dark:bg-[#1B2720] text-sm text-[#121C15] dark:text-[#F0F4F1] focus:outline-none focus:border-[#16A34A] transition-colors"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#526356] dark:text-[#9BAEA0] mb-1.5">
                        Indian Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#526356] dark:text-[#9BAEA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          autoFocus
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] bg-[#F0F4ED] dark:bg-[#1B2720] text-sm text-[#121C15] dark:text-[#F0F4F1] focus:outline-none focus:border-[#16A34A] transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-[48px] py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Connecting to AWS...</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: OTP VERIFICATION FORM */}
              {step === 'verify' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#526356] dark:text-[#9BAEA0]">
                        Enter 6-Digit PIN
                      </label>
                      <button
                        type="button"
                        onClick={() => { setStep('input'); setOtpCode(''); }}
                        className="text-[11px] text-[#16A34A] dark:text-[#4ADE80] font-semibold hover:underline cursor-pointer"
                      >
                        Change {authMethod}
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#526356] dark:text-[#9BAEA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="• • • • • •"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E1E8DE] dark:border-[#2A3E31] bg-[#F0F4ED] dark:bg-[#1B2720] text-center text-lg font-mono font-bold tracking-[0.5em] text-[#16A34A] dark:text-[#4ADE80] focus:outline-none focus:border-[#16A34A] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[#526356] dark:text-[#9BAEA0]">Didn't receive code?</span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isLoading}
                      onClick={handleResendCode}
                      className="font-bold text-[#16A34A] dark:text-[#4ADE80] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="w-full min-h-[48px] py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying with AWS Cognito...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Enter Dashboard</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Registration Switcher Link */}
              <div className="mt-6 pt-5 border-t border-[#E1E8DE] dark:border-[#1F2D24] text-center">
                <p className="text-xs text-[#526356] dark:text-[#9BAEA0]">
                  New farmer?{' '}
                  <Link
                    href="/register"
                    className="text-[#16A34A] dark:text-[#4ADE80] font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Start Voice-Guided Registration</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

    </div>
  );
}

export default function LoginPage() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LoginPageContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}
