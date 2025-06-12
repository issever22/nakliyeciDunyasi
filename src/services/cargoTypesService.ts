
'use server';
import { db } from '@/lib/firebase';
import type { CargoTypeSetting } from '@/types';
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

const CARGO_TYPES_COLLECTION = 'settingsCargoTypes';

const convertToCargoTypeSetting = (docData: DocumentData, id: string): CargoTypeSetting => {
  return {
    id,
    name: docData.name || '',
    category: docData.category || '',
    isActive: docData.isActive === undefined ? true : docData.isActive,
  } as CargoTypeSetting;
};

export const getAllCargoTypes = async (): Promise<CargoTypeSetting[]> => {
  try {
    const q = query(collection(db, CARGO_TYPES_COLLECTION), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToCargoTypeSetting(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching cargo types: ", error);
    return [];
  }
};

export const addCargoType = async (data: Omit<CargoTypeSetting, 'id'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, CARGO_TYPES_COLLECTION), {
        ...data,
        isActive: data.isActive === undefined ? true : data.isActive,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding cargo type: ", error);
    return null;
  }
};

export const updateCargoType = async (id: string, data: Partial<Omit<CargoTypeSetting, 'id'>>): Promise<boolean> => {
  try {
    const docRef = doc(db, CARGO_TYPES_COLLECTION, id);
    await updateDoc(docRef, data);
    return true;
  } catch (error) {
    console.error("Error updating cargo type: ", error);
    return false;
  }
};

export const deleteCargoType = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, CARGO_TYPES_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting cargo type: ", error);
    return false;
  }
};
