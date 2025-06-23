
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

const DIRECTORY_CONTACTS_COLLECTION = 'directoryContacts';
const NOTES_SUBCOLLECTION = 'notes';

const convertToDirectoryContactNote = (docData: DocumentData, id: string): CompanyNote => {
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
    type: 'note', // Manual contacts can only have 'note' type
  };
};

export const getDirectoryContactNotes = async (contactId: string): Promise<CompanyNote[]> => {
  if (!contactId) return [];
  try {
    const notesRef = collection(db, DIRECTORY_CONTACTS_COLLECTION, contactId, NOTES_SUBCOLLECTION);
    const q = query(notesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToDirectoryContactNote(doc.data(), doc.id));
  } catch (error) {
    console.error(`Error fetching notes for directory contact ${contactId}: `, error);
    return [];
  }
};

export const addDirectoryContactNote = async (contactId: string, data: Omit<CompanyNote, 'id' | 'createdAt' | 'type'>): Promise<boolean> => {
  if (!contactId) return false;
  try {
    const notesRef = collection(db, DIRECTORY_CONTACTS_COLLECTION, contactId, NOTES_SUBCOLLECTION);
    await addDoc(notesRef, {
        ...data,
        type: 'note', // Enforce note type
        createdAt: Timestamp.fromDate(new Date()),
    });
    return true;
  } catch (error) {
    console.error(`Error adding note for directory contact ${contactId}: `, error);
    return false;
  }
};
