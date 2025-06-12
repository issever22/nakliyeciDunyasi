
"use client";

import type { UserProfile, RegisterData } from '@/types';
import { 
  createUserProfile as createUserProfileServerAction,
  getUserProfile as getUserProfileServerAction
  // updateUserProfile, deleteUserProfile, getAllUserProfiles are for admin, not directly used in this hook
} from '@/services/authService'; 
import { useRouter } from 'next/navigation';
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { 
  type User as FirebaseUser, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth'; 
import { auth } from '@/lib/firebase'; 
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: UserProfile | null; // Firestore profile
  firebaseUser: FirebaseUser | null; // Firebase Auth user object
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
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser); 
      if (fbUser) {
        try {
          console.log("onAuthStateChanged: Firebase user found, fetching profile for UID:", fbUser.uid);
          const profile = await getUserProfileServerAction(fbUser.uid); 
          if (profile) {
            console.log("onAuthStateChanged: Profile fetched:", profile);
            setUser(profile);
          } else {
            console.warn("onAuthStateChanged: No profile found in Firestore for UID:", fbUser.uid);
            setUser(null); 
          }
        } catch (error) {
          console.error("onAuthStateChanged: Error fetching profile:", error);
          setUser(null); 
        }
      } else {
        console.log("onAuthStateChanged: No Firebase user.");
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe(); 
  }, []); 

  const login = useCallback(async (email: string, pass: string): Promise<UserProfile | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        const profile = await getUserProfileServerAction(userCredential.user.uid);
        setUser(profile); // Optimistic update
        return profile;
      }
      return null;
    } catch(error: any) {
      console.error("Login error with Firebase SDK:", error);
      throw error; 
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<UserProfile | null> => {
    setLoading(true);
    if (!data.password) {
      console.error("Registration error: Password is required.");
      setLoading(false);
      throw new Error("Password is required for registration.");
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const fbUser = userCredential.user;
      if (fbUser) {
        const profileData = { ...data }; 
        delete profileData.password; 
        
        const result = await createUserProfileServerAction(fbUser.uid, profileData);
        if (result.profile) {
          setUser(result.profile); 
          return result.profile;
        } else {
          console.error(`Firebase Auth user created, but Firestore profile creation failed for UID: ${fbUser.uid}. Error: ${result.error}`);
          await signOut(auth); 
          throw new Error(result.error || "Profile creation failed after user authentication.");
        }
      }
      return null; // Should not be reached if fbUser is valid
    } catch (error: any) {
      console.error("Registration error with Firebase SDK or profile creation:", error);
      throw error; 
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.push('/auth/giris');
    } catch (error: any) {
      console.error("Logout error with Firebase SDK:", error);
      toast({ title: "Çıkış Hatası", description: error.message, variant: "destructive"});
    } finally {
      setLoading(false);
    }
  }, [router, toast]);
  
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

  return { user, loading, isAuthenticated }; 
};
