
'use server';
import { db } from '@/lib/firebase';
import type { DirectoryContact } from '@/types';
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

const CONTACTS_COLLECTION = 'directoryContacts';

const convertToDirectoryContact = (docData: DocumentData, id: string): DirectoryContact => {
  return {
    id,
    name: docData.name || '',
    companyName: docData.companyName || undefined,
    phone: docData.phone || '',
    email: docData.email || undefined,
    notes: docData.notes || undefined,
    createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate().toISOString() : new Date().toISOString(),
  };
};

export const getAllDirectoryContacts = async (): Promise<DirectoryContact[]> => {
  try {
    const q = query(collection(db, CONTACTS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToDirectoryContact(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching directory contacts: ", error);
    return [];
  }
};

export const addDirectoryContact = async (data: Partial<Omit<DirectoryContact, 'id' | 'createdAt'>>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, CONTACTS_COLLECTION), {
      ...data,
      createdAt: Timestamp.fromDate(new Date()),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding directory contact: ", error);
    return null;
  }
};

export const updateDirectoryContact = async (id: string, data: Partial<Omit<DirectoryContact, 'id' | 'createdAt'>>): Promise<boolean> => {
  try {
    const docRef = doc(db, CONTACTS_COLLECTION, id);
    await updateDoc(docRef, data);
    return true;
  } catch (error) {
    console.error("Error updating directory contact: ", error);
    return false;
  }
};

export const deleteDirectoryContact = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, CONTACTS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting directory contact: ", error);
    return false;
  }
};
