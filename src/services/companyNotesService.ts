
'use server';
import { db } from '@/lib/firebase';
import type { CompanyNote } from '@/types';
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

const USERS_COLLECTION = 'users';
const NOTES_SUBCOLLECTION = 'notes';

const convertToCompanyNote = (docData: DocumentData, id: string): CompanyNote => {
  const data = { ...docData };
  let createdAtStr: string;
  if (data.createdAt && data.createdAt instanceof Timestamp) {
    createdAtStr = data.createdAt.toDate().toISOString();
  } else {
    createdAtStr = new Date().toISOString();
  }

  return {
    id,
    title: data.title || '',
    content: data.content || '',
    author: data.author || 'Admin',
    createdAt: createdAtStr,
    type: data.type || 'note',
  };
};

export const getCompanyNotes = async (companyId: string): Promise<CompanyNote[]> => {
  if (!companyId) return [];
  try {
    const notesRef = collection(db, USERS_COLLECTION, companyId, NOTES_SUBCOLLECTION);
    const q = query(notesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToCompanyNote(doc.data(), doc.id));
  } catch (error) {
    console.error(`Error fetching notes for company ${companyId}: `, error);
    return [];
  }
};

export const addCompanyNote = async (companyId: string, data: Omit<CompanyNote, 'id' | 'createdAt'>): Promise<string | null> => {
  if (!companyId) return null;
  try {
    const notesRef = collection(db, USERS_COLLECTION, companyId, NOTES_SUBCOLLECTION);
    const docRef = await addDoc(notesRef, {
        ...data,
        type: data.type || 'note',
        createdAt: Timestamp.fromDate(new Date()),
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding note for company ${companyId}: `, error);
    return null;
  }
};

export const updateCompanyNote = async (companyId: string, noteId: string, data: Partial<Omit<CompanyNote, 'id' | 'createdAt' | 'author'>>): Promise<boolean> => {
  if (!companyId || !noteId) return false;
  try {
    const noteRef = doc(db, USERS_COLLECTION, companyId, NOTES_SUBCOLLECTION, noteId);
    await updateDoc(noteRef, data);
    return true;
  } catch (error) {
    console.error(`Error updating note ${noteId} for company ${companyId}: `, error);
    return false;
  }
};

export const deleteCompanyNote = async (companyId: string, noteId: string): Promise<boolean> => {
  if (!companyId || !noteId) return false;
  try {
    const noteRef = doc(db, USERS_COLLECTION, companyId, NOTES_SUBCOLLECTION, noteId);
    await deleteDoc(noteRef);
    return true;
  } catch (error) {
    console.error(`Error deleting note ${noteId} for company ${companyId}: `, error);
    return false;
  }
};
