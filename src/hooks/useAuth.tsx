
"use client";

import type { UserProfile, RegisterData } from '@/types';
import { 
  getUserProfile as getUserProfileServerAction,
  createUserProfile as createUserProfileServerAction
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
            // This could happen if Firestore profile creation failed after auth user creation
            // Or if a user exists in Firebase Auth but not in Firestore (e.g. manual deletion of Firestore doc)
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
      // onAuthStateChanged will handle setting firebaseUser and fetching/setting user profile
      // For immediate UI update, we can try to fetch profile here too if needed, but onAuthStateChanged should suffice
      // However, to ensure the promise resolves with the profile:
      if (userCredential.user) {
        const profile = await getUserProfileServerAction(userCredential.user.uid);
        setUser(profile); // Optimistic update
        return profile;
      }
      return null;
    } catch(error: any) {
      console.error("Login error with Firebase SDK:", error);
      throw error; // Re-throw to be caught by form
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
        // Now create the profile in Firestore via Server Action
        const profileData = { ...data }; // We already have all necessary fields in RegisterData
        delete profileData.password; // Ensure password is not sent to profile creation
        
        const newProfile = await createUserProfileServerAction(fbUser.uid, profileData);
        if (newProfile) {
          setUser(newProfile); // Optimistic update for immediate UI reflection
          return newProfile;
        } else {
          // This case is tricky: Firebase user created, but Firestore profile failed.
          // Might need cleanup logic or specific error handling.
          console.error("Firebase Auth user created, but Firestore profile creation failed for UID:", fbUser.uid);
          // Attempt to sign out the partially created user
          await signOut(auth); 
          throw new Error("Profile creation failed after user authentication.");
        }
      }
      return null;
    } catch (error: any) {
      console.error("Registration error with Firebase SDK or profile creation:", error);
      throw error; // Re-throw to be caught by form
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will set user and firebaseUser to null
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

// This hook remains crucial for protecting routes
export const useRequireAuth = (redirectUrl = '/auth/giris') => {
  const { user, firebaseUser, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [user, firebaseUser, loading, isAuthenticated, router, redirectUrl]);

  // Return loading state as well, so components can show a loading indicator
  return { user, loading, isAuthenticated }; 
};
