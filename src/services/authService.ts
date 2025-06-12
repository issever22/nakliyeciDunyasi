
'use server';
import { db, auth } from '@/lib/firebase'; // Import auth from firebase
import type { UserProfile, IndividualUserProfile, CompanyUserProfile, RegisterData } from '@/types';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc, // Use setDoc to specify document ID (uid)
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  DocumentData,
  getDocs,
  where
} from 'firebase/firestore';
import { parseISO } from 'date-fns';

const USERS_COLLECTION = 'users';

// Helper to convert Firestore data to UserProfile
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

// Function to get user profile from Firestore by UID
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
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


export const authService = {
  login: async (email: string, pass: string): Promise<UserProfile | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      if (firebaseUser) {
        // Fetch profile from Firestore
        return await getUserProfile(firebaseUser.uid);
      }
      return null;
    } catch (error: any) {
      console.error("Error logging in with Firebase Auth: ", error.code, error.message);
      // You can handle specific error codes here (e.g., auth/wrong-password, auth/user-not-found)
      return null;
    }
  },

  register: async (userData: RegisterData): Promise<UserProfile | null> => {
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
          ...(profileData as Omit<UserProfile, 'id' | 'password' | 'email'>), // email is already handled
          email: firebaseUser.email!, // Use email from Firebase Auth user
          isActive: true,
          createdAt: Timestamp.fromDate(new Date()),
        };
        
        if (dataToSave.role === 'company') {
          const companyData = dataToSave as Omit<CompanyUserProfile, 'id' | 'password'> & { createdAt: Timestamp };
          companyData.companyTitle = companyData.companyTitle || companyData.name;
          companyData.logoUrl = companyData.logoUrl || '';
          companyData.contactFullName = companyData.contactFullName || companyData.name;
          // ... other company defaults if necessary
           if (companyData.membershipEndDate && typeof companyData.membershipEndDate === 'string') {
             companyData.membershipEndDate = Timestamp.fromDate(parseISO(companyData.membershipEndDate)) as any;
           } else {
            companyData.membershipEndDate = undefined;
          }
        }

        const userDocRef = doc(db, USERS_COLLECTION, uid);
        await setDoc(userDocRef, dataToSave); // Use setDoc with UID as document ID
        
        return { id: uid, ...dataToSave } as UserProfile;
      }
      return null;
    } catch (error: any) {
      console.error("Error registering user with Firebase Auth: ", error.code, error.message);
      // Handle specific errors like auth/email-already-in-use
      return null;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out with Firebase Auth: ", error);
    }
  },

  onAuthStateChangedListener: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },
  
  // Admin functions remain largely the same, operating on Firestore data
  getAllUsers: async (): Promise<UserProfile[]> => {
    try {
      const querySnapshot = await getDocs(query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc')));
      return querySnapshot.docs.map(doc => convertToUserProfile(doc.data(), doc.id));
    } catch (error) {
      console.error("Error fetching all users: ", error);
      return [];
    }
  },

  updateUser: async (id: string, userData: Partial<UserProfile>): Promise<boolean> => {
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
  },

  deleteUser: async (id: string): Promise<boolean> => {
    try {
      // Note: This only deletes the Firestore profile. 
      // Deleting the Firebase Auth user requires Admin SDK or specific client-side re-authentication.
      // For simplicity, we'll just delete the profile here.
      const docRef = doc(db, USERS_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting user profile: ", error);
      return false;
    }
  }
};
