import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Phone, Lock, User, ArrowRight, ShieldCheck, Sparkles, KeyRound } from 'lucide-react';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, defaultMode = 'signin', onSuccess }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, sendOtp, verifyOtp } = useCustomerAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [method, setMethod] = useState<'otp' | 'password'>('password');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // OTP state
  const [otpStep, setOtpStep] = useState<'input' | 'verify'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [otpTarget, setOtpTarget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setOtpCode('');
    setOtpStep('input');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 1. Email + Password Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password');
      return;
    }
    setIsSubmitting(true);
    const res = await signInWithEmail(email, password);
    setIsSubmitting(false);
    if (res.success) {
      handleClose();
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.error || 'Failed to sign in');
    }
  };

  // 2. Email + Password Sign Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsSubmitting(true);
    const res = await signUpWithEmail(email, password, fullName, phone);
    setIsSubmitting(false);
    if (res.success) {
      handleClose();
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.error || 'Failed to create account');
    }
  };

  // 3. Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = phone.trim() || email.trim();
    if (!target) {
      toast.error('Please enter your mobile number or email');
      return;
    }
    setIsSubmitting(true);
    const res = await sendOtp(target);
    setIsSubmitting(false);
    if (res.success) {
      setOtpTarget(target);
      setOtpStep('verify');
    } else {
      toast.error(res.error || 'Could not send OTP');
    }
  };

  // 4. Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      toast.error('Please enter the verification code');
      return;
    }
    setIsSubmitting(true);
    const res = await verifyOtp(otpTarget, otpCode);
    setIsSubmitting(false);
    if (res.success) {
      handleClose();
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.error || 'Invalid OTP code');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-gray-100"
        >
          {/* Top Banner (Myntra / Luxury brand aesthetic) */}
          <div className="bg-gradient-to-r from-[#698156] via-[#546944] to-[#435436] p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" /> Aanya Club Member
            </div>
            <h2 className="font-serif text-2xl font-bold">
              {mode === 'signin' ? 'Welcome to Aanya' : 'Create Your Account'}
            </h2>
            <p className="text-white/80 text-xs mt-1">
              Unlock personalized recommendations, tracking & exclusive offers
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/80">
            <button
              onClick={() => { setMode('signin'); setOtpStep('input'); }}
              className={`flex-1 py-3 text-xs font-bold transition-all text-center cursor-pointer ${
                mode === 'signin'
                  ? 'text-[#698156] border-b-2 border-[#698156] bg-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setOtpStep('input'); }}
              className={`flex-1 py-3 text-xs font-bold transition-all text-center cursor-pointer ${
                mode === 'signup'
                  ? 'text-[#698156] border-b-2 border-[#698156] bg-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              New Customer? Sign Up
            </button>
          </div>

          <div className="p-6">
            {/* Method Toggle (OTP vs Password) */}
            <div className="flex items-center justify-center gap-2 mb-5">
              <button
                type="button"
                onClick={() => { setMethod('password'); setOtpStep('input'); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                  method === 'password'
                    ? 'bg-[#698156] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => { setMethod('otp'); setOtpStep('input'); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                  method === 'otp'
                    ? 'bg-[#698156] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Phone / OTP Login
              </button>
            </div>

            {/* OTP FLOW */}
            {method === 'otp' && (
              <div>
                {otpStep === 'input' ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Mobile Number or Email
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. 9876543210 or you@domain.com"
                          value={phone || email}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.includes('@')) {
                              setEmail(val);
                              setPhone('');
                            } else {
                              setPhone(val);
                              setEmail('');
                            }
                          }}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        We will send a 6-digit verification code to this number/email.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-[#698156] to-[#546944] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-[#698156]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending Code...' : 'Send Verification OTP'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center py-2">
                      <div className="w-12 h-12 rounded-full bg-[#F4F6F2] border border-[#DCE4D7] text-[#698156] flex items-center justify-center mx-auto mb-2">
                        <KeyRound className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-gray-600">Enter code sent to</p>
                      <p className="text-xs font-bold text-gray-900">{otpTarget}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 text-center">
                        6-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={8}
                        placeholder="••••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full text-center tracking-[0.5em] text-lg font-black py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => setOtpStep('input')}
                        className="text-gray-500 hover:text-gray-800 underline cursor-pointer"
                      >
                        Change number
                      </button>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[#698156] font-bold hover:underline cursor-pointer"
                      >
                        Resend Code
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-[#698156] to-[#546944] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-[#698156]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* PASSWORD FLOW - SIGN IN */}
            {method === 'password' && mode === 'signin' && (
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-[#698156] to-[#546944] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-[#698156]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In with Password'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* PASSWORD FLOW - SIGN UP */}
            {method === 'password' && mode === 'signup' && (
              <form onSubmit={handleEmailSignUp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Radhika Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Mobile Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-[#698156] to-[#546944] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-[#698156]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Footer Trust Info */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#698156]" />
              <span>100% Secure & Encrypted by Aanya Fashions</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
