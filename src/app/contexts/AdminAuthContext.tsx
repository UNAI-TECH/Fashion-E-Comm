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
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // STRICT ADMIN CHECK
      if (data.role !== 'admin') {
        throw new Error('Access Denied: Not an authorized admin');
      }

      localStorage.setItem('admin_info', JSON.stringify(data));
      setIsAuthenticated(true);
      setAdminName(data.name);
      return true;
    } catch (err: any) {
      setError(err.message);
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
