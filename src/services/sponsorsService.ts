
'use server';
import { db } from '@/lib/firebase';
import type { Sponsor, SponsorEntityType } from '@/types';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  Timestamp,
  DocumentData,
  getDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { parseISO, isValid } from 'date-fns';

const SPONSORS_COLLECTION = 'sponsors';

const convertToSponsor = (docData: DocumentData, id: string): Sponsor => {
  const data = { ...docData };
  
  if (data.startDate && data.startDate instanceof Timestamp) {
    data.startDate = data.startDate.toDate().toISOString();
  } else {
    console.warn(`[sponsorsService] Sponsor ${id}: startDate is not a Timestamp or is missing. Original:`, data.startDate);
    data.startDate = new Date().toISOString(); // fallback, as startDate is mandatory
  }

  if (data.endDate && data.endDate instanceof Timestamp) {
    data.endDate = data.endDate.toDate().toISOString();
  } else {
    console.warn(`[sponsorsService] Sponsor ${id}: endDate is not a Timestamp or is missing. Original:`, data.endDate);
    data.endDate = undefined; // endDate is optional
  }

  if (data.createdAt && data.createdAt instanceof Timestamp) {
    data.createdAt = data.createdAt.toDate().toISOString();
  } else {
    console.warn(`[sponsorsService] Sponsor ${id}: createdAt is not a Timestamp or is missing. Defaulting. Original:`, data.createdAt);
    data.createdAt = new Date().toISOString(); // fallback
  }
  
  data.isActive = data.isActive === undefined ? true : data.isActive;

  return {
    id,
    ...data,
  } as Sponsor;
};

export const getAllSponsors = async (): Promise<Sponsor[]> => {
  try {
    const sponsorsRef = collection(db, SPONSORS_COLLECTION);
    const q = query(sponsorsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToSponsor(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching sponsors: ", error);
    return [];
  }
};

export const addSponsor = async (sponsorData: Omit<Sponsor, 'id' | 'createdAt'>): Promise<string | null> => {
  try {
    const dataToSave: any = {
      ...sponsorData,
      createdAt: Timestamp.fromDate(new Date()),
      isActive: sponsorData.isActive === undefined ? true : sponsorData.isActive,
    };

    if (sponsorData.startDate && isValid(parseISO(sponsorData.startDate))) {
        dataToSave.startDate = Timestamp.fromDate(parseISO(sponsorData.startDate));
    } else {
        // startDate is mandatory per type, should ideally throw error or handle
        console.error("[sponsorsService] addSponsor: Invalid or missing startDate.");
        return null; 
    }

    if (sponsorData.endDate && isValid(parseISO(sponsorData.endDate))) {
        dataToSave.endDate = Timestamp.fromDate(parseISO(sponsorData.endDate));
    } else {
        dataToSave.endDate = null; // endDate is optional, Firestore handles null
    }

    const docRef = await addDoc(collection(db, SPONSORS_COLLECTION), dataToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error adding sponsor: ", error);
    return null;
  }
};

export const addSponsorshipsBatch = async (
  companyId: string,
  countryCodes: string[],
  cityNames: string[],
  startDate: string,
  endDate?: string
): Promise<{ success: boolean; message: string; addedCount: number; skippedCount: number }> => {
  if (!companyId) {
    return { success: false, message: "Firma seçimi zorunludur.", addedCount: 0, skippedCount: 0 };
  }
  if (countryCodes.length === 0 && cityNames.length === 0) {
    return { success: false, message: "En az bir ülke veya şehir seçilmelidir.", addedCount: 0, skippedCount: 0 };
  }

  try {
    const companyDocRef = doc(db, 'users', companyId);
    const companyDocSnap = await getDoc(companyDocRef);
    if (!companyDocSnap.exists()) {
      return { success: false, message: "Seçilen firma bulunamadı.", addedCount: 0, skippedCount: 0 };
    }
    const companyData = companyDocSnap.data();

    // Fetch existing sponsorships for this company
    const sponsorsRef = collection(db, SPONSORS_COLLECTION);
    const q = query(sponsorsRef, where('companyId', '==', companyId));
    const existingSponsorsSnapshot = await getDocs(q);
    const existingSponsorships = new Set(
      existingSponsorsSnapshot.docs.map(d => `${d.data().entityType}:${d.data().entityName}`)
    );

    const batch = writeBatch(db);
    let addedCount = 0;
    let skippedCount = 0;

    const sponsorBase = {
      companyId: companyId,
      name: companyData.name || 'Bilinmeyen Firma',
      logoUrl: companyData.logoUrl || undefined,
      linkUrl: companyData.website || undefined,
      startDate: Timestamp.fromDate(parseISO(startDate)),
      endDate: endDate ? Timestamp.fromDate(parseISO(endDate)) : null,
      isActive: true,
      createdAt: Timestamp.fromDate(new Date()),
    };

    // Add country sponsorships
    for (const code of countryCodes) {
      if (!existingSponsorships.has(`country:${code}`)) {
        const newSponsorDocRef = doc(collection(db, SPONSORS_COLLECTION));
        batch.set(newSponsorDocRef, {
          ...sponsorBase,
          entityType: 'country',
          entityName: code,
        });
        addedCount++;
      } else {
        skippedCount++;
      }
    }

    // Add city sponsorships
    for (const name of cityNames) {
      if (!existingSponsorships.has(`city:${name}`)) {
        const newSponsorDocRef = doc(collection(db, SPONSORS_COLLECTION));
        batch.set(newSponsorDocRef, {
          ...sponsorBase,
          entityType: 'city',
          entityName: name,
        });
        addedCount++;
      } else {
        skippedCount++;
      }
    }

    if (addedCount > 0) {
      await batch.commit();
    }
    
    let message = '';
    if (addedCount > 0) message += `${addedCount} yeni sponsorluk eklendi. `;
    if (skippedCount > 0) message += `${skippedCount} mevcut sponsorluk atlandı.`;
    if (addedCount === 0 && skippedCount > 0) message = 'Seçilen tüm sponsorluklar zaten mevcut, yeni kayıt eklenmedi.';
    if (addedCount === 0 && skippedCount === 0) message = 'Eklenecek yeni sponsorluk bulunamadı.';


    return { success: true, message, addedCount, skippedCount };
  } catch (error) {
    console.error("Error adding sponsorships in batch: ", error);
    return { success: false, message: "Sponsorluklar eklenirken bir hata oluştu.", addedCount: 0, skippedCount: 0 };
  }
};

export const updateSponsor = async (id: string, sponsorData: Partial<Omit<Sponsor, 'id' | 'createdAt'>>): Promise<boolean> => {
  try {
    const docRef = doc(db, SPONSORS_COLLECTION, id);
    const dataToUpdate: any = { ...sponsorData };

    if (dataToUpdate.hasOwnProperty('startDate')) {
      if (dataToUpdate.startDate && typeof dataToUpdate.startDate === 'string' && isValid(parseISO(dataToUpdate.startDate))) {
        dataToUpdate.startDate = Timestamp.fromDate(parseISO(dataToUpdate.startDate));
      } else {
          // startDate is mandatory, so if it's invalid/null during update, it's problematic.
          // Depending on business logic, either disallow update or remove field.
          console.warn(`[sponsorsService] updateSponsor: Invalid or missing startDate for sponsor ${id}. Field not updated or set to null based on logic.`);
          delete dataToUpdate.startDate; // Or set to a valid default if applicable
      }
    }
    if (dataToUpdate.hasOwnProperty('endDate')) {
      if (dataToUpdate.endDate && typeof dataToUpdate.endDate === 'string' && isValid(parseISO(dataToUpdate.endDate))) {
        dataToUpdate.endDate = Timestamp.fromDate(parseISO(dataToUpdate.endDate));
      } else {
        dataToUpdate.endDate = null; 
      }
    }
    
    delete dataToUpdate.id;
    delete dataToUpdate.createdAt;

    await updateDoc(docRef, dataToUpdate);
    return true;
  } catch (error) {
    console.error("Error updating sponsor: ", error);
    return false;
  }
};

export const deleteSponsor = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, SPONSORS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting sponsor: ", error);
    return false;
  }
};
