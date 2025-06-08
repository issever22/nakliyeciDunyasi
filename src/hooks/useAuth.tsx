
"use client";

import type { UserProfile, IndividualUserProfile, CompanyUserProfile } from '@/types';
import { authService } from '@/lib/authService';
import { useRouter } from 'next/navigation';
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';

// Define more specific types for registration data
type IndividualRegisterData = Omit<IndividualUserProfile, 'id'> & { password?: string };
type CompanyRegisterData = Omit<CompanyUserProfile, 'id'> & { password?: string };
export type RegisterData = IndividualRegisterData | CompanyRegisterData;


interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, pass: string) => Promise<UserProfile | null>;
  register: (data: RegisterData) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    const loggedInUser = await authService.login(email, pass);
    setUser(loggedInUser);
    setLoading(false);
    if (loggedInUser) {
      router.push('/');
    }
    return loggedInUser;
  }, [router]);

  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    // authService.register now expects a single object
    const registeredUser = await authService.register(data);
    setUser(registeredUser);
    setLoading(false);
    if (registeredUser) {
      router.push('/');
    }
    return registeredUser;
  }, [router]);

  const logout = useCallback(async () => {
    setLoading(true);
    await authService.logout();
    setUser(null);
    setLoading(false);
    router.push('/auth/giris');
  }, [router]);
  
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useRequireAuth = (redirectUrl = '/auth/giris') => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [user, loading, isAuthenticated, router, redirectUrl]);

  return { user, loading };
};
