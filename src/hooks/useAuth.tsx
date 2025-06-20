
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

const USER_SESSION_KEY = 'nakliyeci-dunyasi-session-user';

interface AuthContextType {
  user: CompanyUserProfile | null; 
  login: (identifier: string, pass: string) => Promise<CompanyUserProfile | null>;
  register: (data: CompanyRegisterData) => Promise<CompanyUserProfile | null>; 
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CompanyUserProfile | null>(null); 
  const [loading, setLoading] = useState(true); // Start as true
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUserJson = localStorage.getItem(USER_SESSION_KEY);
      if (storedUserJson) {
        const storedUser = JSON.parse(storedUserJson);
        setUser(storedUser);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem(USER_SESSION_KEY);
    } finally {
      setLoading(false); // Set loading to false after checking storage
    }
  }, []);

  const login = useCallback(async (identifier: string, pass: string): Promise<CompanyUserProfile | null> => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      
      // Try to find user by email first
      const emailQuery = query(usersRef, where("email", "==", identifier), limit(1));
      let querySnapshot = await getDocs(emailQuery);

      // If not found by email, try by username
      if (querySnapshot.empty) {
          const usernameQuery = query(usersRef, where("username", "==", identifier), limit(1));
          querySnapshot = await getDocs(usernameQuery);
      }

      if (querySnapshot.empty) {
        throw new Error("Kullanıcı bulunamadı.");
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as CompanyUserProfile;

      if (userData.password !== pass) {
        throw new Error("Hatalı şifre.");
      }
      
      if (userData.role !== 'company') {
        throw new Error("Giriş yapılan hesap bir firma hesabı değil.");
      }
      
      const profile = await getUserProfileServerAction(userDoc.id);
      if (profile) {
        setUser(profile);
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(profile));
        return profile;
      } else {
        throw new Error("Kullanıcı profili yüklenemedi veya geçersiz.");
      }
    } catch(error: any) {
      console.error("Custom login error:", error);
      if (error.message === "Kullanıcı bulunamadı." || error.message === "Hatalı şifre.") {
          throw new Error("E-posta/kullanıcı adı veya şifre hatalı.");
      }
      throw error; 
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: CompanyRegisterData): Promise<CompanyUserProfile | null> => {
    setLoading(true);
    if (!data.password) {
        setLoading(false);
        toast({ title: "Kayıt Hatası", description: "Şifre zorunludur.", variant: "destructive" });
        throw new Error("Şifre zorunludur.");
    }
    try {
      const result = await createCompanyUserServerAction(data);
      if (result.profile) {
        setUser(result.profile); 
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(result.profile));
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
    setLoading(true);
    try {
      setUser(null); 
      localStorage.removeItem(USER_SESSION_KEY);
      router.push('/auth/giris');
    } catch (error: any) {
      console.error("Logout error (custom):", error);
      toast({ title: "Çıkış Hatası", description: error.message, variant: "destructive"});
    } finally {
      setLoading(false);
    }
  }, [router, toast]);
  
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

  return { user, loading, isAuthenticated }; 
};
