
'use server';
import { db } from '@/lib/firebase';
import type { TransportTypeSetting, ApplicableTo } from '@/types';
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

const TRANSPORT_TYPES_COLLECTION = 'settingsTransportTypes';

const convertToTransportTypeSetting = (docData: DocumentData, id: string): TransportTypeSetting => {
  return {
    id,
    name: docData.name || '',
    description: docData.description || '',
    applicableTo: docData.applicableTo || 'Ticari',
    isActive: docData.isActive === undefined ? true : docData.isActive,
  } as TransportTypeSetting;
};

export const getAllTransportTypes = async (): Promise<TransportTypeSetting[]> => {
  try {
    const q = query(collection(db, TRANSPORT_TYPES_COLLECTION), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToTransportTypeSetting(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching transport types: ", error);
    return [];
  }
};

export const addTransportType = async (data: Omit<TransportTypeSetting, 'id'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, TRANSPORT_TYPES_COLLECTION), {
        ...data,
        isActive: data.isActive === undefined ? true : data.isActive,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding transport type: ", error);
    return null;
  }
};

export const updateTransportType = async (id: string, data: Partial<Omit<TransportTypeSetting, 'id'>>): Promise<boolean> => {
  try {
    const docRef = doc(db, TRANSPORT_TYPES_COLLECTION, id);
    await updateDoc(docRef, data);
    return true;
  } catch (error) {
    console.error("Error updating transport type: ", error);
    return false;
  }
};

export const deleteTransportType = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, TRANSPORT_TYPES_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting transport type: ", error);
    return false;
  }
};
