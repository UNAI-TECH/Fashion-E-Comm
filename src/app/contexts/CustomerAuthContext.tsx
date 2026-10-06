import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface CustomerProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'customer' | 'admin';
  status: 'Active' | 'Blocked';
  created_at?: string;
}

interface CustomerAuthContextType {
  user: User | null;
  profile: CustomerProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (emailOrPhone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (emailOrPhone: string, token: string) => Promise<{ success: boolean; error?: string }>;
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

  // Fetch full user profile from 'profiles' table
  const fetchProfile = async (userId: string, userEmail?: string, userMeta?: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
        localStorage.setItem('customer_profile_cache', JSON.stringify(data));
        return;
      }

      // If profile doesn't exist yet, create it
      const newProfile: CustomerProfile = {
        id: userId,
        email: userEmail || '',
        full_name: userMeta?.full_name || userMeta?.name || userEmail?.split('@')[0] || 'Valued Customer',
        phone: userMeta?.phone || '',
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
      const cleanEmail = email.trim();
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

  // 2. Sign Up with Email, Password & Name
  const signUpWithEmail = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const cleanEmail = email.trim();
      const cleanName = fullName.trim();
      const cleanPhone = phone?.trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create initial profile in database
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: cleanName,
          phone: cleanPhone || null,
          role: 'customer',
          status: 'Active',
        });

        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id, cleanEmail, { full_name: cleanName, phone: cleanPhone });
        toast.success('Account created successfully!');
        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration error' };
    }
  };

  // 3. Send OTP (Email or Phone via Render Python OTP microservice)
  const sendOtp = async (emailOrPhone: string) => {
    try {
      const input = emailOrPhone.trim();
      const isEmail = input.includes('@');
      const channel = isEmail ? 'email' : 'sms';

      let destination = input;
      if (!isEmail) {
        const clean = input.replace(/\D/g, '');
        destination = clean.length === 10 ? `+91${clean}` : `+${clean}`;
      }

      // Dispatch via Render OTP microservice
      await api.otp.send(channel, destination, 'login');
      toast.success(`Verification code dispatched to ${destination}! (Valid for 30 seconds)`);
      return { success: true };
    } catch (err: any) {
      console.error('OTP Send Error:', err);
      const msg = err.status === 429
        ? (err.message || 'Please wait before requesting a new OTP.')
        : (err.message || 'Failed to send OTP.');
      return { success: false, error: msg };
    }
  };

  // 4. Verify OTP (via Render Python OTP microservice)
  const verifyOtp = async (emailOrPhone: string, token: string) => {
    try {
      const input = emailOrPhone.trim();
      const isEmail = input.includes('@');
      const channel = isEmail ? 'email' : 'sms';
      const cleanToken = token.trim();

      let destination = input;
      if (!isEmail) {
        const clean = input.replace(/\D/g, '');
        destination = clean.length === 10 ? `+91${clean}` : `+${clean}`;
      }

      // 1. Authoritative verification with Render OTP microservice
      const verifyRes = await api.otp.verify(channel, destination, cleanToken, 'login');
      if (!verifyRes?.success && !(verifyRes as any)?.verified) {
        return { success: false, error: verifyRes?.message || 'Invalid or expired code. Please request a new OTP.' };
      }

      // 2. Fetch or create user profile in Supabase profiles table
      let profileData: CustomerProfile | null = null;
      if (isEmail) {
        const { data } = await supabase.from('profiles').select('*').eq('email', destination).maybeSingle();
        profileData = data;
      } else {
        const { data } = await supabase.from('profiles').select('*').eq('phone', destination).maybeSingle();
        profileData = data;
      }

      if (!profileData) {
        const newId = crypto.randomUUID();
        const newProfile: any = {
          id: newId,
          email: isEmail ? destination : null,
          phone: !isEmail ? destination : null,
          full_name: 'Valued Customer',
          role: 'customer',
          status: 'Active',
          created_at: new Date().toISOString()
        };
        const { data: inserted } = await supabase.from('profiles').upsert(newProfile).select().single();
        if (inserted) {
          profileData = inserted as CustomerProfile;
        }
      }

      const authUser: any = {
        id: profileData?.id || crypto.randomUUID(),
        email: isEmail ? destination : undefined,
        phone: !isEmail ? destination : undefined,
        user_metadata: {
          full_name: profileData?.full_name || 'Valued Customer',
          phone: destination
        }
      };

      setUser(authUser);
      setProfile(profileData);
      toast.success('Signed in successfully!');
      return { success: true };
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      return { success: false, error: err.message || 'Invalid or expired code.' };
    }
  };

  // 5. Sign Out
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

  // 6. Refresh Profile
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id, user.email, user.user_metadata);
    }
  };

  // 7. Update Profile
  const updateProfile = async (updates: Partial<CustomerProfile>) => {
    if (!user?.id) return { success: false, error: 'Not logged in' };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      if (data) {
        setProfile(data);
        localStorage.setItem('customer_profile_cache', JSON.stringify(data));
        toast.success('Profile updated successfully!');
        return { success: true };
      }
      return { success: false, error: 'Update failed' };
    } catch (err: any) {
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
        signUpWithEmail,
        sendOtp,
        verifyOtp,
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
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
