import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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

  // 2. Send Login OTP to Email (via Supabase SMTP)
  const sendEmailOtp = async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      toast.success(`Verification code dispatched to ${cleanEmail}! Check your inbox.`);
      return { success: true };
    } catch (err: any) {
      console.error('Email OTP Send Error:', err);
      return { success: false, error: err.message || 'Failed to dispatch verification email.' };
    }
  };

  // 3. Verify Login OTP from Email (via Supabase Auth)
  const verifyEmailOtp = async (email: string, token: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanToken = token.trim();

      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || 'Invalid or expired verification code.' };
      }

      setUser(data.user);
      setSession(data.session);
      await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
      toast.success(`Welcome back, ${data.user.user_metadata?.full_name || 'Customer'}!`);
      return { success: true };
    } catch (err: any) {
      console.error('Email OTP Verify Error:', err);
      return { success: false, error: err.message || 'Invalid verification code.' };
    }
  };

  // 4. Send Signup OTP to Email (via Supabase SMTP)
  const sendSignupOtp = async (formData: SignupFormData) => {
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const cleanName = formData.fullName.trim();
      const cleanPhone = formData.phone.trim();
      const cleanGender = formData.gender.trim();

      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      // Supabase sends 6-digit OTP to the entered email via Supabase SMTP
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

      if (error) {
        return { success: false, error: error.message };
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

      // 1. Authoritative verification with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });

      if (error || !data.user) {
        return {
          success: false,
          error: error?.message || 'Invalid or expired verification code. Please check your email and try again.'
        };
      }

      // 2. Set the password on the newly authorized user
      try {
        await supabase.auth.updateUser({
          password: formData.password,
          data: {
            full_name: cleanName,
            phone: cleanPhone,
            gender: cleanGender,
          },
        });
      } catch (passErr) {
        console.warn('Password update notice:', passErr);
      }

      // 3. Upsert into Supabase profiles table
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: cleanName,
          phone: cleanPhone || null,
          role: 'customer',
          status: 'Active',
        });
      } catch (pErr) {
        console.warn('Profile upsert notice:', pErr);
      }

      // 4. Save to userProfile storage so details immediately show in profile modal
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
        id: data.user.id,
        email: cleanEmail,
        full_name: cleanName,
        phone: cleanPhone,
        gender: cleanGender,
        role: 'customer',
        status: 'Active',
      };

      setUser(data.user);
      setSession(data.session);
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
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    localStorage.removeItem('customer_profile_cache');
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
