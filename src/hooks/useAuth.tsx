
"use client";

import type { UserProfile, RegisterData } from '@/types';
// Import individual server actions
import { 
  login as loginUserServerAction, 
  register as registerUserServerAction, 
  logout as logoutUserServerAction, 
  getUserProfile as getUserProfileServerAction 
} from '@/services/authService'; 
import { useRouter } from 'next/navigation';
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { type User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'; 
import { auth } from '@/lib/firebase'; 

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null; 
  login: (email: string, pass: string) => Promise<UserProfile | null>;
  register: (data: RegisterData) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null); 
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null); 
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser); 
      if (fbUser) {
        try {
          const profile = await getUserProfileServerAction(fbUser.uid); 
          setUser(profile);
        } catch (error) {
          console.error("Error fetching profile after auth state change:", error);
          setUser(null); // Clear user profile on error
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe(); 
  }, []); 

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    try {
      const loggedInUserProfile = await loginUserServerAction(email, pass); 
      if (loggedInUserProfile) {
        setUser(loggedInUserProfile); // Immediately update user state
        // onAuthStateChanged will also fire and re-confirm, which is fine.
        router.push('/'); 
      }
      return loggedInUserProfile;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    try {
      const registeredUserProfile = await registerUserServerAction(data); 
      if (registeredUserProfile) {
        setUser(registeredUserProfile); // Immediately update user state
        // onAuthStateChanged will also fire and re-confirm.
        router.push('/'); 
      }
      return registeredUserProfile;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutUserServerAction(); 
      // onAuthStateChanged will set user and firebaseUser to null
      setUser(null); // Explicitly clear local state as well
      setFirebaseUser(null);
      router.push('/auth/giris');
    } finally {
      setLoading(false);
    }
  }, [router]);
  
  const isAuthenticated = !!firebaseUser && !!user; 

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
