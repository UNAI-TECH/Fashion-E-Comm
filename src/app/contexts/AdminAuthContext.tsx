import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface AdminUser {
  id?: string;
  name: string;
  email: string;
  role: string;
  token?: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  adminName: string;
  adminEmail: string;
  error: string | null;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  // Synchronous initialization prevents redirect flash on page refresh
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const adminData = localStorage.getItem('admin_info');
      if (adminData) {
        const user = JSON.parse(adminData);
        return user.role === 'admin';
      }
    } catch (e) {
      console.error('Error reading admin_info from localStorage:', e);
    }
    return false;
  });

  const [adminName, setAdminName] = useState<string>(() => {
    try {
      const adminData = localStorage.getItem('admin_info');
      if (adminData) {
        const user = JSON.parse(adminData);
        return user.name || 'Admin';
      }
    } catch (e) {}
    return 'Admin';
  });

  const [adminEmail, setAdminEmail] = useState<string>(() => {
    try {
      const adminData = localStorage.getItem('admin_info');
      if (adminData) {
        const user = JSON.parse(adminData);
        return user.email || '';
      }
    } catch (e) {}
    return '';
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Background session validation on mount (non-blocking)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile?.role === 'admin') {
              const name = profile.full_name || session.user.user_metadata?.full_name || 'Admin';
              setIsAuthenticated(true);
              setAdminName(name);
              setAdminEmail(session.user.email || '');
              localStorage.setItem('admin_info', JSON.stringify({
                id: session.user.id,
                name,
                email: session.user.email,
                role: 'admin'
              }));
            }
          });
      }
    }).catch(() => {});
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return false;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cvhofhdwedszsqcngxbt.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

      // 1. Authenticate via direct REST (bypasses browser WebLock deadlocks)
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
        }),
      });

      const authData = await res.json();

      if (!res.ok || !authData?.user) {
        throw new Error(authData?.error_description || authData?.msg || authData?.message || 'Invalid email or password.');
      }

      // 2. Verify admin role — use direct REST to avoid depending on supabase client session
      let isAdmin = false;
      let name = authData.user.user_metadata?.full_name || 'Admin';

      const knownAdmins = ['admin@aanyafashion.com'];
      if (
        knownAdmins.includes(cleanEmail.toLowerCase()) ||
        authData.user.user_metadata?.role === 'admin'
      ) {
        isAdmin = true;
      }

      // Check profile via REST with the new token (doesn't require setSession)
      try {
        const profileRes = await fetch(
          `${supabaseUrl}/rest/v1/profiles?select=role,full_name&id=eq.${authData.user.id}`,
          {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${authData.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const profiles = await profileRes.json();
        if (Array.isArray(profiles) && profiles.length > 0) {
          if (profiles[0].role === 'admin') {
            isAdmin = true;
          }
          if (profiles[0].full_name) {
            name = profiles[0].full_name;
          }
        }
      } catch (profErr) {
        console.warn('Profile fetch notice:', profErr);
      }

      if (!isAdmin) {
        throw new Error('Access denied: You do not have administrator permissions.');
      }

      // 3. Auth confirmed — set state and localStorage FIRST (immediate UI update)
      const userObj: AdminUser = {
        id: authData.user.id,
        name,
        email: authData.user.email || cleanEmail,
        role: 'admin',
        token: authData.access_token,
      };

      localStorage.setItem('admin_info', JSON.stringify(userObj));
      setIsAuthenticated(true);
      setAdminName(name);
      setAdminEmail(userObj.email);
      setIsLoading(false);

      // 4. Persist session into supabase client in BACKGROUND (non-blocking)
      //    This is fire-and-forget — the UI is already authenticated via localStorage
      if (authData.access_token && authData.refresh_token) {
        supabase.auth.setSession({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
        }).catch(() => {});
      }

      return true;
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please try again.';
      setError(msg);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    // 1. Clear state and localStorage immediately (instant UI update)
    setIsAuthenticated(false);
    setAdminName('Admin');
    setAdminEmail('');
    setError(null);
    localStorage.removeItem('admin_info');

    // 2. Sign out from Supabase in background (non-blocking)
    supabase.auth.signOut().catch(() => {});
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        adminName,
        adminEmail,
        error,
        isLoading
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
