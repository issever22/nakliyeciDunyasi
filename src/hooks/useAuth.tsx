
"use client";

import type { CompanyUserProfile, CompanyRegisterData } from '@/types'; 
import { 
  createCompanyUser as createCompanyUserServerAction,
  getUserProfile as getUserProfileServerAction
} from '@/services/authService'; 
import { useRouter } from 'next/navigation';
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
// Firebase Auth imports removed
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase'; // db needed for querying users
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface AuthContextType {
  user: CompanyUserProfile | null; 
  login: (email: string, pass: string) => Promise<CompanyUserProfile | null>;
  register: (data: CompanyRegisterData) => Promise<CompanyUserProfile | null>; 
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CompanyUserProfile | null>(null); 
  const [loading, setLoading] = useState(false); // No initial loading from onAuthStateChanged
  const router = useRouter();
  const { toast } = useToast();

  // onAuthStateChanged useEffect removed

  const login = useCallback(async (email: string, pass: string): Promise<CompanyUserProfile | null> => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users"); // Ensure "users" matches your Firestore collection name
      const q = query(usersRef, where("email", "==", email), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.");
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as CompanyUserProfile; // Assume it includes password

      if (userData.password !== pass) { // Plaintext password comparison
        throw new Error("Hatalı şifre.");
      }
      
      if (userData.role !== 'company') {
        throw new Error("Giriş yapılan hesap bir firma hesabı değil.");
      }
      
      // Fetch full profile to ensure all fields are up-to-date as per convertToUserProfile logic
      const profile = await getUserProfileServerAction(userDoc.id);
      if (profile) {
        setUser(profile);
        return profile;
      } else {
        // This case should ideally not happen if the query found a user with matching email and role
        throw new Error("Kullanıcı profili yüklenemedi veya geçersiz.");
      }
    } catch(error: any) {
      console.error("Custom login error:", error);
      // Re-throw to be caught by LoginForm
      if (error.message === "Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı." || error.message === "Hatalı şifre.") {
          throw new Error("E-posta veya şifre hatalı.");
      }
      throw error; 
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: CompanyRegisterData): Promise<CompanyUserProfile | null> => {
    setLoading(true);
    if (!data.password) { // Password is now mandatory for custom auth
        setLoading(false);
        toast({ title: "Kayıt Hatası", description: "Şifre zorunludur.", variant: "destructive" });
        throw new Error("Şifre zorunludur.");
    }
    try {
      const result = await createCompanyUserServerAction(data); // createCompanyUserServerAction now handles ID and password
      if (result.profile) {
        setUser(result.profile); 
        return result.profile;
      } else {
        throw new Error(result.error || "Firma profili oluşturulamadı.");
      }
    } catch (error: any) {
      console.error("Custom registration error:", error);
      throw error; 
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const logout = useCallback(async () => {
    setLoading(true); // Optional: show loading during logout
    try {
      setUser(null); 
      // No Firebase signOut needed
      router.push('/auth/giris'); // Or homepage
    } catch (error: any) {
      console.error("Logout error (custom):", error);
      toast({ title: "Çıkış Hatası", description: error.message, variant: "destructive"});
    } finally {
      setLoading(false);
    }
  }, [router, toast]);
  
  const isAuthenticated = !!user; // Simpler check now

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
    // If loading is complete (not during initial app load or async auth op) and user is not authenticated
    if (!loading && !isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [user, loading, isAuthenticated, router, redirectUrl]);

  return { user, loading, isAuthenticated }; 
};

    