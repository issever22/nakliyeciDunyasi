
'use server';
import { db } from '@/lib/firebase';
import type { VehicleTypeSetting } from '@/types';
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

const VEHICLE_TYPES_COLLECTION = 'settingsVehicleTypes';

const convertToVehicleTypeSetting = (docData: DocumentData, id: string): VehicleTypeSetting => {
  return {
    id,
    name: docData.name || '',
    description: docData.description || '',
    isActive: docData.isActive === undefined ? true : docData.isActive,
  } as VehicleTypeSetting;
};

export const getAllVehicleTypes = async (): Promise<VehicleTypeSetting[]> => {
  try {
    const q = query(collection(db, VEHICLE_TYPES_COLLECTION), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToVehicleTypeSetting(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching vehicle types: ", error);
    return [];
  }
};

export const addVehicleType = async (data: Omit<VehicleTypeSetting, 'id'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, VEHICLE_TYPES_COLLECTION), {
        ...data,
        isActive: data.isActive === undefined ? true : data.isActive,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding vehicle type: ", error);
    return null;
  }
};

export const updateVehicleType = async (id: string, data: Partial<Omit<VehicleTypeSetting, 'id'>>): Promise<boolean> => {
  try {
    const docRef = doc(db, VEHICLE_TYPES_COLLECTION, id);
    await updateDoc(docRef, data);
    return true;
  } catch (error) {
    console.error("Error updating vehicle type: ", error);
    return false;
  }
};

export const deleteVehicleType = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, VEHICLE_TYPES_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting vehicle type: ", error);
    return false;
  }
};
