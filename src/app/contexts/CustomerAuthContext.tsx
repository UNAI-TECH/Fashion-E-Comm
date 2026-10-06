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
  signUp: (formData: SignupFormData) => Promise<{ success: boolean; needsEmailVerification?: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; unconfirmedEmail?: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<CustomerProfile>) => Promise<{ success: boolean; error?: string }>;
  sendSignupOtp?: (formData: SignupFormData) => Promise<{ success: boolean; error?: string }>;
  verifySignupOtp?: (formData: SignupFormData, token: string) => Promise<{ success: boolean; error?: string }>;
  sendEmailOtp?: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailOtp?: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  sendOtp?: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp?: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
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
  const [signupVerificationToken, setSignupVerificationToken] = useState<string>('');
  const [loginVerificationToken, setLoginVerificationToken] = useState<string>('');

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
        const isUnconfirmed =
          error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('not confirmed') ||
          error.message.toLowerCase().includes('verification');

        return {
          success: false,
          unconfirmedEmail: isUnconfirmed,
          error: isUnconfirmed
            ? 'Your email is not verified yet. Please check your inbox and click the verification link.'
            : error.message,
        };
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

  // 2. Sign Up with Email Verification (Native Supabase Auth)
  const signUp = async (formData: SignupFormData) => {
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const cleanName = formData.fullName.trim();
      const cleanPhone = formData.phone.trim();
      const cleanGender = formData.gender.trim();

      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (formData.password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }

      // Register with Supabase native email confirmation
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
            gender: cleanGender,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const userId = data.user?.id || crypto.randomUUID();

      // Upsert into Supabase profiles table
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          email: cleanEmail,
          full_name: cleanName,
          phone: cleanPhone || null,
          gender: cleanGender || null,
          role: 'customer',
          status: 'Active',
          updated_at: new Date().toISOString(),
        });
      } catch (pErr) {
        console.warn('Profile upsert notice:', pErr);
      }

      // Save into local storage for ProfileModal
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

      const needsEmailVerification = !data.session;

      if (data.session && data.user) {
        setUser(data.user);
        setSession(data.session);
        setProfile(customerProfile);
        localStorage.setItem('customer_profile_cache', JSON.stringify(customerProfile));
        toast.success(`Welcome to Aanya Fashions, ${cleanName}!`);
      } else {
        toast.success('Registration successful! Please check your email for the confirmation link.');
      }

      return {
        success: true,
        needsEmailVerification,
      };
    } catch (err: any) {
      console.error('Sign up error:', err);
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  // 3. Resend Verification Link
  const resendVerificationEmail = async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      toast.success(`Verification link sent to ${cleanEmail}! Please check your inbox.`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to resend verification link.' };
    }
  };

  // 4. Password Reset
  const resetPasswordForEmail = async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { success: false, error: error.message };
      toast.success(`Password reset instructions sent to ${cleanEmail}!`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send password reset email.' };
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
        signUp,
        signInWithEmail,
        resendVerificationEmail,
        resetPasswordForEmail,
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
