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

  // Validate session with Supabase on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Verify admin role from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', session.user.id)
            .single();

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
          } else {
            // User exists but is not admin — clear any stale admin session
            localStorage.removeItem('admin_info');
            setIsAuthenticated(false);
          }
        } else {
          // No active Supabase session — clear localStorage if stale
          const stored = localStorage.getItem('admin_info');
          if (stored) {
            localStorage.removeItem('admin_info');
            setIsAuthenticated(false);
            setAdminName('Admin');
            setAdminEmail('');
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

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return false;
    }

    try {
      // Authenticate via Supabase Auth
      const { data: authData, error: sbError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (sbError || !authData?.user) {
        throw new Error(sbError?.message || 'Invalid email or password.');
      }

      // Verify admin role from profiles table
      let isAdmin = false;
      let name = authData.user.user_metadata?.full_name || 'Admin';

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', authData.user.id)
        .single();

      if (profile?.role === 'admin') {
        isAdmin = true;
        if (profile.full_name) name = profile.full_name;
      }

      if (!isAdmin) {
        // Sign out the non-admin user
        await supabase.auth.signOut();
        throw new Error('Access denied: You do not have administrator permissions.');
      }

      const userObj: AdminUser = {
        id: authData.user.id,
        name,
        email: authData.user.email || cleanEmail,
        role: 'admin',
        token: authData.session?.access_token
      };

      localStorage.setItem('admin_info', JSON.stringify(userObj));
      setIsAuthenticated(true);
      setAdminName(name);
      setAdminEmail(userObj.email);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please try again.';
      setError(msg);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    supabase.auth.signOut().catch(() => {});
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
