'use client';

import React, { useState } from 'react';
import { 
  sendEmailOtpCode, 
  verifyEmailOtpCode, 
  verifyPhoneOtpCode,
  AuthSession 
} from '../../adapters/cognitoAdapter';
import { Mail, Phone, Lock, X, Check, AlertCircle, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (session: AuthSession) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  if (!isOpen) return null;

  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (authMethod === 'email') {
        if (!email.includes('@')) {
          setErrorMsg('Please enter a valid email address');
          setIsLoading(false);
          return;
        }

        const res = await sendEmailOtpCode(email.trim());
        if (res.success) {
          setStep('verify');
          setSuccessNotice(`AWS Cognito verification code sent to ${email}`);
        } else {
          setErrorMsg(res.error || 'Failed to send OTP code');
        }
      } else {
        // Phone verification
        if (phone.length < 10) {
          setErrorMsg('Please enter a valid 10-digit mobile number');
          setIsLoading(false);
          return;
        }
        setStep('verify');
        setSuccessNotice(`SMS OTP sent to ${phone} (Demo Code: 123456)`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMsg('Please enter the full 6-digit OTP code');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (authMethod === 'email') {
        const res = await verifyEmailOtpCode(email.trim(), otpCode.trim());
        if (res.success && res.session) {
          onAuthSuccess(res.session);
          onClose();
        } else {
          setErrorMsg(res.error || 'Invalid OTP code');
        }
      } else {
        const res = await verifyPhoneOtpCode(phone.trim(), otpCode.trim());
        if (res.success && res.session) {
          onAuthSuccess(res.session);
          onClose();
        } else {
          setErrorMsg(res.error || 'Invalid OTP code');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-[#E1E6DE] dark:border-[#1E3022] bg-[#F7F8F3] dark:bg-[#0E1711] p-5 sm:p-6 shadow-2xl relative my-auto text-[#111C15] dark:text-[#ECF2EC]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E1E6DE] dark:border-[#1E3022]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#52B788]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-[#111C15] dark:text-[#ECF2EC] font-['Outfit']">
                  Farmer Sign In
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D97706]/10 text-[#92400E] dark:text-[#FCD34D] border border-[#D97706]/30 font-semibold flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> AWS Cognito
                </span>
              </div>
              <p className="text-[11px] text-[#526356] dark:text-[#8FA394]">
                Passwordless 6-Digit OTP Verification
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#526356] dark:text-[#8FA394] hover:text-[#111C15] dark:hover:text-white hover:bg-[#EAEFE8] dark:hover:bg-[#152319] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Method Tabs */}
        {step === 'input' && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              onClick={() => { setAuthMethod('email'); setErrorMsg(null); }}
              className={`min-h-[44px] py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMethod === 'email'
                  ? 'bg-[#2D6A4F]/15 border-[#2D6A4F] text-[#1B4332] dark:text-[#74C69D]'
                  : 'bg-white dark:bg-[#121E15] border-[#E1E6DE] dark:border-[#1E3022] text-[#526356] dark:text-[#8FA394]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email OTP</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('phone'); setErrorMsg(null); }}
              className={`min-h-[44px] py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMethod === 'phone'
                  ? 'bg-[#2D6A4F]/15 border-[#2D6A4F] text-[#1B4332] dark:text-[#74C69D]'
                  : 'bg-white dark:bg-[#121E15] border-[#E1E6DE] dark:border-[#1E3022] text-[#526356] dark:text-[#8FA394]'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile Phone</span>
            </button>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-[#E5484D]/10 border border-[#E5484D]/30 text-xs text-[#C92A2A] dark:text-[#FFA8A8] flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 text-[#E5484D] shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success / sent notification */}
        {successNotice && (
          <div className="mt-3 p-2.5 rounded-lg bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 text-xs text-[#1B4332] dark:text-[#74C69D] flex items-start gap-1.5">
            <Check className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* STEP 1: INPUT FORM */}
        {step === 'input' && (
          <form onSubmit={handleSendCode} className="space-y-4 mt-4">
            {authMethod === 'email' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#526356] dark:text-[#8FA394] uppercase tracking-wider">
                  Farmer / Extension Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8FA394] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#121E15] border border-[#D5DFD3] dark:border-[#223828] text-sm text-[#111C15] dark:text-[#ECF2EC] focus:outline-none focus:border-[#2D6A4F]"
                  />
                </div>
                <p className="text-[10px] text-[#526356] dark:text-[#8FA394]">
                  AWS Cognito will send a real 6-digit confirmation code to this address.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#526356] dark:text-[#8FA394] uppercase tracking-wider">
                  10-Digit Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8FA394] absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#121E15] border border-[#D5DFD3] dark:border-[#223828] text-sm text-[#111C15] dark:text-[#ECF2EC] focus:outline-none focus:border-[#2D6A4F]"
                  />
                </div>
                <p className="text-[10px] text-[#526356] dark:text-[#8FA394]">
                  India mobile format (+91).
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] py-3 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to AWS...</span>
                </>
              ) : (
                <span>Send 6-Digit OTP Code</span>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFICATION FORM */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyCode} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#526356] dark:text-[#8FA394] uppercase tracking-wider flex items-center justify-between">
                <span>Enter 6-Digit Verification Code</span>
                <button
                  type="button"
                  onClick={() => { setStep('input'); setOtpCode(''); }}
                  className="text-[11px] text-[#2D6A4F] dark:text-[#52B788] hover:underline"
                >
                  Change {authMethod}
                </button>
              </label>

              <div className="relative">
                <Lock className="w-4 h-4 text-[#8FA394] absolute left-3 top-3" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#121E15] border border-[#D5DFD3] dark:border-[#223828] text-lg tracking-[0.5em] font-mono text-center text-[#2D6A4F] dark:text-[#52B788] font-bold focus:outline-none focus:border-[#2D6A4F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full min-h-[48px] py-3 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying with AWS Cognito...</span>
                </>
              ) : (
                <span>Verify & Access Farm Account</span>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
