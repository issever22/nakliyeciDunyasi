
'use server';

import { db } from '@/lib/firebase'; 
import type { UserProfile, CompanyUserProfile, RegisterData, CompanyRegisterData, UserRole, CompanyCategory } from '@/types';
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
  getDocs,
  where // Added for admin query
} from 'firebase/firestore';
import { parseISO, isValid } from 'date-fns';

const USERS_COLLECTION = 'users';

// This function now expects to convert data into CompanyUserProfile
const convertToUserProfile = (docData: DocumentData, id: string): CompanyUserProfile | null => {
  const data = { ...docData };

  if (data.role !== 'company') {
    console.warn(`[authService] User ${id}: Role is not 'company'. Skipping profile conversion for this user. Role: ${data.role}`);
    return null; // Or handle as an error, but for now, we only care about company profiles
  }

  if (data.createdAt && data.createdAt instanceof Timestamp) {
    data.createdAt = data.createdAt.toDate().toISOString();
  } else {
    console.warn(`[authService] Company User ${id}: createdAt is not a Timestamp or is missing. Defaulting. Original:`, data.createdAt);
    data.createdAt = new Date().toISOString(); // fallback
  }

  if (data.membershipEndDate && data.membershipEndDate instanceof Timestamp) {
    data.membershipEndDate = data.membershipEndDate.toDate().toISOString();
  } else if (data.membershipEndDate === null || data.membershipEndDate === undefined) {
    data.membershipEndDate = undefined; 
  } else {
     console.warn(`[authService] Company User ${id}: membershipEndDate is present but not a Timestamp. Setting to undefined. Original:`, data.membershipEndDate);
    data.membershipEndDate = undefined;
  }

  // isActive is now admin approval status
  data.isActive = data.isActive === true; // Ensure it's a boolean

  const companyProfile: CompanyUserProfile = {
    id,
    email: data.email,
    role: 'company',
    name: data.name, // This is companyTitle
    isActive: data.isActive, // Admin approval status
    createdAt: data.createdAt,
    username: data.username || '',
    logoUrl: data.logoUrl || undefined,
    companyTitle: data.name, 
    category: data.category || 'Nakliyeci', // Default category if missing
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
    workingMethods: Array.isArray(data.workingMethods) ? data.workingMethods : [],
    workingRoutes: Array.isArray(data.workingRoutes) ? data.workingRoutes : [],
    preferredCities: Array.isArray(data.preferredCities) ? data.preferredCities : [],
    preferredCountries: Array.isArray(data.preferredCountries) ? data.preferredCountries : [],
    membershipStatus: data.membershipStatus || 'Yok',
    membershipEndDate: data.membershipEndDate,
    ownedVehicles: Array.isArray(data.ownedVehicles) ? data.ownedVehicles : [],
    authDocuments: Array.isArray(data.authDocuments) ? data.authDocuments : [],
  };
  return companyProfile;
};

export async function getUserProfile(uid: string): Promise<CompanyUserProfile | null> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const profile = convertToUserProfile(userDocSnap.data(), userDocSnap.id);
      if (profile && profile.role === 'company') {
        return profile;
      }
      console.log(`[authService.ts] Profile for UID ${uid} is not a company profile or invalid.`);
      return null;
    }
    console.log(`[authService.ts] No profile found for UID: ${uid}`);
    return null;
  } catch (error) {
    console.error("[authService.ts] Error fetching user profile from Firestore:", error);
    return null;
  }
}

// RegisterData is now CompanyRegisterData, so role is always 'company'
export async function createUserProfile(uid: string, registrationData: CompanyRegisterData): Promise<{ profile: CompanyUserProfile | null; error?: string }> {
  try {
    const { password, ...profileDataFromForm } = registrationData; 

    const companyData = profileDataFromForm as Omit<CompanyRegisterData, 'password'>;

    if (!companyData.username || typeof companyData.username !== 'string' || companyData.username.trim() === '') {
      return { profile: null, error: "Company username is missing or invalid." };
    }
    // 'name' in RegisterData is companyTitle for CompanyRegisterData
    if (!companyData.name || typeof companyData.name !== 'string' || companyData.name.trim() === '') { 
      return { profile: null, error: "Company name (title) is missing or invalid." };
    }
     if (!companyData.category || typeof companyData.category !== 'string' || companyData.category.trim() === '') {
      return { profile: null, error: "Company category is missing or invalid." };
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


    const finalProfileDataForFirestore: Omit<CompanyUserProfile, 'id' | 'membershipEndDate'> & { membershipEndDate?: Timestamp | null } = {
      email: companyData.email,
      role: 'company',
      name: companyData.name, // This is companyTitle
      isActive: false, // New companies are inactive by default, awaiting admin approval
      createdAt: Timestamp.fromDate(new Date()),
      username: companyData.username,
      category: companyData.category,
      logoUrl: companyData.logoUrl || undefined,
      companyTitle: companyData.name, // Explicitly set companyTitle
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
      // membershipEndDate will be handled by specific logic if/when memberships are purchased
      membershipEndDate: null, // Start with no end date
      ownedVehicles: [], 
      authDocuments: [], 
    };
    
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userDocRef, finalProfileDataForFirestore);
    const savedDoc = await getDoc(userDocRef);

    if (savedDoc.exists()) {
        const converted = convertToUserProfile(savedDoc.data(), uid);
        if (converted) return { profile: converted };
        return { profile: null, error: "Created profile is not a valid company profile."};
    }
    return { profile: null, error: "Profile verification failed after creation." };

  } catch (error: any) {
    console.error("[authService.ts] Error during Firestore profile creation:", error);
    let errorMessage = "An unknown error occurred during profile creation.";
    if (error.message) errorMessage = error.message;
    else if (typeof error === 'string') errorMessage = error;
    return { profile: null, error: `Firestore operation failed: ${errorMessage}` };
  }
}

export async function getAllUserProfiles(): Promise<CompanyUserProfile[]> {
  try {
    const q = query(collection(db, USERS_COLLECTION), where('role', '==', 'company'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const companyProfiles: CompanyUserProfile[] = [];
    querySnapshot.docs.forEach(doc => {
        const profile = convertToUserProfile(doc.data(), doc.id);
        if (profile) {
            companyProfiles.push(profile);
        }
    });
    return companyProfiles;
  } catch (error: any) {
    console.error("[authService.ts] Error fetching all company user profiles from Firestore: ", error);
    if (error.code === 'failed-precondition') {
         const errorMessage = error.message || "Eksik Firestore dizini (admin kullanıcı listesi). Lütfen sunucu konsolunu kontrol edin.";
         console.error(`[authService.ts] FIRESTORE PRECONDITION FAILED (getAllUserProfiles): ${errorMessage}`);
          const urlRegex = /(https:\/\/console.firebase.google.com\/project\/[^/]+\/firestore\/indexes\?create_composite=[^ ]+)/;
          const match = errorMessage.match(urlRegex);
          if (match && match[0]) {
              const indexCreationUrl = match[0];
              console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
              console.error("!!! ADMIN ALL USERS - MISSING FIRESTORE INDEX !!!");
              console.error(`!!! Index URL: ${indexCreationUrl}`);
              console.error("!!! Likely involves fields: 'role' (equals 'company') and 'createdAt' (descending).");
              console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
          }
     }
    return [];
  }
}

// UpdateUserProfile now specifically targets CompanyUserProfile fields where applicable
export async function updateUserProfile(uid: string, data: Partial<CompanyUserProfile>): Promise<boolean> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const updateData: any = { ...data };

    // Fields that should not be directly updatable this way or have special handling
    delete updateData.id;
    delete updateData.password; // Password managed by Firebase Auth
    delete updateData.email; // Email managed by Firebase Auth
    delete updateData.role; // Role is fixed as 'company'
    delete updateData.createdAt; 

    // Ensure name and companyTitle are consistent if name is part of the update
    if (updateData.hasOwnProperty('name')) {
        updateData.companyTitle = updateData.name;
    } else if (updateData.hasOwnProperty('companyTitle')) {
        updateData.name = updateData.companyTitle;
    }


    if (updateData.hasOwnProperty('membershipEndDate')) {
      if (updateData.membershipEndDate && typeof updateData.membershipEndDate === 'string' && isValid(parseISO(updateData.membershipEndDate))) {
        updateData.membershipEndDate = Timestamp.fromDate(parseISO(updateData.membershipEndDate));
      } else if (updateData.membershipEndDate === undefined || updateData.membershipEndDate === null || (typeof updateData.membershipEndDate === 'string' && updateData.membershipEndDate.trim() === '')) {
        updateData.membershipEndDate = null; 
      } else {
         console.warn(`[authService] updateUserProfile: Invalid membershipEndDate string for UID ${uid}: ${updateData.membershipEndDate}. Field not updated.`);
         delete updateData.membershipEndDate;
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
