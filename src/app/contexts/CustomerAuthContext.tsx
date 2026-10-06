import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { saveUserProfileDetails, getUserProfileDetails } from '../../lib/userProfile';

export interface CustomerProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  gender?: string;
  avatar_url?: string;
  role: 'customer' | 'admin';
  status: 'Active' | 'Blocked';
  created_at?: string;
}

export interface SignupFormData {
  fullName: string;
  phone: string;
  gender: string;
  email: string;
  password: string;
}

interface CustomerAuthContextType {
  user: User | null;
  profile: CustomerProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  sendEmailOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  sendSignupOtp: (formData: SignupFormData) => Promise<{ success: boolean; error?: string }>;
  verifySignupOtp: (formData: SignupFormData, token: string) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<CustomerProfile>) => Promise<{ success: boolean; error?: string }>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(() => {
    try {
      const saved = localStorage.getItem('customer_profile_cache');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch full user profile from 'profiles' table & sync to storage
  const fetchProfile = async (userId: string, userEmail?: string, userMeta?: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        const enriched: CustomerProfile = {
          ...data,
          gender: data.gender || userMeta?.gender || '',
        };
        setProfile(enriched);
        localStorage.setItem('customer_profile_cache', JSON.stringify(enriched));

        // Sync into local user_profile_details for ProfileModal
        const savedLocal = getUserProfileDetails();
        saveUserProfileDetails({
          name: data.full_name || userMeta?.full_name || savedLocal.name || '',
          phone: data.phone || userMeta?.phone || savedLocal.phone || '',
          gender: data.gender || userMeta?.gender || savedLocal.gender || '',
          email: data.email || userEmail || savedLocal.email || '',
          address: data.address || savedLocal.address || '',
          city: data.city || savedLocal.city || '',
          pincode: data.pincode || savedLocal.pincode || '',
          state: data.state || savedLocal.state || '',
        });
        return;
      }

      // If profile doesn't exist yet, create it
      const newProfile: CustomerProfile = {
        id: userId,
        email: userEmail || '',
        full_name: userMeta?.full_name || userMeta?.name || userEmail?.split('@')[0] || 'Valued Customer',
        phone: userMeta?.phone || '',
        gender: userMeta?.gender || '',
        role: 'customer',
        status: 'Active',
      };

      const { data: inserted } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single();

      if (inserted) {
        setProfile(inserted);
        localStorage.setItem('customer_profile_cache', JSON.stringify(inserted));
      } else {
        setProfile(newProfile);
      }
    } catch (e) {
      console.warn('Error fetching customer profile:', e);
    }
  };

  // Sync auth state on mount and subscribe to changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted && currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id, currentSession.user.email, currentSession.user.user_metadata);
        }
      } catch (err) {
        console.warn('Initial session check failed:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    // Listen for auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        await fetchProfile(newSession.user.id, newSession.user.email, newSession.user.user_metadata);
      } else {
        setProfile(null);
        localStorage.removeItem('customer_profile_cache');
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 1. Sign In with Email & Password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
        toast.success(`Welcome back, ${data.user.user_metadata?.full_name || 'Customer'}!`);
        return { success: true };
      }

      return { success: false, error: 'Sign in failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  };

  // 2. Send Login OTP to Email (Tries Supabase SMTP; falls back to Render OTP microservice if rate-limited)
  const sendEmailOtp = async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      let sent = false;
      let errorMsg = '';

      // Try Supabase signInWithOtp first
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: false },
        });

        if (!error) {
          sent = true;
        } else {
          errorMsg = error.message;
        }
      } catch (sbErr: any) {
        errorMsg = sbErr?.message || '';
      }

      // If Supabase encountered rate-limit 429 or failure, dispatch via self-hosted microservice
      if (!sent) {
        try {
          const res = await api.otp.send('email', cleanEmail, 'login');
          if (res?.success) {
            sent = true;
          }
        } catch (mErr: any) {
          return { success: false, error: mErr.message || errorMsg || 'Failed to dispatch login code.' };
        }
      }

      if (!sent) {
        return { success: false, error: errorMsg || 'Failed to dispatch login code.' };
      }

      toast.success(`Login code dispatched to ${cleanEmail}! Check your inbox.`);
      return { success: true };
    } catch (err: any) {
      console.error('Email OTP Send Error:', err);
      return { success: false, error: err.message || 'Failed to dispatch login email.' };
    }
  };

  // 3. Verify Login OTP from Email (Supports Supabase Auth & Render OTP microservice)
  const verifyEmailOtp = async (email: string, token: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanToken = token.trim();

      let isVerified = false;
      let verifiedUser: any = null;
      let verifiedSession: any = null;

      // 1. Check Supabase verifyOtp
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email',
        });
        if (!error && data?.user) {
          isVerified = true;
          verifiedUser = data.user;
          verifiedSession = data.session;
        }
      } catch (e) {}

      // 2. Check self-hosted microservice
      if (!isVerified) {
        try {
          const vRes = await api.otp.verify('email', cleanEmail, cleanToken, 'login');
          if (vRes?.success || (vRes as any)?.verified) {
            isVerified = true;
          }
        } catch (e) {}
      }

      if (!isVerified) {
        return { success: false, error: 'Invalid or expired verification code.' };
      }

      if (verifiedUser) {
        setUser(verifiedUser);
        setSession(verifiedSession);
        await fetchProfile(verifiedUser.id, verifiedUser.email, verifiedUser.user_metadata);
      } else {
        const { data: dbProfile } = await supabase.from('profiles').select('*').eq('email', cleanEmail).maybeSingle();
        const fallbackUser: any = {
          id: dbProfile?.id || crypto.randomUUID(),
          email: cleanEmail,
          user_metadata: {
            full_name: dbProfile?.full_name || 'Valued Customer',
            phone: dbProfile?.phone || '',
          }
        };
        setUser(fallbackUser);
        if (dbProfile) {
          setProfile(dbProfile);
          localStorage.setItem('customer_profile_cache', JSON.stringify(dbProfile));
        }
      }

      toast.success(`Welcome back! Signed in successfully.`);
      return { success: true };
    } catch (err: any) {
      console.error('Email OTP Verify Error:', err);
      return { success: false, error: err.message || 'Invalid verification code.' };
    }
  };

  // 4. Send Signup OTP to Email (Tries Supabase SMTP; falls back to Render OTP microservice if rate-limited)
  const sendSignupOtp = async (formData: SignupFormData) => {
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const cleanName = formData.fullName.trim();
      const cleanPhone = formData.phone.trim();
      const cleanGender = formData.gender.trim();

      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      let sent = false;
      let errorMsg = '';

      // Attempt 1: Supabase signInWithOtp
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true,
            data: {
              full_name: cleanName,
              phone: cleanPhone,
              gender: cleanGender,
            },
          },
        });

        if (!error) {
          sent = true;
        } else {
          errorMsg = error.message;
        }
      } catch (sbErr: any) {
        errorMsg = sbErr?.message || '';
      }

      // Attempt 2: If Supabase threw rate-limit 429 or error, dispatch via Render OTP microservice
      if (!sent) {
        try {
          const res = await api.otp.send('email', cleanEmail, 'verification');
          if (res?.success) {
            sent = true;
          }
        } catch (mErr: any) {
          return { success: false, error: mErr.message || errorMsg || 'Failed to dispatch verification email.' };
        }
      }

      if (!sent) {
        return { success: false, error: errorMsg || 'Failed to dispatch verification email.' };
      }

      toast.success(`Verification code sent to ${cleanEmail}! Check your email inbox.`);
      return { success: true };
    } catch (err: any) {
      console.error('Signup OTP Send Error:', err);
      return { success: false, error: err.message || 'Failed to dispatch verification code.' };
    }
  };

  // 5. Verify Signup OTP (Authoritative check: if wrong OTP, user does NOT get signed up!)
  const verifySignupOtp = async (formData: SignupFormData, token: string) => {
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const cleanName = formData.fullName.trim();
      const cleanPhone = formData.phone.trim();
      const cleanGender = formData.gender.trim();
      const cleanToken = token.trim();

      let isVerified = false;

      // 1. Authoritative verification check via Supabase
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email',
        });
        if (!error && data?.user) {
          isVerified = true;
        }
      } catch (sbErr) {}

      // 2. Authoritative verification check via self-hosted microservice
      if (!isVerified) {
        try {
          const verifyRes = await api.otp.verify('email', cleanEmail, cleanToken, 'verification');
          if (verifyRes?.success || (verifyRes as any)?.verified) {
            isVerified = true;
          }
        } catch (vErr) {}
      }

      // If the OTP was wrong in both engines, DO NOT SIGN UP!
      if (!isVerified) {
        return {
          success: false,
          error: 'Invalid or expired verification code. Please check your email and try again.'
        };
      }

      // 3. User is verified! Set up Supabase auth session
      let activeUser: any = null;
      let activeSession: any = null;

      // Check if user already exists by attempting sign in
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: formData.password,
      });

      if (signInData?.user) {
        activeUser = signInData.user;
        activeSession = signInData.session;
      } else {
        // Register in Supabase
        const { data: signUpData } = await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
          options: {
            data: {
              full_name: cleanName,
              phone: cleanPhone,
              gender: cleanGender,
            },
          },
        });
        activeUser = signUpData?.user;
        activeSession = signUpData?.session;
      }

      const userId = activeUser?.id || crypto.randomUUID();

      // 4. Upsert into Supabase profiles table
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          email: cleanEmail,
          full_name: cleanName,
          phone: cleanPhone || null,
          role: 'customer',
          status: 'Active',
        });
      } catch (pErr) {
        console.warn('Profile upsert notice:', pErr);
      }

      // 5. Save to userProfile storage so details immediately show in profile modal
      saveUserProfileDetails({
        name: cleanName,
        phone: cleanPhone,
        gender: cleanGender,
        email: cleanEmail,
        address: '',
        city: '',
        pincode: '',
        state: '',
      });

      const customerProfile: CustomerProfile = {
        id: userId,
        email: cleanEmail,
        full_name: cleanName,
        phone: cleanPhone,
        gender: cleanGender,
        role: 'customer',
        status: 'Active',
      };

      const finalUser = activeUser || {
        id: userId,
        email: cleanEmail,
        user_metadata: {
          full_name: cleanName,
          phone: cleanPhone,
          gender: cleanGender,
        }
      };

      setUser(finalUser as any);
      setSession(activeSession);
      setProfile(customerProfile);
      localStorage.setItem('customer_profile_cache', JSON.stringify(customerProfile));

      toast.success(`Welcome to Aanya Fashions, ${cleanName}! Account created successfully.`);
      return { success: true };
    } catch (err: any) {
      console.error('Signup OTP Verification Error:', err);
      return { success: false, error: err.message || 'Verification failed.' };
    }
  };

  // 6. Sign Out
  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.warn('Local sign out warning:', e);
    }

    try {
      supabase.auth.signOut({ scope: 'global' }).catch(() => {});
    } catch (e) {}

    // Reset React state immediately
    setUser(null);
    setSession(null);
    setProfile(null);

    // Thoroughly purge all auth & profile data from localStorage
    try {
      localStorage.removeItem('customer_profile_cache');
      localStorage.removeItem('admin_info');
      localStorage.removeItem('user_profile_details');
      localStorage.removeItem('user_profile_image');

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase.auth'))) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('Storage purge error:', e);
    }

    // Broadcast sign-out event across components
    window.dispatchEvent(new CustomEvent('user_profile_updated'));
    window.dispatchEvent(new CustomEvent('user-signed-out'));

    toast.success('You have been signed out.');
  };

  // 7. Refresh Profile
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id, user.email, user.user_metadata);
    }
  };

  // 8. Update Profile
  const updateProfile = async (updates: Partial<CustomerProfile>) => {
    if (!user?.id) return { success: false, error: 'User not logged in' };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      localStorage.setItem('customer_profile_cache', JSON.stringify(data));
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (err: any) {
      console.error('Update profile error:', err);
      return { success: false, error: err.message || 'Profile update error' };
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        profile,
        session,
        isAuthenticated: !!user,
        isLoading,
        signInWithEmail,
        sendEmailOtp,
        verifyEmailOtp,
        sendSignupOtp,
        verifySignupOtp,
        sendOtp: sendEmailOtp,
        verifyOtp: verifyEmailOtp,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
