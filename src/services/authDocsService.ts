
'use server';
import { db } from '@/lib/firebase';
import type { AuthDocSetting, RequiredFor } from '@/types';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  DocumentData
} from 'firebase/firestore';

const AUTH_DOCS_COLLECTION = 'settingsAuthDocs';

const convertToAuthDocSetting = (docData: DocumentData, id: string): AuthDocSetting => {
  return {
    id,
    name: docData.name || '',
    requiredFor: docData.requiredFor || 'Firma',
    details: docData.details || '',
    isActive: docData.isActive === undefined ? true : docData.isActive,
  } as AuthDocSetting;
};

export const getAllAuthDocs = async (): Promise<AuthDocSetting[]> => {
  try {
    const q = query(collection(db, AUTH_DOCS_COLLECTION), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToAuthDocSetting(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching auth docs: ", error);
    return [];
  }
};

export const addAuthDoc = async (data: Omit<AuthDocSetting, 'id'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, AUTH_DOCS_COLLECTION), {
        ...data,
        isActive: data.isActive === undefined ? true : data.isActive,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding auth doc: ", error);
    return null;
  }
};

export const updateAuthDoc = async (id: string, data: Partial<Omit<AuthDocSetting, 'id'>>): Promise<boolean> => {
  try {
    const docRef = doc(db, AUTH_DOCS_COLLECTION, id);
    await updateDoc(docRef, data);
    return true;
  } catch (error) {
    console.error("Error updating auth doc: ", error);
    return false;
  }
};

export const deleteAuthDoc = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, AUTH_DOCS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting auth doc: ", error);
    return false;
  }
};
