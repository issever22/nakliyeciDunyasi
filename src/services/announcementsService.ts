
'use server';
import { db } from '@/lib/firebase';
import type { AnnouncementSetting, TargetAudience } from '@/types';
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
  DocumentData
} from 'firebase/firestore';
import { parseISO, isValid } from 'date-fns';

const ANNOUNCEMENTS_COLLECTION = 'settingsAnnouncements';

const convertToAnnouncementSetting = (docData: DocumentData, id: string): AnnouncementSetting => {
  const data = { ...docData };
  if (data.startDate && data.startDate instanceof Timestamp) {
    data.startDate = data.startDate.toDate().toISOString();
  } else if (data.startDate && typeof data.startDate === 'string' && isValid(parseISO(data.startDate))) {
    // Already ISO string, or was stored as string
  } else {
    data.startDate = undefined;
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
    data.createdAt = new Date().toISOString(); // Fallback
  }
  data.isActive = data.isActive === undefined ? true : data.isActive;
  return {
    id,
    ...data,
  } as AnnouncementSetting;
};

export const getAllAnnouncements = async (): Promise<AnnouncementSetting[]> => {
  try {
    const q = query(collection(db, ANNOUNCEMENTS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToAnnouncementSetting(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching announcements: ", error);
    return [];
  }
};

export const addAnnouncement = async (data: Omit<AnnouncementSetting, 'id' | 'createdAt'>): Promise<string | null> => {
  try {
    const dataToSave: any = {
        ...data,
        createdAt: Timestamp.fromDate(new Date()),
        isActive: data.isActive === undefined ? true : data.isActive,
    };
    if (data.startDate && isValid(parseISO(data.startDate))) {
        dataToSave.startDate = Timestamp.fromDate(parseISO(data.startDate));
    } else {
        dataToSave.startDate = null;
    }
    if (data.endDate && isValid(parseISO(data.endDate))) {
        dataToSave.endDate = Timestamp.fromDate(parseISO(data.endDate));
    } else {
        dataToSave.endDate = null;
    }

    const docRef = await addDoc(collection(db, ANNOUNCEMENTS_COLLECTION), dataToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error adding announcement: ", error);
    return null;
  }
};

export const updateAnnouncement = async (id: string, data: Partial<Omit<AnnouncementSetting, 'id' | 'createdAt'>>): Promise<boolean> => {
  try {
    const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
    const dataToUpdate: any = { ...data };

    if (dataToUpdate.hasOwnProperty('startDate')) {
        if (dataToUpdate.startDate && typeof dataToUpdate.startDate === 'string' && isValid(parseISO(dataToUpdate.startDate))) {
            dataToUpdate.startDate = Timestamp.fromDate(parseISO(dataToUpdate.startDate));
        } else {
            dataToUpdate.startDate = null; // Set to null if invalid or empty
        }
    }
    if (dataToUpdate.hasOwnProperty('endDate')) {
        if (dataToUpdate.endDate && typeof dataToUpdate.endDate === 'string' && isValid(parseISO(dataToUpdate.endDate))) {
            dataToUpdate.endDate = Timestamp.fromDate(parseISO(dataToUpdate.endDate));
        } else {
            dataToUpdate.endDate = null; // Set to null if invalid or empty
        }
    }
    delete dataToUpdate.createdAt; 
    await updateDoc(docRef, dataToUpdate);
    return true;
  } catch (error) {
    console.error("Error updating announcement: ", error);
    return false;
  }
};

export const deleteAnnouncement = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting announcement: ", error);
    return false;
  }
};
