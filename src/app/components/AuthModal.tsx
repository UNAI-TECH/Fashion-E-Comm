import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Phone, Lock, User, ArrowRight, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
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
    signUp,
    resendVerificationEmail,
    resetPasswordForEmail,
  } = useCustomerAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  // Sign Up state
  const [signupForm, setSignupForm] = useState<SignupFormData & { confirmPassword: string }>({
    fullName: '',
    phone: '',
    gender: 'Female',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationSentEmail, setVerificationSentEmail] = useState<string | null>(null);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // General state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Synchronize default mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setVerificationSentEmail(null);
      setUnconfirmedEmail(null);
      setShowForgotPassword(false);
    }
  }, [isOpen, defaultMode]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const resetAll = () => {
    setSignInEmail('');
    setSignInPassword('');
    setUnconfirmedEmail(null);
    setSignupForm({
      fullName: '',
      phone: '',
      gender: 'Female',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setVerificationSentEmail(null);
    setShowForgotPassword(false);
    setIsSubmitting(false);
    setResendCooldown(0);
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
      if (res.unconfirmedEmail) {
        setUnconfirmedEmail(signInEmail.trim().toLowerCase());
      }
      toast.error(res.error || 'Invalid email or password');
    }
  };

  // 2. Sign Up with Full Form (Name, Mobile, Gender, Email, Password, Confirm Password)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

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

    const cleanEmail = signupForm.email.trim().toLowerCase();
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

    setIsSubmitting(true);
    const res = await signUp({
      fullName: signupForm.fullName.trim(),
      phone: cleanPhone,
      gender: signupForm.gender,
      email: cleanEmail,
      password: signupForm.password,
    });
    setIsSubmitting(false);

    if (res.success) {
      if (res.needsEmailVerification) {
        setVerificationSentEmail(cleanEmail);
      } else {
        handleClose();
        if (onSuccess) onSuccess();
      }
    } else {
      toast.error(res.error || 'Failed to create account');
    }
  };

  // 3. Resend Verification Email
  const handleResendVerification = async (targetEmail: string) => {
    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds before requesting another email.`);
      return;
    }

    setIsSubmitting(true);
    const res = await resendVerificationEmail(targetEmail);
    setIsSubmitting(false);

    if (res.success) {
      setResendCooldown(60);
    } else {
      toast.error(res.error || 'Failed to resend verification email');
    }
  };

  // 4. Send Password Reset
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    const res = await resetPasswordForEmail(forgotEmail.trim().toLowerCase());
    setIsSubmitting(false);

    if (res.success) {
      setShowForgotPassword(false);
      setForgotEmail('');
    } else {
      toast.error(res.error || 'Failed to send password reset email');
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
          {/* Top Banner */}
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
              {mode === 'signin' ? 'Welcome to Aanya Fashions' : 'Create Customer Account'}
            </h2>
            <p className="text-white/80 text-xs mt-1">
              {mode === 'signin'
                ? 'Sign in with your email and password'
                : 'Fill in your details to create your luxury shopping account'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          {!verificationSentEmail && (
            <div className="flex border-b border-gray-100 bg-gray-50/80">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setShowForgotPassword(false);
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
                type="button"
                onClick={() => {
                  setMode('signup');
                  setShowForgotPassword(false);
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
          )}

          <div className="p-6 max-h-[75vh] overflow-y-auto">
            {/* ═══════════════════════════════════════════════════════════
                VERIFICATION EMAIL SENT CONFIRMATION VIEW
               ═══════════════════════════════════════════════════════════ */}
            {verificationSentEmail && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#F4F6F2] border-2 border-[#698156]/30 text-[#698156] flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-gray-900">Verify Your Email</h3>
                  <p className="text-xs text-gray-600 mt-2 max-w-sm mx-auto leading-relaxed">
                    A confirmation link has been sent to your email address:
                  </p>
                  <p className="text-sm font-black text-[#698156] mt-1">{verificationSentEmail}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-left text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Next Steps:</p>
                  <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-amber-800">
                    <li>Open your email inbox (and check Spam/Promotions folder).</li>
                    <li>Click the <strong>Confirm your email</strong> link from Supabase.</li>
                    <li>Return here and log in with your password.</li>
                  </ol>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isSubmitting}
                    onClick={() => handleResendVerification(verificationSentEmail)}
                    className="w-full py-3 bg-[#F4F6F2] hover:bg-[#EBF0E6] text-[#698156] border border-[#DCE4D7] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Resend Link in ${resendCooldown}s` : 'Resend Verification Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVerificationSentEmail(null);
                      setMode('signin');
                      setSignInEmail(verificationSentEmail);
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-[#698156] to-[#546944] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-[#698156]/20 cursor-pointer"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                MODE: SIGN IN
               ═══════════════════════════════════════════════════════════ */}
            {!verificationSentEmail && mode === 'signin' && (
              <div>
                {!showForgotPassword ? (
                  <form onSubmit={handlePasswordSignIn} className="space-y-4">
                    {/* Unconfirmed Email Alert */}
                    {unconfirmedEmail && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 space-y-2">
                        <p className="font-semibold">
                          Your email <strong>{unconfirmedEmail}</strong> is not verified yet.
                        </p>
                        <button
                          type="button"
                          disabled={resendCooldown > 0 || isSubmitting}
                          onClick={() => handleResendVerification(unconfirmedEmail)}
                          className="text-[#698156] font-bold underline hover:opacity-80 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {resendCooldown > 0 ? `Resend link in ${resendCooldown}s` : 'Click here to resend verification email'}
                        </button>
                      </div>
                    )}

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
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setForgotEmail(signInEmail);
                          }}
                          className="text-[11px] font-semibold text-[#698156] hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
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
                      {isSubmitting ? 'Signing In...' : 'Sign In'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  /* Forgot Password View */
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="text-center py-1">
                      <h3 className="font-serif text-lg font-bold text-gray-900">Reset Your Password</h3>
                      <p className="text-xs text-gray-600 mt-1">
                        Enter your email address and we'll send you instructions to reset your password.
                      </p>
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
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#698156] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-[#698156] hover:bg-[#546944] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Link'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                MODE: SIGN UP (Customer Form)
               ═══════════════════════════════════════════════════════════ */}
            {!verificationSentEmail && mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                {/* 1. Full Name */}
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
                </div>

                {/* 4. Password & Confirm Password */}
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
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
