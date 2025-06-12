
"use client";

import type { UserProfile, IndividualUserProfile, CompanyUserProfile } from '@/types';
import { authService, getUserProfile } from '@/services/authService'; // Import getUserProfile
import { useRouter } from 'next/navigation';
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth'; // Import FirebaseUser type

// Define more specific types for registration data
type IndividualRegisterData = Omit<IndividualUserProfile, 'id'> & { password?: string };
type CompanyRegisterData = Omit<CompanyUserProfile, 'id'> & { password?: string };
export type RegisterData = IndividualRegisterData | CompanyRegisterData;


interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null; // Store Firebase Auth user object
  login: (email: string, pass: string) => Promise<UserProfile | null>;
  register: (data: RegisterData) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null); // Firestore profile
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null); // Firebase Auth user
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = authService.onAuthStateChangedListener(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const profile = await getUserProfile(fbUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    const loggedInUserProfile = await authService.login(email, pass);
    // onAuthStateChanged will handle setting user and firebaseUser state
    setLoading(false);
    if (loggedInUserProfile) {
      router.push('/');
    }
    return loggedInUserProfile;
  }, [router]);

  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    const registeredUserProfile = await authService.register(data);
    // onAuthStateChanged will handle setting user and firebaseUser state
    setLoading(false);
    if (registeredUserProfile) {
      router.push('/');
    }
    return registeredUserProfile;
  }, [router]);

  const logout = useCallback(async () => {
    setLoading(true);
    await authService.logout();
    // onAuthStateChanged will handle setting user and firebaseUser state to null
    setLoading(false);
    router.push('/auth/giris');
  }, [router]);
  
  const isAuthenticated = !!firebaseUser && !!user; // Check both Firebase Auth user and Firestore profile

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, register, logout, loading, isAuthenticated }}>
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
  const { user, firebaseUser, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [user, firebaseUser, loading, isAuthenticated, router, redirectUrl]);

  return { user, loading };
};
