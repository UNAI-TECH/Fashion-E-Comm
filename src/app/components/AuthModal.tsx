import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Phone, Lock, User, ArrowRight, ShieldCheck, Sparkles, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useCustomerAuth, SignupFormData } from '../contexts/CustomerAuthContext';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, defaultMode = 'signin', onSuccess }: AuthModalProps) {
  const {
    signInWithEmail,
    sendEmailOtp,
    verifyEmailOtp,
    sendSignupOtp,
    verifySignupOtp,
  } = useCustomerAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [signInMethod, setSignInMethod] = useState<'password' | 'otp'>('password');

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInOtpStep, setSignInOtpStep] = useState<'email' | 'otp'>('email');
  const [signInOtpCode, setSignInOtpCode] = useState('');

  // Sign Up state
  const [signupForm, setSignupForm] = useState<SignupFormData & { confirmPassword: string }>({
    fullName: '',
    phone: '',
    gender: 'Female',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form');
  const [signupOtpCode, setSignupOtpCode] = useState('');

  // General state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Synchronize default mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
    }
  }, [isOpen, defaultMode]);

  // Live cooldown interval
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  if (!isOpen) return null;

  const resetAll = () => {
    setSignInEmail('');
    setSignInPassword('');
    setSignInOtpStep('email');
    setSignInOtpCode('');
    setSignupForm({
      fullName: '',
      phone: '',
      gender: 'Female',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setSignupStep('form');
    setSignupOtpCode('');
    setIsSubmitting(false);
    setCooldown(0);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // 1. Sign In with Password
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword.trim()) {
      toast.error('Please enter your email and password');
      return;
    }
    setIsSubmitting(true);
    const res = await signInWithEmail(signInEmail, signInPassword);
    setIsSubmitting(false);
    if (res.success) {
      handleClose();
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.error || 'Invalid email or password');
    }
  };

  // 2. Send Login Email OTP
  const handleSendLoginOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown} seconds before requesting a new code.`);
      return;
    }
    const clean = signInEmail.trim();
    if (!clean || !clean.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsSubmitting(true);
    const res = await sendEmailOtp(clean);
    setIsSubmitting(false);
    if (res.success) {
      setSignInOtpStep('otp');
      setCooldown(30);
    } else {
      toast.error(res.error || 'Failed to dispatch login OTP');
    }
  };

  // 3. Verify Login Email OTP
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInOtpCode.trim() || signInOtpCode.trim().length < 4) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    setIsSubmitting(true);
    const res = await verifyEmailOtp(signInEmail.trim(), signInOtpCode.trim());
    setIsSubmitting(false);
    if (res.success) {
      handleClose();
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.error || 'Invalid or expired OTP code');
    }
  };

  // 4. Send Signup OTP (Validates full form: name, phone, gender, email, password, confirmPassword)
  const handleSendSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validations
    if (!signupForm.fullName.trim()) {
      toast.error('Please enter your Full Name');
      return;
    }

    const cleanPhone = signupForm.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!signupForm.gender) {
      toast.error('Please select your Gender');
      return;
    }

    const cleanEmail = signupForm.email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast.error('Please enter a valid Email ID');
      return;
    }

    if (signupForm.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      toast.error('Passwords do not match. Please re-enter your password');
      return;
    }

    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown} seconds before requesting another code.`);
      return;
    }

    setIsSubmitting(true);
    const res = await sendSignupOtp({
      fullName: signupForm.fullName.trim(),
      phone: cleanPhone,
      gender: signupForm.gender,
      email: cleanEmail,
      password: signupForm.password,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSignupStep('otp');
      setCooldown(30);
    } else {
      toast.error(res.error || 'Failed to dispatch verification email');
    }
  };

  // 5. Verify Signup OTP (Authoritative: does NOT sign up if OTP is wrong!)
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupOtpCode.trim() || signupOtpCode.trim().length < 4) {
      toast.error('Please enter the 6-digit verification code sent to your email');
      return;
    }

    setIsSubmitting(true);
    const cleanPhone = signupForm.phone.replace(/\D/g, '');
    const res = await verifySignupOtp(
      {
        fullName: signupForm.fullName.trim(),
        phone: cleanPhone,
        gender: signupForm.gender,
        email: signupForm.email.trim(),
        password: signupForm.password,
      },
      signupOtpCode.trim()
    );
    setIsSubmitting(false);

    if (res.success) {
      handleClose();
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.error || 'Invalid or expired OTP. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
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
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-gray-100 my-auto"
        >
          {/* Top Banner (Luxury Brand Aesthetic) */}
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
              {mode === 'signin' ? 'Welcome to Aanya Fashions' : 'Create Your Customer Account'}
            </h2>
            <p className="text-white/80 text-xs mt-1">
              {mode === 'signin'
                ? 'Sign in to access your orders, saved wishlist & checkout'
                : 'Fill in your details and verify your email via secure OTP'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/80">
            <button
              onClick={() => {
                setMode('signin');
                setSignInOtpStep('email');
              }}
              className={`flex-1 py-3 text-xs font-bold transition-all text-center cursor-pointer ${
                mode === 'signin'
                  ? 'text-[#698156] border-b-2 border-[#698156] bg-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setSignupStep('form');
              }}
              className={`flex-1 py-3 text-xs font-bold transition-all text-center cursor-pointer ${
                mode === 'signup'
                  ? 'text-[#698156] border-b-2 border-[#698156] bg-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              New Customer? Sign Up
            </button>
          </div>

          <div className="p-6 max-h-[75vh] overflow-y-auto">
            {/* ═══════════════════════════════════════════════════════════
                MODE: SIGN IN (Password or Email OTP Login)
               ═══════════════════════════════════════════════════════════ */}
            {mode === 'signin' && (
              <div>
                {/* Method Toggle: Password vs Email OTP */}
                <div className="flex items-center justify-center gap-2 mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setSignInMethod('password');
                      setSignInOtpStep('email');
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                      signInMethod === 'password'
                        ? 'bg-[#698156] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Password Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignInMethod('otp');
                      setSignInOtpStep('email');
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                      signInMethod === 'otp'
                        ? 'bg-[#698156] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Email OTP Login
                  </button>
                </div>

                {/* SIGN IN: PASSWORD METHOD */}
                {signInMethod === 'password' && (
                  <form onSubmit={handlePasswordSignIn} className="space-y-4">
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
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
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
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-[#698156] to-[#546944] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-[#698156]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Signing in...' : 'Sign In with Password'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* SIGN IN: EMAIL OTP METHOD */}
                {signInMethod === 'otp' && (
                  <div>
                    {signInOtpStep === 'email' ? (
                      <form onSubmit={handleSendLoginOtp} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Enter Your Registered Email ID
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="email"
                              required
                              placeholder="you@domain.com"
                              value={signInEmail}
                              onChange={(e) => setSignInEmail(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                            />
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1.5">
                            We will send a 6-digit login OTP code directly to your email inbox via SMTP.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3.5 bg-gradient-to-r from-[#698156] to-[#546944] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-[#698156]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? 'Dispatching Code...' : 'Send Login OTP'}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
                        <div className="text-center py-2">
                          <div className="w-12 h-12 rounded-full bg-[#F4F6F2] border border-[#DCE4D7] text-[#698156] flex items-center justify-center mx-auto mb-2">
                            <KeyRound className="w-6 h-6" />
                          </div>
                          <p className="text-xs text-gray-600">Verification code sent to email:</p>
                          <p className="text-xs font-bold text-gray-900">{signInEmail}</p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 text-center">
                            6-Digit Email OTP Code
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="••••••"
                            value={signInOtpCode}
                            onChange={(e) => setSignInOtpCode(e.target.value)}
                            className="w-full text-center tracking-[0.5em] text-lg font-black py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <button
                            type="button"
                            onClick={() => setSignInOtpStep('email')}
                            className="text-gray-500 hover:text-gray-800 underline cursor-pointer"
                          >
                            Change email
                          </button>
                          <button
                            type="button"
                            disabled={cooldown > 0 || isSubmitting}
                            onClick={() => handleSendLoginOtp()}
                            className="text-[#698156] font-bold hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3.5 bg-gradient-to-r from-[#698156] to-[#546944] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-[#698156]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? 'Verifying...' : 'Verify & Sign In'}
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                MODE: SIGN UP (Full Details Form -> Email OTP Verification)
               ═══════════════════════════════════════════════════════════ */}
            {mode === 'signup' && (
              <div>
                {signupStep === 'form' ? (
                  <form onSubmit={handleSendSignupOtp} className="space-y-3.5">
                    {/* 1. Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Aanya Sharma"
                          value={signupForm.fullName}
                          onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* 2. Mobile Number & Gender in 2 Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit number"
                            value={signupForm.phone}
                            onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value.replace(/\D/g, '') })}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={signupForm.gender}
                          onChange={(e) => setSignupForm({ ...signupForm, gender: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    {/* 3. Mail ID */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Mail ID (Email) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        We will send a 6-digit verification code to this email via SMTP.
                      </p>
                    </div>

                    {/* 4. Password & Confirm Password in 2 Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            required
                            placeholder="Min 6 chars"
                            value={signupForm.password}
                            onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            required
                            placeholder="Re-enter password"
                            value={signupForm.confirmPassword}
                            onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-3 py-3.5 bg-gradient-to-r from-[#698156] to-[#546944] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-[#698156]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending Verification Code...' : 'Continue to Verify Email'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  /* ══════════════ SIGNUP STEP 2: VERIFY EMAIL OTP ══════════════ */
                  <form onSubmit={handleVerifySignupOtp} className="space-y-4">
                    <div className="text-center py-2">
                      <div className="w-12 h-12 rounded-full bg-[#F4F6F2] border border-[#DCE4D7] text-[#698156] flex items-center justify-center mx-auto mb-2">
                        <KeyRound className="w-6 h-6" />
                      </div>
                      <h3 className="font-serif text-lg font-bold text-gray-900">Verify Your Email Address</h3>
                      <p className="text-xs text-gray-600 mt-1">
                        A 6-digit verification code has been dispatched to:
                      </p>
                      <p className="text-xs font-black text-[#698156] mt-0.5">{signupForm.email}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 text-center">
                        Enter 6-Digit Email OTP
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="••••••"
                        value={signupOtpCode}
                        onChange={(e) => setSignupOtpCode(e.target.value)}
                        className="w-full text-center tracking-[0.5em] text-lg font-black py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSignupStep('form')}
                        className="text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Edit details
                      </button>
                      <button
                        type="button"
                        disabled={cooldown > 0 || isSubmitting}
                        onClick={(e) => handleSendSignupOtp(e)}
                        className="text-[#698156] font-bold hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-[#698156] to-[#546944] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-[#698156]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify OTP & Complete Signup'}
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
