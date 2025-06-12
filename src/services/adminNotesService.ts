
'use server';
import { db } from '@/lib/firebase';
import type { AdminNoteSetting, NoteCategory } from '@/types';
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
import { parseISO } from 'date-fns';

const ADMIN_NOTES_COLLECTION = 'settingsAdminNotes';

const convertToAdminNoteSetting = (docData: DocumentData, id: string): AdminNoteSetting => {
  const data = { ...docData };
  if (data.createdDate && data.createdDate.toDate) {
    data.createdDate = data.createdDate.toDate().toISOString();
  } else {
    data.createdDate = new Date().toISOString(); // Fallback
  }
  if (data.lastModifiedDate && data.lastModifiedDate.toDate) {
    data.lastModifiedDate = data.lastModifiedDate.toDate().toISOString();
  } else {
    data.lastModifiedDate = new Date().toISOString(); // Fallback
  }
  
  return {
    id,
    title: data.title || '',
    content: data.content || '',
    category: data.category || 'Genel',
    isImportant: data.isImportant === undefined ? false : data.isImportant,
    createdDate: data.createdDate,
    lastModifiedDate: data.lastModifiedDate,
  } as AdminNoteSetting;
};

export const getAllAdminNotes = async (): Promise<AdminNoteSetting[]> => {
  try {
    const q = query(collection(db, ADMIN_NOTES_COLLECTION), orderBy('lastModifiedDate', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToAdminNoteSetting(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching admin notes: ", error);
    return [];
  }
};

export const addAdminNote = async (data: Omit<AdminNoteSetting, 'id' | 'createdDate' | 'lastModifiedDate'>): Promise<string | null> => {
  try {
    const now = Timestamp.fromDate(new Date());
    const docRef = await addDoc(collection(db, ADMIN_NOTES_COLLECTION), {
        ...data,
        isImportant: data.isImportant === undefined ? false : data.isImportant,
        createdDate: now,
        lastModifiedDate: now,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding admin note: ", error);
    return null;
  }
};

export const updateAdminNote = async (id: string, data: Partial<Omit<AdminNoteSetting, 'id' | 'createdDate' | 'lastModifiedDate'>>): Promise<boolean> => {
  try {
    const docRef = doc(db, ADMIN_NOTES_COLLECTION, id);
    const dataToUpdate = {
        ...data,
        lastModifiedDate: Timestamp.fromDate(new Date()),
    };
    delete (dataToUpdate as any).createdDate; // Ensure createdDate is not overwritten
    
    await updateDoc(docRef, dataToUpdate);
    return true;
  } catch (error) {
    console.error("Error updating admin note: ", error);
    return false;
  }
};

export const deleteAdminNote = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, ADMIN_NOTES_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting admin note: ", error);
    return false;
  }
};
