
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
  } else if (data.startDate && typeof data.startDate === 'string' && isValid(parseISO(data.startDate))) {
    // Already ISO string
  } else {
     data.startDate = new Date().toISOString(); // fallback
  }

  if (data.endDate && data.endDate instanceof Timestamp) {
    data.endDate = data.endDate.toDate().toISOString();
  } else if (data.endDate && typeof data.endDate === 'string' && isValid(parseISO(data.endDate))) {
    // Already ISO string
  } else {
      data.endDate = undefined; 
  }

  if (data.createdAt && data.createdAt instanceof Timestamp) {
    data.createdAt = data.createdAt.toDate().toISOString();
  } else if (data.createdAt && typeof data.createdAt === 'string' && isValid(parseISO(data.createdAt))) {
    // Already ISO string
  } else {
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
        return null; // Or throw error, startDate is mandatory per type
    }
    if (sponsorData.endDate && isValid(parseISO(sponsorData.endDate))) {
        dataToSave.endDate = Timestamp.fromDate(parseISO(sponsorData.endDate));
    } else {
        dataToSave.endDate = null; // endDate is optional
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
      } else if (!dataToUpdate.startDate) { // if it's null or undefined
          // startDate is mandatory, so this case should ideally not happen or be an error.
          // For robustness, we might prevent update or log error. Here, we'll remove it from update if invalid.
          delete dataToUpdate.startDate;
          console.warn(`updateSponsor: Invalid or missing startDate for sponsor ${id}. Field not updated.`);
      }
    }
    if (dataToUpdate.hasOwnProperty('endDate')) {
      if (dataToUpdate.endDate && typeof dataToUpdate.endDate === 'string' && isValid(parseISO(dataToUpdate.endDate))) {
        dataToUpdate.endDate = Timestamp.fromDate(parseISO(dataToUpdate.endDate));
      } else {
        dataToUpdate.endDate = null; // Set to null if invalid, empty, or explicitly set to null
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
