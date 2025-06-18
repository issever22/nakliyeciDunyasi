
"use client";

import type { UserProfile, RegisterData, CompanyUserProfile } from '@/types'; // Updated types
import { 
  createUserProfile as createUserProfileServerAction,
  getUserProfile as getUserProfileServerAction
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
  user: CompanyUserProfile | null; // UserProfile is now CompanyUserProfile
  firebaseUser: FirebaseUser | null; 
  login: (email: string, pass: string) => Promise<CompanyUserProfile | null>;
  register: (data: RegisterData) => Promise<CompanyUserProfile | null>; // RegisterData is now CompanyRegisterData
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean; // True if firebaseUser and user (profile) exist
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CompanyUserProfile | null>(null); 
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
          if (profile && profile.role === 'company') { // Ensure it's a company profile
            console.log("onAuthStateChanged: Company profile fetched:", profile);
            setUser(profile as CompanyUserProfile);
          } else {
            if(profile) console.warn("onAuthStateChanged: Fetched profile is not a company role or missing for UID:", fbUser.uid);
            else console.warn("onAuthStateChanged: No profile found in Firestore for UID:", fbUser.uid);
            setUser(null); 
            // If a user is authenticated with Firebase but doesn't have a valid company profile,
            // they should probably be logged out or redirected.
            // await signOut(auth); // Consider this
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

  const login = useCallback(async (email: string, pass: string): Promise<CompanyUserProfile | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        const profile = await getUserProfileServerAction(userCredential.user.uid);
        if (profile && profile.role === 'company') {
          setUser(profile as CompanyUserProfile); 
          return profile as CompanyUserProfile;
        } else {
          await signOut(auth); // Log out if not a company user or no profile
          throw new Error("Giriş yapılan hesap bir firma hesabı değil veya profil bulunamadı.");
        }
      }
      return null;
    } catch(error: any) {
      console.error("Login error with Firebase SDK:", error);
      throw error; 
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<CompanyUserProfile | null> => {
    setLoading(true);
    if (data.role !== 'company') {
        setLoading(false);
        throw new Error("Sadece firma kayıtları desteklenmektedir.");
    }
    if (!data.password) {
      console.error("Registration error: Password is required.");
      setLoading(false);
      throw new Error("Şifre kayıt için zorunludur.");
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const fbUser = userCredential.user;
      if (fbUser) {
        const profileData = { ...data }; 
        delete profileData.password; 
        
        // Ensure name (companyTitle) is passed correctly for CompanyRegisterData
        const result = await createUserProfileServerAction(fbUser.uid, { ...profileData, name: data.name /* which is companyTitle */ });
        if (result.profile && result.profile.role === 'company') {
          setUser(result.profile as CompanyUserProfile); 
          return result.profile as CompanyUserProfile;
        } else {
          console.error(`Firebase Auth user created, but Firestore company profile creation failed for UID: ${fbUser.uid}. Error: ${result.error}`);
          await signOut(auth); 
          throw new Error(result.error || "Firma profili oluşturulamadı.");
        }
      }
      return null; 
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
      setUser(null); // Clear local user state
      setFirebaseUser(null); // Clear firebase user state
      router.push('/auth/giris');
    } catch (error: any) {
      console.error("Logout error with Firebase SDK:", error);
      toast({ title: "Çıkış Hatası", description: error.message, variant: "destructive"});
    } finally {
      setLoading(false);
    }
  }, [router, toast]);
  
  const isAuthenticated = !!firebaseUser && !!user && user.role === 'company'; 

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

// useRequireAuth will now implicitly require a company user
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

    