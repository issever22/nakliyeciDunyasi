
'use server';
import { db } from '@/lib/firebase';
import type { CompanyNote } from '@/types';
import { 
  collection, 
  addDoc, 
  getDocs, 
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
        createdAt: Timestamp.fromDate(new Date()),
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding note for company ${companyId}: `, error);
    return null;
  }
};
