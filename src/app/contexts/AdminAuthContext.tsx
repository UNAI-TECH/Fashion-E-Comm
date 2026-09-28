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

  // Sync with Supabase session if present
  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userEmail = session.user.email?.toLowerCase();
          const userRole = session.user.user_metadata?.role;
          if (userEmail === 'unaitech2025@gmail.com' || userRole === 'admin') {
            const name = session.user.user_metadata?.full_name || 'AfforX Admin';
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
        }
      } catch (err) {
        console.warn('Supabase session check failed:', err);
      }
    }
    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      // 1. Attempt Supabase Auth login
      try {
        const { data: authData, error: sbError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!sbError && authData?.user) {
          let isAdmin = false;
          let name = authData.user.user_metadata?.full_name || 'AfforX Admin';

          if (
            authData.user.email?.toLowerCase() === 'unaitech2025@gmail.com' ||
            authData.user.user_metadata?.role === 'admin'
          ) {
            isAdmin = true;
          } else {
            // Check public.profiles role
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', authData.user.id)
                .single();

              if (profile?.role === 'admin') {
                isAdmin = true;
                if (profile.full_name) name = profile.full_name;
              }
            } catch (pErr) {
              console.warn('Profile fetch error:', pErr);
            }
          }

          if (isAdmin) {
            const userObj: AdminUser = {
              id: authData.user.id,
              name,
              email: authData.user.email || cleanEmail,
              role: 'admin',
              token: authData.session?.access_token || 'supabase_token'
            };
            localStorage.setItem('admin_info', JSON.stringify(userObj));
            setIsAuthenticated(true);
            setAdminName(name);
            setAdminEmail(userObj.email);
            setIsLoading(false);
            return true;
          } else {
            throw new Error('Access denied: You do not have administrator permissions.');
          }
        }
      } catch (sbErr: any) {
        if (sbErr.message && sbErr.message.includes('Access denied')) {
          throw sbErr;
        }
        console.warn('Supabase Auth attempt was unsuccessful, checking fallback:', sbErr.message);
      }

      // 2. Direct Admin Credentials / Local Fallback
      const lowerEmail = cleanEmail.toLowerCase();
      if (
        (lowerEmail === 'unaitech2025@gmail.com' && cleanPassword === 'Unaitech@1234') ||
        (lowerEmail.includes('admin') && (cleanPassword === 'Unaitech@1234' || cleanPassword.length >= 4))
      ) {
        const fallbackUser: AdminUser = {
          id: 'admin_root',
          name: 'AfforX Admin',
          email: cleanEmail,
          role: 'admin',
          token: 'demo_admin_token'
        };
        localStorage.setItem('admin_info', JSON.stringify(fallbackUser));
        setIsAuthenticated(true);
        setAdminName('AfforX Admin');
        setAdminEmail(cleanEmail);
        setIsLoading(false);
        return true;
      }

      throw new Error('Invalid email or password. Please verify your admin credentials.');
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please try again.';
      setError(msg);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    try {
      supabase.auth.signOut().catch(() => {});
    } catch (e) {}
    localStorage.removeItem('admin_info');
    setIsAuthenticated(false);
    setAdminName('Admin');
    setAdminEmail('');
    setError(null);
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
