
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
import { parseISO, format } from 'date-fns';

const ANNOUNCEMENTS_COLLECTION = 'settingsAnnouncements';

const convertToAnnouncementSetting = (docData: DocumentData, id: string): AnnouncementSetting => {
  const data = { ...docData };
  if (data.startDate && data.startDate.toDate) {
    data.startDate = data.startDate.toDate().toISOString();
  }
  if (data.endDate && data.endDate.toDate) {
    data.endDate = data.endDate.toDate().toISOString();
  }
  if (data.createdAt && data.createdAt.toDate) {
    data.createdAt = data.createdAt.toDate().toISOString();
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
    const dataToSave = {
        ...data,
        startDate: data.startDate ? Timestamp.fromDate(parseISO(data.startDate)) : null,
        endDate: data.endDate ? Timestamp.fromDate(parseISO(data.endDate)) : null,
        createdAt: Timestamp.fromDate(new Date()),
        isActive: data.isActive === undefined ? true : data.isActive,
    };
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
    if (dataToUpdate.startDate && typeof dataToUpdate.startDate === 'string') {
        dataToUpdate.startDate = Timestamp.fromDate(parseISO(dataToUpdate.startDate));
    } else if (dataToUpdate.startDate === null || dataToUpdate.startDate === undefined) {
        dataToUpdate.startDate = null;
    }
    if (dataToUpdate.endDate && typeof dataToUpdate.endDate === 'string') {
        dataToUpdate.endDate = Timestamp.fromDate(parseISO(dataToUpdate.endDate));
    } else if (dataToUpdate.endDate === null || dataToUpdate.endDate === undefined) {
        dataToUpdate.endDate = null;
    }
    delete dataToUpdate.createdAt; // Don't update createdAt
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
