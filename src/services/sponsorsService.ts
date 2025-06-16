
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
  getDoc
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
