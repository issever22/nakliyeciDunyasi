
'use server';
import { db } from '@/lib/firebase';
import type { UserProfile, IndividualUserProfile, CompanyUserProfile, RegisterData } from '@/types';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { parseISO } from 'date-fns';

const USERS_COLLECTION = 'users';
const USER_STORAGE_KEY = 'nakliyeci-dunyasi-user';

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

export const authService = {
  login: async (email: string, pass: string): Promise<UserProfile | null> => {
    try {
      const q = query(collection(db, USERS_COLLECTION), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log("No user found with this email.");
        return null;
      }
      
      // For this mock, we'll assume the first user found is the one,
      // and we're not actually checking the password.
      // In a real app, you'd use Firebase Authentication or secure password hashing.
      const userDoc = querySnapshot.docs[0];
      const user = convertToUserProfile(userDoc.data(), userDoc.id);

      // Basic password check for mock purposes - REPLACE WITH SECURE AUTH
      // This is highly insecure and only for local demo.
      // const storedPassword = userDoc.data().password; // NEVER store plain text passwords
      // if (storedPassword === pass) {
      if (pass) { // Placeholder for actual password check
        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        }
        return user;
      }
      return null;
    } catch (error) {
      console.error("Error logging in: ", error);
      return null;
    }
  },

  register: async (userData: RegisterData): Promise<UserProfile | null> => {
    try {
      const q = query(collection(db, USERS_COLLECTION), where("email", "==", userData.email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        console.error("Email already registered");
        return null;
      }

      const { password, ...dataToSaveWithoutPassword } = userData; // Exclude password from Firestore save

      const dataToSave: any = {
        ...dataToSaveWithoutPassword,
        isActive: true, // Default new users to active
        createdAt: Timestamp.fromDate(new Date()),
        // Password should be handled by Firebase Auth or a secure backend.
        // For this mock, we're not storing it directly in Firestore for security.
        // If you were storing a hash: hashedPassword: await hashPassword(password)
      };
      
      // For company users, ensure specific fields exist or default them
      if (dataToSave.role === 'company') {
        dataToSave.companyTitle = dataToSave.companyTitle || dataToSave.name;
        dataToSave.logoUrl = dataToSave.logoUrl || '';
        dataToSave.contactFullName = dataToSave.contactFullName || dataToSave.name;
        dataToSave.workPhone = dataToSave.workPhone || '';
        dataToSave.mobilePhone = dataToSave.mobilePhone || '';
        dataToSave.fax = dataToSave.fax || '';
        dataToSave.website = dataToSave.website || '';
        dataToSave.companyDescription = dataToSave.companyDescription || '';
        dataToSave.companyType = dataToSave.companyType || 'local';
        dataToSave.addressCity = dataToSave.addressCity || '';
        dataToSave.addressDistrict = dataToSave.addressDistrict || '';
        dataToSave.fullAddress = dataToSave.fullAddress || '';
        dataToSave.workingMethods = dataToSave.workingMethods || [];
        dataToSave.workingRoutes = dataToSave.workingRoutes || [];
        dataToSave.preferredCities = dataToSave.preferredCities || [];
        dataToSave.preferredCountries = dataToSave.preferredCountries || [];
        dataToSave.membershipStatus = dataToSave.membershipStatus || 'Yok';
        if (dataToSave.membershipEndDate && typeof dataToSave.membershipEndDate === 'string') {
             dataToSave.membershipEndDate = Timestamp.fromDate(parseISO(dataToSave.membershipEndDate));
        } else {
            dataToSave.membershipEndDate = undefined;
        }
      }


      const docRef = await addDoc(collection(db, USERS_COLLECTION), dataToSave);
      const newUser = convertToUserProfile({ ...dataToSave, id: docRef.id }, docRef.id);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      }
      return newUser;

    } catch (error) {
      console.error("Error registering user: ", error);
      return null;
    }
  },

  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  },

  getCurrentUser: (): UserProfile | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(USER_STORAGE_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr) as UserProfile;
        } catch (e) {
          console.error("Error parsing user from localStorage", e);
          localStorage.removeItem(USER_STORAGE_KEY);
          return null;
        }
      }
    }
    return null;
  },

  // Admin functions
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
      
      // Convert dates back to Timestamp if they are strings
      if (dataToUpdate.createdAt && typeof dataToUpdate.createdAt === 'string') {
        dataToUpdate.createdAt = Timestamp.fromDate(parseISO(dataToUpdate.createdAt));
      }
      if (dataToUpdate.membershipEndDate && typeof dataToUpdate.membershipEndDate === 'string') {
        dataToUpdate.membershipEndDate = Timestamp.fromDate(parseISO(dataToUpdate.membershipEndDate));
      } else if (dataToUpdate.membershipEndDate === null || dataToUpdate.membershipEndDate === undefined) {
        // Allow clearing the date
        dataToUpdate.membershipEndDate = null; 
      }


      // Remove id if present, as it's not part of the document data itself
      delete dataToUpdate.id;
      // Password should be updated via a separate, secure mechanism (e.g., Firebase Auth)
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
      const docRef = doc(db, USERS_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting user: ", error);
      return false;
    }
  }
};
