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
  signUp: (formData: SignupFormData) => Promise<{ success: boolean; needsEmailVerification?: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; unconfirmedEmail?: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
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

  // ─── Fetch user profile from 'profiles' table & sync to localStorage ───
  const fetchProfile = async (userId: string, userEmail?: string, userMeta?: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, avatar_url, role, status, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        const enriched: CustomerProfile = {
          id: data.id,
          email: data.email,
          full_name: data.full_name || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
          gender: userMeta?.gender || '',
          role: data.role || 'customer',
          status: data.status || 'Active',
          created_at: data.created_at,
        };
        setProfile(enriched);
        localStorage.setItem('customer_profile_cache', JSON.stringify(enriched));

        // Sync into local user_profile_details for ProfileModal
        // Gender, address, city, pincode, state are stored locally only (not in DB)
        const savedLocal = getUserProfileDetails();
        saveUserProfileDetails({
          name: data.full_name || userMeta?.full_name || savedLocal.name || '',
          phone: data.phone || userMeta?.phone || savedLocal.phone || '',
          gender: userMeta?.gender || savedLocal.gender || '',
          email: data.email || userEmail || savedLocal.email || '',
          address: savedLocal.address || '',
          city: savedLocal.city || '',
          pincode: savedLocal.pincode || '',
          state: savedLocal.state || '',
        });
        return;
      }

      // If profile doesn't exist yet (trigger should create it, but just in case)
      const dbProfile = {
        id: userId,
        email: userEmail || '',
        full_name: userMeta?.full_name || userMeta?.name || userEmail?.split('@')[0] || 'Valued Customer',
        phone: userMeta?.phone || '',
        role: 'customer' as const,
        status: 'Active' as const,
        updated_at: new Date().toISOString(),
      };

      const { data: inserted } = await supabase
        .from('profiles')
        .upsert(dbProfile)
        .select()
        .single();

      const newProfile: CustomerProfile = {
        ...dbProfile,
        gender: userMeta?.gender || '',
      };

      if (inserted) {
        setProfile({ ...inserted, gender: userMeta?.gender || '' });
        localStorage.setItem('customer_profile_cache', JSON.stringify({ ...inserted, gender: userMeta?.gender || '' }));
      } else {
        setProfile(newProfile);
        localStorage.setItem('customer_profile_cache', JSON.stringify(newProfile));
      }
    } catch (e) {
      console.warn('Error fetching customer profile:', e);
    }
  };

  // ─── Sync auth state on mount and subscribe to changes ───
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

    // Listen for auth state transitions (includes email confirmation callback)
    // IMPORTANT: This callback must NOT await long operations — it blocks the auth state machine
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        // Fire profile fetch in background — do NOT await
        fetchProfile(newSession.user.id, newSession.user.email, newSession.user.user_metadata).catch(() => {});
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

  // ─── 1. Sign In with Email & Password ───
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        // Check if the error is because email isn't confirmed yet
        const isUnconfirmed =
          error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('not confirmed') ||
          error.message.toLowerCase().includes('verification');

        if (isUnconfirmed) {
          // Auto-confirm via Edge Function and retry sign-in
          try {
            const { data: edgeData } = await supabase.functions.invoke('customer-register', {
              body: { email: cleanEmail, password },
            });

            if (edgeData?.success) {
              const retry = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password,
              });
              if (retry.data?.user) {
                setUser(retry.data.user);
                setSession(retry.data.session);
                fetchProfile(retry.data.user.id, retry.data.user.email, retry.data.user.user_metadata).catch(() => {});
                toast.success(`Welcome back, ${retry.data.user.user_metadata?.full_name || 'Customer'}!`);
                return { success: true };
              }
            }
          } catch (autoConfirmErr) {
            console.warn('Auto-confirm fallback failed:', autoConfirmErr);
          }

          return {
            success: false,
            unconfirmedEmail: true,
            error: 'Please verify your email before signing in. Check your inbox (and Spam/Promotions folder) for the confirmation link.',
          };
        }

        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        fetchProfile(data.user.id, data.user.email, data.user.user_metadata).catch(() => {});
        toast.success(`Welcome back, ${data.user.user_metadata?.full_name || 'Customer'}!`);
        return { success: true };
      }

      return { success: false, error: 'Sign in failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  };

  // ─── 2. Sign Up — Native Supabase first, Edge Function fallback ───
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

      // Save local profile data early (gender, address etc. are local-only)
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

      // Determine redirect URL based on environment
      const redirectUrl =
        typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? window.location.origin
          : 'https://www.aanyafashions.com/';

      // ── Strategy 1: Native Supabase signUp (sends confirmation email if SMTP configured) ──
      let nativeSuccess = false;
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
          options: {
            data: {
              full_name: cleanName,
              phone: cleanPhone,
              gender: cleanGender,
            },
            emailRedirectTo: redirectUrl,
          },
        });

        if (!error && data.user) {
          // Check if user already exists (Supabase returns user with empty identities)
          if (data.user.identities && data.user.identities.length === 0) {
            return {
              success: false,
              error: 'An account with this email already exists. Please sign in instead.',
            };
          }

          nativeSuccess = true;
          const needsEmailVerification = !data.session;

          if (data.session && data.user) {
            // Email confirmation disabled or auto-confirmed — user is logged in
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
            toast.success(`Welcome to Aanya Fashions, ${cleanName}!`);
          } else {
            toast.success('Registration successful! Please check your email for the confirmation link.');
          }

          return { success: true, needsEmailVerification };
        }

        // If error is NOT a server/rate issue, return it directly
        if (error && error.status !== 500 && error.status !== 429) {
          return { success: false, error: error.message };
        }
      } catch (nativeErr) {
        console.warn('Native signup failed, trying Edge Function fallback:', nativeErr);
      }

      // ── Strategy 2: Edge Function fallback (when SMTP fails with 500 or 429) ──
      if (!nativeSuccess) {
        try {
          const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('customer-register', {
            body: {
              email: cleanEmail,
              password: formData.password,
              fullName: cleanName,
              phone: cleanPhone,
              gender: cleanGender,
            },
          });

          if (edgeErr) {
            return { success: false, error: edgeErr.message || 'Registration failed. Please try again.' };
          }

          if (edgeData?.success) {
            // Edge Function auto-confirms the user — sign in immediately
            const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: formData.password,
            });

            if (!signInErr && signInData?.session && signInData?.user) {
              const customerProfile: CustomerProfile = {
                id: signInData.user.id,
                email: cleanEmail,
                full_name: cleanName,
                phone: cleanPhone,
                gender: cleanGender,
                role: 'customer',
                status: 'Active',
              };
              setUser(signInData.user);
              setSession(signInData.session);
              setProfile(customerProfile);
              localStorage.setItem('customer_profile_cache', JSON.stringify(customerProfile));
              toast.success(`Welcome to Aanya Fashions, ${cleanName}!`);
              return { success: true, needsEmailVerification: false };
            }

            // Edge function succeeded but sign-in failed — account exists, ask to sign in
            toast.success('Account created! Please sign in with your email and password.');
            return { success: true, needsEmailVerification: false };
          }

          return { success: false, error: edgeData?.error || 'Registration failed.' };
        } catch (edgeCatch) {
          console.error('Edge function registration error:', edgeCatch);
          return { success: false, error: 'Registration service is temporarily unavailable. Please try again in a moment.' };
        }
      }

      return { success: false, error: 'Registration failed. Please try again.' };
    } catch (err: any) {
      console.error('Sign up error:', err);
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  // ─── 3. Resend Verification Email (Native Supabase API) ───
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
          emailRedirectTo:
            typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
              ? window.location.origin
              : 'https://www.aanyafashions.com/',
        },
      });

      if (error) {
        // Friendly message for rate limit
        if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
          return {
            success: false,
            error: 'Too many requests. Please wait a few minutes before trying again.',
          };
        }
        return { success: false, error: error.message };
      }

      toast.success(`Verification email resent to ${cleanEmail}. Check your inbox and Spam/Promotions folder.`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to resend verification email.' };
    }
  };

  // ─── 4. Password Reset ───
  const resetPasswordForEmail = async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const redirectUrl =
        typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? `${window.location.origin}/reset-password`
          : 'https://www.aanyafashions.com/reset-password';

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
          return { success: false, error: 'Too many requests. Please wait a few minutes.' };
        }
        return { success: false, error: error.message };
      }

      toast.success(`Password reset instructions sent to ${cleanEmail}!`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send password reset email.' };
    }
  };

  // ─── 5. Sign Out ───
  const signOut = async () => {
    // Sign out locally first for instant UI update
    setUser(null);
    setSession(null);
    setProfile(null);

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.warn('Local sign out warning:', e);
    }

    // Fire global sign-out in background (revokes refresh token on server)
    supabase.auth.signOut({ scope: 'global' }).catch(() => {});

    // Purge all auth & profile data from localStorage
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

  // ─── 6. Refresh Profile ───
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id, user.email, user.user_metadata);
    }
  };

  // ─── 7. Update Profile ───
  const updateProfile = async (updates: Partial<CustomerProfile>) => {
    if (!user?.id) return { success: false, error: 'User not logged in' };
    try {
      // Only send columns that exist in the DB profiles table
      const dbUpdates: Record<string, any> = {};
      const allowedDbCols = ['email', 'full_name', 'phone', 'avatar_url', 'role', 'status'];
      for (const key of allowedDbCols) {
        if (key in updates) {
          dbUpdates[key] = (updates as any)[key];
        }
      }
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Merge DB response with local-only fields (gender)
      const merged = { ...data, gender: updates.gender || profile?.gender || '' };
      setProfile(merged);
      localStorage.setItem('customer_profile_cache', JSON.stringify(merged));
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
