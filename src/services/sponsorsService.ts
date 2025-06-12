
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
import { parseISO } from 'date-fns';

const SPONSORS_COLLECTION = 'sponsors';

const convertToSponsor = (docData: DocumentData, id: string): Sponsor => {
  const data = { ...docData };
  
  if (data.startDate && data.startDate.toDate) {
    data.startDate = data.startDate.toDate().toISOString();
  } else if (typeof data.startDate === 'string') {
    // already string
  } else {
     data.startDate = new Date().toISOString(); // fallback
  }

  if (data.endDate && data.endDate.toDate) {
    data.endDate = data.endDate.toDate().toISOString();
  } else if (typeof data.endDate === 'string') {
    // already string
  } else {
      data.endDate = undefined; // ensure it is undefined if not present
  }

  if (data.createdAt && data.createdAt.toDate) {
    data.createdAt = data.createdAt.toDate().toISOString();
  } else if (typeof data.createdAt === 'string') {
    // already string
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
    const dataToSave = {
      ...sponsorData,
      startDate: Timestamp.fromDate(parseISO(sponsorData.startDate)),
      endDate: sponsorData.endDate ? Timestamp.fromDate(parseISO(sponsorData.endDate)) : null,
      createdAt: Timestamp.fromDate(new Date()),
      isActive: sponsorData.isActive === undefined ? true : sponsorData.isActive,
    };
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

    if (dataToUpdate.startDate && typeof dataToUpdate.startDate === 'string') {
      dataToUpdate.startDate = Timestamp.fromDate(parseISO(dataToUpdate.startDate));
    }
    if (dataToUpdate.endDate && typeof dataToUpdate.endDate === 'string') {
      dataToUpdate.endDate = Timestamp.fromDate(parseISO(dataToUpdate.endDate));
    } else if (dataToUpdate.endDate === null || dataToUpdate.endDate === undefined) {
        dataToUpdate.endDate = null; // Allow clearing the date
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
