
'use server'; 

import { db } from '@/lib/firebase'; // auth is not needed here for server actions
import type { UserProfile, IndividualUserProfile, CompanyUserProfile, RegisterData, IndividualRegisterData, CompanyRegisterData, UserRole } from '@/types';
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

  // Ensure 'name' (which is companyTitle for company users) is correctly assigned from the root
  if (data.role === 'company') {
    const companyProfile: CompanyUserProfile = { 
      id, 
      email: data.email,
      role: 'company',
      name: data.name, // This is companyTitle
      isActive: data.isActive,
      createdAt: data.createdAt,
      username: data.username || '',
      logoUrl: data.logoUrl || undefined, // Ensure undefined if falsy
      companyTitle: data.name, // Explicitly setting companyTitle from name
      contactFullName: data.contactFullName || '',
      workPhone: data.workPhone || undefined,
      mobilePhone: data.mobilePhone || '',
      fax: data.fax || undefined,
      website: data.website || undefined,
      companyDescription: data.companyDescription || undefined,
      companyType: data.companyType || 'local',
      addressCity: data.addressCity || '',
      addressDistrict: data.addressDistrict || undefined,
      fullAddress: data.fullAddress || '',
      workingMethods: data.workingMethods || [],
      workingRoutes: data.workingRoutes || [],
      preferredCities: data.preferredCities || [],
      preferredCountries: data.preferredCountries || [],
      membershipStatus: data.membershipStatus || 'Yok',
      membershipEndDate: data.membershipEndDate, // This can be undefined if not set
    };
    return companyProfile;
  }
  
  const individualProfile: IndividualUserProfile = {
    id,
    email: data.email,
    role: 'individual',
    name: data.name,
    isActive: data.isActive,
    createdAt: data.createdAt,
  };
  return individualProfile;
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return convertToUserProfile(userDocSnap.data(), userDocSnap.id);
    }
    console.log(`[authService.ts] No profile found for UID: ${uid}`);
    return null;
  } catch (error) {
    console.error("[authService.ts] Error fetching user profile from Firestore:", error);
    return null;
  }
}

export async function createUserProfile(uid: string, registrationData: RegisterData): Promise<{ profile: UserProfile | null; error?: string }> {
  try {
    const { password, ...profileDataFromForm } = registrationData; // Exclude password

    const commonProfileData = {
      email: profileDataFromForm.email,
      name: profileDataFromForm.name, // This is fullName for individual, companyTitle for company
      role: profileDataFromForm.role,
      isActive: true,
      createdAt: Timestamp.fromDate(new Date()),
    };

    let finalProfileDataForFirestore: Omit<UserProfile, 'id'>;

    if (profileDataFromForm.role === 'individual') {
      if (!commonProfileData.name || typeof commonProfileData.name !== 'string' || commonProfileData.name.trim() === '') {
        console.error("[authService.ts] Critical: Individual name is missing or invalid. UID:", uid);
        return { profile: null, error: "Individual name is missing or invalid." };
      }
      finalProfileDataForFirestore = {
        ...commonProfileData,
        role: 'individual',
      } as Omit<IndividualUserProfile, 'id'>;
    } else if (profileDataFromForm.role === 'company') {
      const companyData = profileDataFromForm as CompanyRegisterData;

      // Pre-flight checks for critical company data
      if (!companyData.username || typeof companyData.username !== 'string' || companyData.username.trim() === '') {
        return { profile: null, error: "Company username is missing or invalid." };
      }
      if (!commonProfileData.name || typeof commonProfileData.name !== 'string' || commonProfileData.name.trim() === '') {
        return { profile: null, error: "Company name (title) is missing or invalid." };
      }
       if (!companyData.contactFullName || typeof companyData.contactFullName !== 'string' || companyData.contactFullName.trim() === '') {
        return { profile: null, error: "Company contact full name is missing or invalid." };
      }
      if (!companyData.mobilePhone || typeof companyData.mobilePhone !== 'string' || companyData.mobilePhone.trim() === '') {
        return { profile: null, error: "Company mobile phone is missing or invalid." };
      }
      if (!companyData.companyType || typeof companyData.companyType !== 'string' || companyData.companyType.trim() === '') {
        return { profile: null, error: "Company type is missing or invalid." };
      }
       if (!companyData.addressCity || typeof companyData.addressCity !== 'string' || companyData.addressCity.trim() === '') {
        return { profile: null, error: "Company address city is missing or invalid." };
      }
       if (!companyData.fullAddress || typeof companyData.fullAddress !== 'string' || companyData.fullAddress.trim() === '') {
        return { profile: null, error: "Company full address is missing or invalid." };
      }
      
      const companyProfileBase: Omit<CompanyUserProfile, 'id' | 'membershipEndDate'> = {
        ...commonProfileData, 
        role: 'company',
        username: companyData.username,
        logoUrl: companyData.logoUrl || undefined,
        companyTitle: commonProfileData.name, 
        contactFullName: companyData.contactFullName,
        workPhone: companyData.workPhone || undefined,
        mobilePhone: companyData.mobilePhone,
        fax: companyData.fax || undefined,
        website: companyData.website || undefined,
        companyDescription: companyData.companyDescription || undefined,
        companyType: companyData.companyType,
        addressCity: companyData.addressCity,
        addressDistrict: companyData.addressDistrict || undefined,
        fullAddress: companyData.fullAddress,
        workingMethods: Array.isArray(companyData.workingMethods) ? companyData.workingMethods : [],
        workingRoutes: Array.isArray(companyData.workingRoutes) ? companyData.workingRoutes : [],
        preferredCities: Array.isArray(companyData.preferredCities) ? companyData.preferredCities.filter(c => c) : [],
        preferredCountries: Array.isArray(companyData.preferredCountries) ? companyData.preferredCountries.filter(c => c) : [],
        membershipStatus: 'Yok', 
      };

      // Conditionally add membershipEndDate ONLY if it has a value.
      // Firestore does not support 'undefined' for field values in setDoc.
      if (companyData.membershipEndDate) {
        (companyProfileBase as CompanyUserProfile).membershipEndDate = companyData.membershipEndDate;
      }
      finalProfileDataForFirestore = companyProfileBase as Omit<CompanyUserProfile, 'id'>;

    } else {
      console.error("[authService.ts] Invalid role specified for profile creation:", profileDataFromForm.role);
      return { profile: null, error: "Invalid user role specified for profile creation." };
    }
    
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    
    console.log(`[authService.ts] Attempting to create Firestore profile for UID: ${uid}`);
    console.log("[authService.ts] Data for Firestore:", JSON.stringify(finalProfileDataForFirestore, null, 2));

    await setDoc(userDocRef, finalProfileDataForFirestore); // Send the potentially modified object
    console.log(`[authService.ts] Successfully created Firestore profile for UID: ${uid}`);
    
    const savedDoc = await getDoc(userDocRef);
    if(savedDoc.exists()){
      return { profile: convertToUserProfile(savedDoc.data(), uid) };
    }
    console.warn(`[authService.ts] Firestore profile document not found immediately after creation for UID: ${uid}. This is unexpected.`);
    return { profile: null, error: "Profile verification failed after creation." };

  } catch (error: any) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("[authService.ts] CRITICAL: Error during Firestore profile creation (setDoc or getDoc). CHECK SERVER LOGS FOR THIS ERROR.");
    console.error("[authService.ts] Error details:", error);
    console.error(`[authService.ts] Failed UID: ${uid}`);
    const safeRegistrationData = {...registrationData};
    delete safeRegistrationData.password;
    console.error("[authService.ts] Data that was attempted to be written (excluding password):", JSON.stringify(safeRegistrationData, null, 2));
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    let errorMessage = "An unknown error occurred during profile creation.";
    if (error.message) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    return { profile: null, error: `Firestore operation failed: ${errorMessage}` };
  }
}
  
export async function getAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToUserProfile(doc.data(), doc.id));
  } catch (error) {
    console.error("[authService.ts] Error fetching all user profiles from Firestore: ", error);
    return [];
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<boolean> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const updateData: any = { ...data }; // Use 'any' temporarily for easier field manipulation

    delete updateData.id;
    delete updateData.password; 
    delete updateData.email; 
    delete updateData.role; 
    delete updateData.createdAt; 

    if (updateData.membershipEndDate && typeof updateData.membershipEndDate === 'string') {
      updateData.membershipEndDate = Timestamp.fromDate(parseISO(updateData.membershipEndDate));
    } else if (updateData.hasOwnProperty('membershipEndDate') && (updateData.membershipEndDate === null || updateData.membershipEndDate === undefined)) {
      // If explicitly set to null or undefined, allow Firestore to remove it or set to null
      // To remove a field, you'd use deleteField(), but for now, null is acceptable.
      // For complete omission when undefined:
      if (updateData.membershipEndDate === undefined) {
        delete updateData.membershipEndDate;
      } else {
         updateData.membershipEndDate = null; // Set to null if it's explicitly null
      }
    }


    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    console.error("[authService.ts] Error updating user profile in Firestore: ", error);
    return false;
  }
}

export async function deleteUserProfile(uid: string): Promise<boolean> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(docRef);
    console.log(`[authService.ts] Firestore profile for UID ${uid} deleted. Firebase Auth user may still exist.`);
    return true;
  } catch (error) {
    console.error("[authService.ts] Error deleting user profile from Firestore: ", error);
    return false;
  }
}

