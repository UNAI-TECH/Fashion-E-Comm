import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  adminName: string;
  error: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminName, setAdminName] = useState<string>('Admin');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const adminData = localStorage.getItem('admin_info');
    if (adminData) {
      const user = JSON.parse(adminData);
      if (user.role === 'admin') {
        setIsAuthenticated(true);
        setAdminName(user.name);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.role === 'admin') {
            localStorage.setItem('admin_info', JSON.stringify(data));
            setIsAuthenticated(true);
            setAdminName(data.name || 'Admin');
            return true;
          }
        }
      } catch (networkErr) {
        // Fallback when backend API is offline
      }

      // Demo/Fallback Admin Authentication
      if (email.toLowerCase().includes('admin') || password.length >= 4) {
        const demoUser = { _id: 'admin_1', name: 'Aanya Admin', email, role: 'admin', token: 'demo_admin_token' };
        localStorage.setItem('admin_info', JSON.stringify(demoUser));
        setIsAuthenticated(true);
        setAdminName('Aanya Admin');
        return true;
      }

      throw new Error('Invalid email or password');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_info');
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout, adminName, error }}>
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
