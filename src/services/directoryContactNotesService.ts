
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
    type: data.type || 'note',
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

export const addDirectoryContactNote = async (contactId: string, data: Omit<CompanyNote, 'id' | 'createdAt'>): Promise<string | null> => {
  if (!contactId) return null;
  try {
    const notesRef = collection(db, DIRECTORY_CONTACTS_COLLECTION, contactId, NOTES_SUBCOLLECTION);
    const docRef = await addDoc(notesRef, {
        ...data,
        createdAt: Timestamp.fromDate(new Date()),
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding note for directory contact ${contactId}: `, error);
    return null;
  }
};

export const updateDirectoryContactNote = async (contactId: string, noteId: string, data: Partial<Omit<CompanyNote, 'id' | 'createdAt' | 'author'>>): Promise<boolean> => {
  if (!contactId || !noteId) return false;
  try {
    const noteRef = doc(db, DIRECTORY_CONTACTS_COLLECTION, contactId, NOTES_SUBCOLLECTION, noteId);
    await updateDoc(noteRef, data);
    return true;
  } catch (error) {
    console.error(`Error updating note ${noteId} for contact ${contactId}: `, error);
    return false;
  }
};

export const deleteDirectoryContactNote = async (contactId: string, noteId: string): Promise<boolean> => {
  if (!contactId || !noteId) return false;
  try {
    const noteRef = doc(db, DIRECTORY_CONTACTS_COLLECTION, contactId, NOTES_SUBCOLLECTION, noteId);
    await deleteDoc(noteRef);
    return true;
  } catch (error) {
    console.error(`Error deleting note ${noteId} for contact ${contactId}: `, error);
    return false;
  }
};
