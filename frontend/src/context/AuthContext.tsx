'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getUser, setAuth, clearAuth, isAuthenticated } from '../lib/auth';
import api from '../lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      if (isAuthenticated()) {
        const savedUser = getUser();
        setUserState(savedUser);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;
    setAuth(token, userData);
    setUserState(userData);
  };

  const logout = () => {
    clearAuth();
    setUserState(null);
  };

  const setUser = (userData: User) => {
    setUserState(userData);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const existingUser = JSON.parse(userStr);
      localStorage.setItem('user', JSON.stringify({ ...existingUser, ...userData }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


