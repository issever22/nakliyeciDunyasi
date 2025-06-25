
"use client";

import type { CompanyUserProfile, CompanyRegisterData } from '@/types'; 
import { createCompanyUser as createCompanyUserServerAction, getUserProfile as getUserProfileServerAction, updateFirestorePassword } from '@/services/authService'; 
import { useRouter } from 'next/navigation';
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User as FirebaseUser, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AuthContextType {
  user: CompanyUserProfile | null; 
  login: (email: string, pass: string) => Promise<FirebaseUser | null>;
  register: (data: CompanyRegisterData) => Promise<FirebaseUser | null>; 
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean; 
  refreshUser: () => Promise<void>;
  changePassword: (currentPassword_input: string, newPassword_input: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CompanyUserProfile | null>(null); 
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const profile = await getUserProfileServerAction(firebaseUser.uid);
        if (profile) {
          setUser(profile);
          // Set up a real-time listener for the user's profile document
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const freshProfile = getUserProfileServerAction(docSnap.id);
              freshProfile.then(p => {
                if (p) setUser(p);
              });
            } else {
              // User doc deleted from backend
              logout();
            }
          });
        } else {
          // Profile doesn't exist in Firestore, might be an inconsistent state
          setUser(null);
          await signOut(auth);
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      const freshProfile = await getUserProfileServerAction(auth.currentUser.uid);
      if (freshProfile) {
        setUser(freshProfile);
      }
    }
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      return userCredential.user;
    } catch (error: any) {
      console.error("Firebase login error:", error);
      let errorMessage = "Giriş sırasında bir hata oluştu.";
      if (error.code) {
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage = "E-posta veya şifre hatalı.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Geçersiz e-posta formatı.";
                break;
            case 'auth/user-disabled':
                errorMessage = "Bu kullanıcı hesabı devre dışı bırakılmış.";
                break;
            default:
                errorMessage = "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.";
        }
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: CompanyRegisterData): Promise<FirebaseUser | null> => {
    setLoading(true);
    if (!data.password) {
      setLoading(false);
      throw new Error("Şifre kayıt için zorunludur.");
    }
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      // 2. Create user profile in Firestore
      const result = await createCompanyUserServerAction(firebaseUser.uid, data);
      
      if (result.profile) {
        setUser(result.profile);
        return firebaseUser;
      } else {
        // If Firestore profile creation fails, we should ideally delete the Auth user
        // This requires Admin SDK, so for now we'll just throw the error.
        await firebaseUser.delete();
        throw new Error(result.error || "Firma profili oluşturulamadı. Auth kullanıcısı silindi.");
      }
    } catch (error: any) {
      console.error("Firebase registration error:", error);
      let errorMessage = "Kayıt sırasında bir hata oluştu.";
      if (error.code) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = "Bu e-posta adresi zaten kayıtlı.";
                break;
            case 'auth/weak-password':
                errorMessage = "Şifre en az 6 karakter olmalıdır.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Geçersiz e-posta formatı.";
                break;
            default:
                errorMessage = error.message || "Beklenmedik bir hata oluştu.";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null); 
      router.push('/auth/giris');
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({ title: "Çıkış Hatası", description: error.message, variant: "destructive"});
    }
  }, [router, toast]);
  
  const changePassword = useCallback(async (currentPassword_input: string, newPassword_input: string) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      throw new Error("Oturum açmış kullanıcı bulunamadı veya kullanıcının e-postası yok.");
    }
    
    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword_input);

    try {
      await reauthenticateWithCredential(firebaseUser, credential);
      // User re-authenticated. Now, change the password in Auth.
      await updatePassword(firebaseUser, newPassword_input);
      // And now update it in Firestore
      const firestoreSuccess = await updateFirestorePassword(firebaseUser.uid, newPassword_input);
      if (!firestoreSuccess) {
          // This is a state where auth password changed but firestore failed.
          // It's a tricky situation. We'll just log it and inform the user to contact support.
          console.error("Firebase Auth password updated, but Firestore update failed for user:", firebaseUser.uid);
          throw new Error("Kimlik doğrulama şifresi güncellendi, ancak veritabanı kaydı güncellenemedi. Lütfen yönetici ile iletişime geçin.");
      }
    } catch (error: any) {
        console.error("Password change error:", error.code);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error("Mevcut şifreniz yanlış.");
        }
        if(error.code === 'auth/weak-password') {
            throw new Error("Yeni şifre en az 6 karakter olmalıdır.");
        }
        throw new Error(error.message || "Şifre değiştirilirken bir hata oluştu.");
    }
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated, refreshUser, changePassword }}>
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
