
'use server'; // This directive MUST be at the very top.

import { db, auth } from '@/lib/firebase';
import type { UserProfile, IndividualUserProfile, CompanyUserProfile, RegisterData } from '@/types';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  DocumentData,
  getDocs
} from 'firebase/firestore';
import { parseISO } from 'date-fns';

const USERS_COLLECTION = 'users';

// Helper to convert Firestore data to UserProfile - internal to this module
const convertToUserProfile = (docData: DocumentData, id: string): UserProfile => {
  const data = { ...docData };
  if (data.createdAt && data.createdAt.toDate) {
    data.createdAt = data.createdAt.toDate().toISOString();
  } else if (typeof data.createdAt === 'string') {
    // already string
  } else {
    data.createdAt = new Date().toISOString(); // fallback
  }

  if (data.membershipEndDate && data.membershipEndDate.toDate) {
    data.membershipEndDate = data.membershipEndDate.toDate().toISOString();
  } else if (typeof data.membershipEndDate === 'string') {
    // already string
  }

  data.isActive = data.isActive === undefined ? true : data.isActive;

  if (data.role === 'company') {
    return { id, ...data } as CompanyUserProfile;
  }
  return { id, ...data } as IndividualUserProfile;
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return convertToUserProfile(userDocSnap.data(), userDocSnap.id);
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export async function login(email: string, pass: string): Promise<UserProfile | null> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;
    if (firebaseUser) {
      return await getUserProfile(firebaseUser.uid);
    }
    return null;
  } catch (error: any) {
    console.error("Error logging in with Firebase Auth: ", error.code, error.message);
    return null;
  }
}

export async function register(userData: RegisterData): Promise<UserProfile | null> {
  try {
    const { email, password, ...profileData } = userData;
    if (!password) {
      console.error("Password is required for registration.");
      return null;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      const uid = firebaseUser.uid;
      const dataToSave: Omit<UserProfile, 'id' | 'password'> & { createdAt: Timestamp } = {
        ...(profileData as Omit<UserProfile, 'id' | 'password' | 'email'>),
        email: firebaseUser.email!,
        isActive: true,
        createdAt: Timestamp.fromDate(new Date()),
      };
      
      if (dataToSave.role === 'company') {
        const companyData = dataToSave as Omit<CompanyUserProfile, 'id' | 'password'> & { createdAt: Timestamp };
        companyData.companyTitle = companyData.companyTitle || companyData.name;
        companyData.logoUrl = companyData.logoUrl || '';
        companyData.contactFullName = companyData.contactFullName || companyData.name;
         if (companyData.membershipEndDate && typeof companyData.membershipEndDate === 'string') {
           companyData.membershipEndDate = Timestamp.fromDate(parseISO(companyData.membershipEndDate)) as any;
         } else {
          companyData.membershipEndDate = undefined;
        }
      }

      const userDocRef = doc(db, USERS_COLLECTION, uid);
      await setDoc(userDocRef, dataToSave);
      
      // Firestore'dan kaydedilen profili geri döndür
      const savedProfileData = (await getDoc(userDocRef)).data();
      if (savedProfileData) {
        return convertToUserProfile(savedProfileData, uid);
      }
      return null; // Profil kaydedilemedi veya okunamadıysa
    }
    return null;
  } catch (error: any) {
    console.error("Error registering user with Firebase Auth: ", error.code, error.message);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out with Firebase Auth: ", error);
  }
}
  
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const querySnapshot = await getDocs(query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc')));
    return querySnapshot.docs.map(doc => convertToUserProfile(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching all users: ", error);
    return [];
  }
}

export async function updateUser(id: string, userData: Partial<UserProfile>): Promise<boolean> {
  try {
    const docRef = doc(db, USERS_COLLECTION, id);
    const dataToUpdate: any = { ...userData };
    
    if (dataToUpdate.createdAt && typeof dataToUpdate.createdAt === 'string') {
      dataToUpdate.createdAt = Timestamp.fromDate(parseISO(dataToUpdate.createdAt));
    }
    if (dataToUpdate.membershipEndDate && typeof dataToUpdate.membershipEndDate === 'string') {
      dataToUpdate.membershipEndDate = Timestamp.fromDate(parseISO(dataToUpdate.membershipEndDate));
    } else if (dataToUpdate.membershipEndDate === null || dataToUpdate.membershipEndDate === undefined) {
      dataToUpdate.membershipEndDate = null; 
    }

    delete dataToUpdate.id;
    delete dataToUpdate.password; 

    await updateDoc(docRef, dataToUpdate);
    return true;
  } catch (error) {
    console.error("Error updating user: ", error);
    return false;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, USERS_COLLECTION, id);
    await deleteDoc(docRef);
    // Firebase Auth kullanıcısını silme işlemi burada yapılmaz, Admin SDK gerektirir.
    // Bu sadece Firestore'daki kullanıcı profilini siler.
    return true;
  } catch (error) {
    console.error("Error deleting user profile: ", error);
    return false;
  }
}
