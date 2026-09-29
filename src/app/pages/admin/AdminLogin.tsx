import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router';
import { Lock, Mail, ShieldAlert, Eye, EyeOff, ArrowLeft, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login, isAuthenticated, isLoading, error: authError } = useAdminAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated and currently on /login or /admin/login
  useEffect(() => {
    if (isAuthenticated && (window.location.pathname === '/login' || window.location.pathname === '/admin/login')) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both your admin email and password.');
      return;
    }

    const success = await login(email, password);
    if (success) {
      if (window.location.pathname === '/login' || window.location.pathname === '/admin/login') {
        navigate('/admin', { replace: true });
      }
    }
  };

  const handleQuickFill = () => {
    setEmail('unaitech2025@gmail.com');
    setPassword('Unaitech@1234');
    setLocalError('');
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top back button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 flex justify-between items-center z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors bg-white/80 backdrop-blur-sm px-3.5 py-2 rounded-xl shadow-xs border border-gray-200/80"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>
        <span className="text-[11px] font-bold text-rose-800/80 uppercase tracking-widest bg-rose-100/60 px-2.5 py-1 rounded-full">
          Admin Portal
        </span>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        {/* Logo / Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mx-auto w-24 h-24 bg-white/90 rounded-3xl flex items-center justify-center mb-3 shadow-lg border border-gray-100 overflow-hidden p-2"
        >
          <img src="/logo.webp" alt="Aanya Fashions Logo" className="h-full w-auto object-contain" />
        </motion.div>

        <h1 className="text-center text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight">
          Admin Login
        </h1>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-gray-500">
          Sign in with administrator credentials to manage the store
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-gray-100/90 relative"
        >
          {/* Quick-fill helper banner */}
          <div className="mb-6 p-3.5 bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl border border-amber-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800">Admin Account</p>
                <p className="text-[11px] text-gray-600 font-mono">unaitech2025@gmail.com</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-white px-3 py-1.5 rounded-lg border border-amber-300 shadow-xs hover:bg-rose-50 transition-colors cursor-pointer self-end sm:self-auto"
            >
              Fill Credentials
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            {displayError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 p-3.5 rounded-xl flex items-start gap-2.5 text-red-800 text-xs border border-red-200 font-medium"
              >
                <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{displayError}</span>
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-sm bg-gray-50/50 focus:bg-white transition-all outline-none"
                  placeholder="unaitech2025@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-sm bg-gray-50/50 focus:bg-white transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-[#1A1A1A] rounded border-gray-300 focus:ring-[#D4AF37] accent-[#1A1A1A]"
                />
                <span>Remember this device</span>
              </label>
            </div>

            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-[#800000] hover:bg-[#680000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000] transition-all cursor-pointer disabled:opacity-70 shadow-[#800000]/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>Sign In to Admin Dashboard</span>
                )}
              </motion.button>
            </div>
          </form>

          <div className="mt-6 text-center text-[11px] text-gray-400 border-t border-gray-100 pt-4 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure TLS 1.3 · Authorized Administrator Access Only</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
