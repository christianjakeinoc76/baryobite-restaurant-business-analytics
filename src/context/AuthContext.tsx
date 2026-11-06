import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, clearStoredToken, getStoredToken, setStoredToken } from '../api/client';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      setUser(res.data.user);
    } catch {
      clearStoredToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string, rememberMe = true) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
      rememberMe,
    });
    setStoredToken(res.data.token, rememberMe);
    setUser(res.data.user);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', {
      name,
      email,
      password,
      passwordConfirmation,
    });
    setStoredToken(res.data.token, true);
    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network error on logout
    } finally {
      clearStoredToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
