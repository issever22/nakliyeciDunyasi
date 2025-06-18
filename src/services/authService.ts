
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
  where,
  addDoc, 
  limit 
} from 'firebase/firestore';
import { parseISO, isValid } from 'date-fns';

const USERS_COLLECTION = 'users';

const convertToUserProfile = (docData: DocumentData, id: string): CompanyUserProfile | null => {
  const data = { ...docData };

  if (data.role !== 'company') {
    console.warn(`[authService] User ${id}: Role is not 'company'. Skipping profile conversion. Role: ${data.role}`);
    return null; 
  }

  if (data.createdAt && data.createdAt instanceof Timestamp) {
    data.createdAt = data.createdAt.toDate().toISOString();
  } else {
    console.warn(`[authService] Company User ${id}: createdAt is not a Timestamp or is missing. Defaulting. Original:`, data.createdAt);
    data.createdAt = new Date().toISOString(); 
  }

  if (data.membershipEndDate && data.membershipEndDate instanceof Timestamp) {
    data.membershipEndDate = data.membershipEndDate.toDate().toISOString();
  } else if (data.membershipEndDate === null || data.membershipEndDate === undefined) {
    data.membershipEndDate = undefined; 
  } else {
     console.warn(`[authService] Company User ${id}: membershipEndDate is present but not a Timestamp. Setting to undefined. Original:`, data.membershipEndDate);
    data.membershipEndDate = undefined;
  }

  // Ensure isActive is explicitly boolean, default to false if undefined (for new users before admin approval)
  data.isActive = data.isActive === true; 

  const companyProfile: CompanyUserProfile = {
    id,
    email: data.email,
    password: data.password || '', 
    role: 'company',
    name: data.name, 
    isActive: data.isActive, 
    createdAt: data.createdAt,
    username: data.username || '',
    logoUrl: data.logoUrl || undefined,
    companyTitle: data.name, 
    category: data.category || 'Nakliyeci', 
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

export async function createCompanyUser(registrationData: CompanyRegisterData): Promise<{ profile: CompanyUserProfile | null; error?: string }> {
  try {
    const { password, isActive: initialIsActive, ...profileDataFromForm } = registrationData;
    if (!password) {
      return { profile: null, error: "Şifre kayıt için zorunludur." };
    }

    const usersRef = collection(db, USERS_COLLECTION);
    const qEmail = query(usersRef, where("email", "==", profileDataFromForm.email));
    const emailCheckSnapshot = await getDocs(qEmail);
    if (!emailCheckSnapshot.empty) {
      return { profile: null, error: "Bu e-posta adresi zaten kayıtlı." };
    }
    
    const qUsername = query(usersRef, where("username", "==", profileDataFromForm.username));
    const usernameCheckSnapshot = await getDocs(qUsername);
    if (!usernameCheckSnapshot.empty) {
        return { profile: null, error: "Bu kullanıcı adı zaten alınmış." };
    }

    const companyData = profileDataFromForm as Omit<CompanyRegisterData, 'password' | 'isActive'>;

    if (!companyData.username || !companyData.name || !companyData.category || !companyData.contactFullName || !companyData.mobilePhone || !companyData.companyType || !companyData.addressCity || !companyData.fullAddress) {
        return { profile: null, error: "Lütfen tüm zorunlu alanları doldurun." };
    }

    const finalProfileDataForFirestore: Omit<CompanyUserProfile, 'id' | 'membershipEndDate'> & { password: string, membershipEndDate?: Timestamp | null } = {
      email: companyData.email,
      role: 'company',
      name: companyData.name, 
      password: password, 
      isActive: initialIsActive === undefined ? false : initialIsActive, // Use admin's choice, default to false for public reg
      createdAt: Timestamp.fromDate(new Date()),
      username: companyData.username,
      category: companyData.category,
      logoUrl: companyData.logoUrl || undefined,
      companyTitle: companyData.name, 
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
      membershipEndDate: null, 
      ownedVehicles: [], 
      authDocuments: [], 
    };
    
    const docRef = await addDoc(collection(db, USERS_COLLECTION), finalProfileDataForFirestore);
    const savedDoc = await getDoc(docRef); 

    if (savedDoc.exists()) {
        const converted = convertToUserProfile(savedDoc.data(), savedDoc.id);
        if (converted) return { profile: converted };
        return { profile: null, error: "Oluşturulan profil geçerli bir firma profili değil."};
    }
    return { profile: null, error: "Profil oluşturulduktan sonra doğrulanamadı." };

  } catch (error: any) {
    console.error("[authService.ts] Error during Firestore profile creation:", error);
    let errorMessage = "Profil oluşturma sırasında bilinmeyen bir hata oluştu.";
    if (error.message) errorMessage = error.message;
    else if (typeof error === 'string') errorMessage = error;
    return { profile: null, error: `Firestore işlemi başarısız: ${errorMessage}` };
  }
}

export async function getAllUserProfiles(): Promise<CompanyUserProfile[]> {
  try {
    // Query only for 'company' role users
    const q = query(collection(db, USERS_COLLECTION), where('role', '==', 'company'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const companyProfiles: CompanyUserProfile[] = [];
    querySnapshot.docs.forEach(doc => {
        const profile = convertToUserProfile(doc.data(), doc.id);
        if (profile) { // convertToUserProfile will return null if role is not company
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

export async function updateUserProfile(uid: string, data: Partial<CompanyUserProfile>): Promise<boolean> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const updateData: any = { ...data };

    delete updateData.id;
    delete updateData.password; 
    delete updateData.email; 
    delete updateData.role; 
    delete updateData.createdAt; 

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
    console.log(`[authService.ts] Firestore profile for UID ${uid} deleted.`);
    return true;
  } catch (error) {
    console.error("[authService.ts] Error deleting user profile from Firestore: ", error);
    return false;
  }
}

    
