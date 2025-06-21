
'use server';

import { db } from '@/lib/firebase';
import type { UserProfile, CompanyUserProfile, RegisterData, CompanyRegisterData, UserRole, CompanyCategory, CompanyFilterOptions, SponsorshipLocation } from '@/types';
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
  limit,
  startAfter,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { parseISO, isValid } from 'date-fns';

const USERS_COLLECTION = 'users';

const convertToUserProfile = (docData: DocumentData, id: string): CompanyUserProfile | null => {
  const data = { ...docData };

  const isCompanyByRole = data.role === 'company';
  if (!isCompanyByRole) {
    return null;
  }

  const roleToAssign: 'company' = 'company';
  const displayName = data.companyTitle || data.name; 

  const companyProfileBase: Omit<CompanyUserProfile, 'createdAt' | 'membershipEndDate'> = {
    id,
    email: data.email || '',
    password: data.password || '', 
    role: roleToAssign,
    name: displayName || '',
    isActive: data.isActive === true, 
    username: data.username || '',
    logoUrl: data.logoUrl || undefined,
    companyTitle: displayName || '', 
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
    ownedVehicles: Array.isArray(data.ownedVehicles) ? data.ownedVehicles : [],
    authDocuments: Array.isArray(data.authDocuments) ? data.authDocuments : [],
    sponsorships: Array.isArray(data.sponsorships) ? data.sponsorships : [],
  };

  let createdAtStr: string;
  if (data.createdAt && data.createdAt instanceof Timestamp) {
    createdAtStr = data.createdAt.toDate().toISOString();
  } else {
    createdAtStr = new Date().toISOString();
  }

  let membershipEndDateStr: string | undefined = undefined;
  if (data.membershipEndDate && data.membershipEndDate instanceof Timestamp) {
    membershipEndDateStr = data.membershipEndDate.toDate().toISOString();
  } else if (data.membershipEndDate === null || data.membershipEndDate === undefined) {
    membershipEndDateStr = undefined;
  }

  return {
    ...companyProfileBase,
    createdAt: createdAtStr,
    membershipEndDate: membershipEndDateStr,
  };
};

export async function getPaginatedAdminUsers(options: {
  lastVisibleDoc?: QueryDocumentSnapshot<DocumentData> | null;
  pageSize?: number;
  filters?: {
    showOnlyMembers?: boolean;
    showOnlyPendingApproval?: boolean;
    showOnlySponsors?: boolean;
  };
}): Promise<{
  users: CompanyUserProfile[];
  newLastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null;
  error?: { message: string; indexCreationUrl?: string };
}> {
  const { lastVisibleDoc = null, pageSize = 15, filters = {} } = options;
  
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const queryConstraints: QueryConstraint[] = [];

    queryConstraints.push(where('role', '==', 'company'));

    if (filters.showOnlyMembers) {
      queryConstraints.push(where('membershipStatus', '!=', 'Yok'));
    }
    if (filters.showOnlyPendingApproval) {
      queryConstraints.push(where('isActive', '==', false));
    }
    if (filters.showOnlySponsors) {
      queryConstraints.push(where('sponsorships', '!=', []));
    }

    queryConstraints.push(orderBy('createdAt', 'desc'));

    if (lastVisibleDoc) {
      queryConstraints.push(startAfter(lastVisibleDoc));
    }
    queryConstraints.push(limit(pageSize));

    const q = query(usersRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    const users = querySnapshot.docs
      .map(doc => convertToUserProfile(doc.data(), doc.id))
      .filter((profile): profile is CompanyUserProfile => profile !== null);

    const newLastDoc = querySnapshot.docs.length === pageSize ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

    return { users, newLastVisibleDoc: newLastDoc, error: undefined };
  } catch (error: any) {
    console.error("[authService.ts - getPaginatedAdminUsers] Error:", error);
    let errorMessage = "Kullanıcılar yüklenirken bilinmeyen bir hata oluştu.";
    let indexCreationUrl: string | undefined = undefined;

    if (error.code === 'failed-precondition') {
        errorMessage = error.message || "Eksik Firestore dizini. Lütfen sunucu konsolunu kontrol edin.";
        const urlRegex = /(https:\/\/console\.firebase\.google\.com\/project\/[^/]+\/firestore\/indexes\?create_composite=[^ ]+)/;
        const match = errorMessage.match(urlRegex);
        if (match && match[0]) {
            indexCreationUrl = match[0];
        }
    } else {
        errorMessage = error.message;
    }
    return { users: [], newLastVisibleDoc: null, error: { message: errorMessage, indexCreationUrl } };
  }
}

export async function getPaginatedCompanies(options: {
  lastVisibleDoc?: QueryDocumentSnapshot<DocumentData> | null;
  pageSize?: number;
  filters?: CompanyFilterOptions;
}): Promise<{
  companies: CompanyUserProfile[];
  newLastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null;
  error?: { message: string; indexCreationUrl?: string };
}> {
  const { lastVisibleDoc = null, pageSize = 12, filters = {} } = options;
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const queryConstraints: QueryConstraint[] = [];

    queryConstraints.push(where('role', '==', 'company'));
    queryConstraints.push(where('isActive', '==', true));

    if (filters.category) {
      queryConstraints.push(where('category', '==', filters.category));
    }
    if (filters.city) {
      queryConstraints.push(where('addressCity', '==', filters.city));
    }

    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm;
      queryConstraints.push(where('name', '>=', searchTerm));
      queryConstraints.push(where('name', '<=', searchTerm + '\uf8ff'));
      queryConstraints.push(orderBy('name', 'asc'));
    } else {
      queryConstraints.push(orderBy('createdAt', 'desc'));
    }

    if (lastVisibleDoc) {
      queryConstraints.push(startAfter(lastVisibleDoc));
    }
    queryConstraints.push(limit(pageSize));

    const q = query(usersRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    const companies = querySnapshot.docs
      .map(doc => convertToUserProfile(doc.data(), doc.id))
      .filter((profile): profile is CompanyUserProfile => profile !== null);

    const newLastDoc = querySnapshot.docs.length === pageSize ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

    return { companies, newLastVisibleDoc: newLastDoc };
  } catch (error: any) {
    console.error("[authService.ts - getPaginatedCompanies] Error:", error);
    let errorMessage = "Firmalar yüklenirken bir hata oluştu.";
    let indexCreationUrl: string | undefined = undefined;

    if (error.code === 'failed-precondition') {
        errorMessage = error.message || "Gerekli veritabanı dizini eksik. Lütfen sunucu loglarını kontrol edin.";
        const urlRegex = /(https:\/\/console\.firebase\.google\.com\/project\/[^/]+\/firestore\/indexes\?create_composite=[^ ]+)/;
        const match = errorMessage.match(urlRegex);
        if (match && match[0]) {
            indexCreationUrl = match[0];
        }
    } else {
        errorMessage = error.message;
    }
    return { companies: [], newLastVisibleDoc: null, error: { message: errorMessage, indexCreationUrl } };
  }
}


export async function getUserProfile(uid: string): Promise<CompanyUserProfile | null> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const profile = convertToUserProfile(userDocSnap.data(), userDocSnap.id);
      return profile;
    }
    return null;
  } catch (error) {
    console.error("[authService.ts - getUserProfile] Error fetching user profile from Firestore:", error);
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

    const finalProfileDataForFirestore: Omit<CompanyUserProfile, 'id' | 'membershipEndDate' | 'createdAt'> & { password: string, membershipEndDate?: Timestamp | null, createdAt: Timestamp } = {
      email: companyData.email,
      role: 'company', 
      name: companyData.name,
      password: password,
      isActive: initialIsActive === undefined ? false : initialIsActive, // Default to false (pending approval)
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
      sponsorships: [],
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
    console.error("[authService.ts - createCompanyUser] Error during Firestore profile creation:", error);
    let errorMessage = "Profil oluşturma sırasında bilinmeyen bir hata oluştu.";
    if (error.message) errorMessage = error.message;
    else if (typeof error === 'string') errorMessage = error;
    return { profile: null, error: `Firestore işlemi başarısız: ${errorMessage}` };
  }
}

export async function getAllUserProfiles(): Promise<CompanyUserProfile[]> {
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
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
    console.error("[authService.ts - getAllUserProfiles] Error fetching all user profiles from Firestore: ", error);
     if (error.code === 'failed-precondition') {
          const errorMessage = error.message || "Eksik Firestore dizini (admin kullanıcı listesi - muhtemelen createdAt). Lütfen sunucu konsolunu kontrol edin.";
          const urlRegex = /(https:\/\/console\.firebase\.google\.com\/project\/[^/]+\/firestore\/indexes\?create_composite=[^ ]+)/;
          const match = errorMessage.match(urlRegex);
          if (match && match[0]) {
              const indexCreationUrl = match[0];
              console.error(`!!! FIRESTORE INDEX URL (getAllUserProfiles): ${indexCreationUrl}`);
          }
     }
    return [];
  }
}

export async function getCompanyProfilesByCategory(categoryValue: CompanyCategory): Promise<CompanyUserProfile[]> {
  try {
    const qConstraints: QueryConstraint[] = [
      where('category', '==', categoryValue),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    ];
    
    const q = query(collection(db, USERS_COLLECTION), ...qConstraints);
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
    console.error(`[authService.ts - getCompanyProfilesByCategory] Error fetching profiles for category ${categoryValue}: `, error);
    if (error.code === 'failed-precondition') {
      const errorMessage = error.message || `Eksik Firestore dizini (getCompanyProfilesByCategory - ${categoryValue}). Lütfen sunucu konsolunu kontrol edin.`;
      const urlRegex = /(https:\/\/console\.firebase\.google\.com\/project\/[^/]+\/firestore\/indexes\?create_composite=[^ ]+)/;
      const match = errorMessage.match(urlRegex);
      if (match && match[0]) {
          const indexCreationUrl = match[0];
          console.warn(`!!! FIRESTORE INDEX URL (getCompanyProfilesByCategory): ${indexCreationUrl}`);
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
         delete updateData.membershipEndDate;
      }
    }
    
    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    console.error("[authService.ts - updateUserProfile] Error updating user profile in Firestore: ", error);
    return false;
  }
}

export async function deleteUserProfile(uid: string): Promise<boolean> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("[authService.ts - deleteUserProfile] Error deleting user profile from Firestore: ", error);
    return false;
  }
}

// SPONSORSHIP FUNCTIONS
export async function addSponsorshipsToUser(
  companyId: string,
  countryCodes: string[],
  cityNames: string[]
): Promise<{ success: boolean; message: string; addedCount: number; skippedCount: number }> {
  if (!companyId) {
    return { success: false, message: "Firma seçimi zorunludur.", addedCount: 0, skippedCount: 0 };
  }
  if (countryCodes.length === 0 && cityNames.length === 0) {
    return { success: false, message: "En az bir ülke veya şehir seçilmelidir.", addedCount: 0, skippedCount: 0 };
  }

  try {
    const userDocRef = doc(db, 'users', companyId);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return { success: false, message: "Seçilen firma bulunamadı.", addedCount: 0, skippedCount: 0 };
    }
    const userData = userDocSnap.data();
    const existingSponsorships: SponsorshipLocation[] = userData.sponsorships || [];
    const existingSponsorshipsSet = new Set(existingSponsorships.map(s => `${s.type}:${s.name}`));

    let addedCount = 0;
    
    const newSponsorships: SponsorshipLocation[] = [];

    countryCodes.forEach(code => {
        if (!existingSponsorshipsSet.has(`country:${code}`)) {
            newSponsorships.push({ type: 'country', name: code });
            addedCount++;
        }
    });

    cityNames.forEach(name => {
        if (!existingSponsorshipsSet.has(`city:${name}`)) {
            newSponsorships.push({ type: 'city', name: name });
            addedCount++;
        }
    });

    if (addedCount === 0) {
        return { success: true, message: 'Seçilen tüm sponsorluklar zaten mevcut, yeni kayıt eklenmedi.', addedCount: 0, skippedCount: countryCodes.length + cityNames.length };
    }

    const allSponsorships = [...existingSponsorships, ...newSponsorships];
    
    await updateDoc(userDocRef, {
        sponsorships: allSponsorships,
    });

    let message = `${addedCount} yeni sponsorluk eklendi.`;
    const skippedCount = countryCodes.length + cityNames.length - addedCount;
    if (skippedCount > 0) message += ` ${skippedCount} mevcut sponsorluk atlandı.`;

    return { success: true, message, addedCount, skippedCount };
  } catch (error) {
    console.error("Error adding sponsorships to user: ", error);
    return { success: false, message: "Sponsorluklar eklenirken bir hata oluştu.", addedCount: 0, skippedCount: 0 };
  }
}

export async function getSponsoredCompanies(): Promise<CompanyUserProfile[]> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('sponsorships', '!=', []));
    const querySnapshot = await getDocs(q);

    const sponsoredCompanies: CompanyUserProfile[] = [];
    querySnapshot.docs.forEach(doc => {
        const profile = convertToUserProfile(doc.data(), doc.id);
        if (profile) {
            sponsoredCompanies.push(profile);
        }
    });
    
    return sponsoredCompanies;
  } catch (error: any) {
    console.error("Error fetching sponsored companies: ", error);
     if (error.code === 'failed-precondition') {
        const urlRegex = /(https:\/\/console\.firebase\.google\.com\/project\/[^/]+\/firestore\/indexes\?create_composite=[^ ]+)/;
        const match = error.message.match(urlRegex);
        if (match && match[0]) {
            console.error(`SPONSORSHIP INDEX MISSING: ${match[0]}`);
        }
     }
    return [];
  }
}

export async function updateSponsorshipsForUser(userId: string, sponsorships: SponsorshipLocation[]): Promise<{ success: boolean; message: string; }> {
  if (!userId) {
    return { success: false, message: "Firma ID'si zorunludur." };
  }

  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userDocRef, {
      sponsorships: sponsorships,
    });
    const message = sponsorships.length > 0 ? "Sponsorluklar başarıyla güncellendi." : "Tüm sponsorluklar kaldırıldı.";
    return { success: true, message };
  } catch (error) {
    console.error("Error updating sponsorships for user: ", error);
    return { success: false, message: "Sponsorluklar güncellenirken bir hata oluştu." };
  }
}

export const getActiveSponsorCompanyIds = async (): Promise<Set<string>> => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('sponsorships', '!=', []));
        const querySnapshot = await getDocs(q);

        const sponsorIds = new Set<string>();
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.sponsorships && Array.isArray(data.sponsorships) && data.sponsorships.length > 0) {
                 sponsorIds.add(doc.id);
            }
        });

        return sponsorIds;
    } catch (error) {
        console.error("Error fetching active sponsor company IDs: ", error);
        return new Set<string>();
    }
};
