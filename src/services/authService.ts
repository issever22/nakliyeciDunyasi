
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
      logoUrl: data.logoUrl,
      companyTitle: data.name, // Explicitly setting companyTitle from name
      contactFullName: data.contactFullName || '',
      workPhone: data.workPhone,
      mobilePhone: data.mobilePhone || '',
      fax: data.fax,
      website: data.website,
      companyDescription: data.companyDescription,
      companyType: data.companyType || 'local',
      addressCity: data.addressCity || '',
      addressDistrict: data.addressDistrict,
      fullAddress: data.fullAddress || '',
      workingMethods: data.workingMethods || [],
      workingRoutes: data.workingRoutes || [],
      preferredCities: data.preferredCities || [],
      preferredCountries: data.preferredCountries || [],
      membershipStatus: data.membershipStatus,
      membershipEndDate: data.membershipEndDate,
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
    console.log(`No profile found for UID: ${uid}`);
    return null;
  } catch (error) {
    console.error("Error fetching user profile from Firestore:", error);
    return null;
  }
}

export async function createUserProfile(uid: string, registrationData: RegisterData): Promise<UserProfile | null> {
  try {
    const { password, ...profileData } = registrationData; // Exclude password

    const commonProfileData = {
      email: profileData.email,
      name: profileData.name, // This is fullName for individual, companyTitle for company
      role: profileData.role,
      isActive: true,
      createdAt: Timestamp.fromDate(new Date()),
    };

    let finalProfileData: Omit<UserProfile, 'id'>;

    if (profileData.role === 'individual') {
      finalProfileData = {
        ...commonProfileData,
        role: 'individual',
      } as Omit<IndividualUserProfile, 'id'>;
    } else if (profileData.role === 'company') {
      const companyData = profileData as CompanyRegisterData;
      finalProfileData = {
        ...commonProfileData,
        role: 'company',
        name: companyData.name, // This is the companyTitle
        username: companyData.username,
        logoUrl: companyData.logoUrl || undefined,
        companyTitle: companyData.name, // Explicitly from registration name
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
        workingMethods: companyData.workingMethods || [],
        workingRoutes: companyData.workingRoutes || [],
        preferredCities: companyData.preferredCities || [],
        preferredCountries: companyData.preferredCountries || [],
        membershipStatus: 'Yok', // Default for new company
        membershipEndDate: undefined,
      } as Omit<CompanyUserProfile, 'id'>;
    } else {
      console.error("Invalid role specified for profile creation:", profileData.role);
      return null;
    }
    
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userDocRef, finalProfileData);
    
    const savedDoc = await getDoc(userDocRef);
    if(savedDoc.exists()){
      return convertToUserProfile(savedDoc.data(), uid);
    }
    return null;

  } catch (error) {
    console.error("Error creating user profile in Firestore: ", error);
    return null;
  }
}
  
export async function getAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToUserProfile(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching all user profiles from Firestore: ", error);
    return [];
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<boolean> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const updateData = { ...data };

    // Remove fields that should not be directly updated or are managed by Firebase Auth
    delete updateData.id;
    delete (updateData as any).password; 
    delete updateData.email; // Email typically updated via Firebase Auth methods
    delete updateData.role; // Role shouldn't change after creation usually
    delete updateData.createdAt; // Should not be updated

    if (updateData.membershipEndDate && typeof updateData.membershipEndDate === 'string') {
      updateData.membershipEndDate = Timestamp.fromDate(parseISO(updateData.membershipEndDate)) as any;
    } else if (updateData.hasOwnProperty('membershipEndDate') && (updateData.membershipEndDate === null || updateData.membershipEndDate === undefined)) {
       (updateData as CompanyUserProfile).membershipEndDate = undefined; // Explicitly set to undefined if cleared
    }


    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating user profile in Firestore: ", error);
    return false;
  }
}

export async function deleteUserProfile(uid: string): Promise<boolean> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(docRef);
    // Note: This does NOT delete the Firebase Auth user.
    // Deleting a Firebase Auth user requires Admin SDK or client-side re-authentication and delete.
    // For simplicity, we're only deleting the Firestore profile record here.
    console.log(`Firestore profile for UID ${uid} deleted. Firebase Auth user may still exist.`);
    return true;
  } catch (error) {
    console.error("Error deleting user profile from Firestore: ", error);
    return false;
  }
}
