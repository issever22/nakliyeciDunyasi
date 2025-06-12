
"use client";

import type { UserProfile, IndividualUserProfile, CompanyUserProfile, RegisterData } from '@/types';
// Import individual server actions
import { 
  login as loginUserServerAction, 
  register as registerUserServerAction, 
  logout as logoutUserServerAction,
  getUserProfile as getUserProfileServerAction
} from '@/services/authService'; 
import { useRouter } from 'next/navigation';
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { type User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'; // Import onAuthStateChanged
import { auth } from '@/lib/firebase'; // Import the auth instance

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
    // Use onAuthStateChanged directly from firebase/auth
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser); // Store the Firebase Auth user object
      if (fbUser) {
        const profile = await getUserProfileServerAction(fbUser.uid); // Call the server action
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
    const loggedInUserProfile = await loginUserServerAction(email, pass); // Call imported server action
    // onAuthStateChanged will handle setting user and firebaseUser state, and then fetch profile via getUserProfileServerAction
    setLoading(false);
    if (loggedInUserProfile) {
      router.push('/'); // Navigate on successful login profile fetch by onAuthStateChanged
    }
    return loggedInUserProfile;
  }, [router]);

  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    const registeredUserProfile = await registerUserServerAction(data); // Call imported server action
    // onAuthStateChanged will handle setting user and firebaseUser state, and then fetch profile
    setLoading(false);
    if (registeredUserProfile) {
      router.push('/'); // Navigate on successful registration profile fetch by onAuthStateChanged
    }
    return registeredUserProfile;
  }, [router]);

  const logout = useCallback(async () => {
    setLoading(true);
    await logoutUserServerAction(); // Call imported server action
    // onAuthStateChanged will set user and firebaseUser to null
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
