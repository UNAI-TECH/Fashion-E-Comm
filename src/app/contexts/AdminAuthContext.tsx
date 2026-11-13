import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface AdminUser {
  id?: string;
  name: string;
  email: string;
  role: string;
  token?: string;
  refreshToken?: string;
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

  // Background session restoration & validation on mount
  useEffect(() => {
    let isMounted = true;

    async function syncAdminSession() {
      try {
        const raw = localStorage.getItem('admin_info');
        let parsed: (AdminUser & { refreshToken?: string }) | null = raw ? JSON.parse(raw) : null;

        // 1. If admin_info has saved tokens, ensure the Supabase client session is active
        if (parsed?.role === 'admin' && parsed?.token && parsed?.refreshToken) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user || session.user.email !== parsed.email) {
            await supabase.auth.setSession({
              access_token: parsed.token,
              refresh_token: parsed.refreshToken,
            });
          }
        }

        // 2. Validate session with Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const email = session.user.email || '';
          const knownAdmins = ['admin@aanyafashion.com'];

          let isAdmin = knownAdmins.includes(email.toLowerCase()) || session.user.user_metadata?.role === 'admin';
          let name = session.user.user_metadata?.full_name || parsed?.name || 'Admin';

          if (!isAdmin) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, full_name')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile?.role === 'admin') {
              isAdmin = true;
              if (profile.full_name) name = profile.full_name;
            }
          }

          if (isAdmin) {
            setIsAuthenticated(true);
            setAdminName(name);
            setAdminEmail(email);

            // Preserve token & refreshToken in localStorage so sessions remain active across tabs and reloads
            const currentRaw = localStorage.getItem('admin_info');
            const currentParsed = currentRaw ? JSON.parse(currentRaw) : {};
            localStorage.setItem('admin_info', JSON.stringify({
              ...currentParsed,
              id: session.user.id,
              name,
              email,
              role: 'admin',
              token: session.access_token || currentParsed.token,
              refreshToken: session.refresh_token || currentParsed.refreshToken,
            }));
          }
        }
      } catch (err) {
        console.warn('[AdminAuth] syncAdminSession warning:', err);
      }
    }

    syncAdminSession();

    return () => {
      isMounted = false;
    };
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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zofmwjuakybpuoiqzktm.supabase.co';
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
        refreshToken: authData.refresh_token,
      };

      localStorage.setItem('admin_info', JSON.stringify(userObj));
      setIsAuthenticated(true);
      setAdminName(name);
      setAdminEmail(userObj.email);
      setIsLoading(false);

      // 4. Persist session into supabase client so RLS allows reading admin-protected tables
      if (authData.access_token && authData.refresh_token) {
        try {
          await supabase.auth.setSession({
            access_token: authData.access_token,
            refresh_token: authData.refresh_token,
          });
        } catch (setErr) {
          console.warn('[AdminAuth] setSession warning:', setErr);
        }
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
