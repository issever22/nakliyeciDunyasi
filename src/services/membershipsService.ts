
'use server';
import { db } from '@/lib/firebase';
import type { MembershipSetting, DurationUnit } from '@/types';
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

const MEMBERSHIPS_COLLECTION = 'settingsMemberships';

const convertToMembershipSetting = (docData: DocumentData, id: string): MembershipSetting => {
  return {
    id,
    name: docData.name || '',
    price: docData.price || 0,
    duration: docData.duration || 1,
    durationUnit: docData.durationUnit || 'Ay',
    features: Array.isArray(docData.features) ? docData.features : [],
    description: docData.description || '',
    isActive: docData.isActive === undefined ? true : docData.isActive,
  } as MembershipSetting;
};

export const getAllMemberships = async (): Promise<MembershipSetting[]> => {
  try {
    const q = query(collection(db, MEMBERSHIPS_COLLECTION), orderBy('price', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToMembershipSetting(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching memberships: ", error);
    return [];
  }
};

export const addMembership = async (data: Omit<MembershipSetting, 'id'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, MEMBERSHIPS_COLLECTION), {
        ...data,
        isActive: data.isActive === undefined ? true : data.isActive,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding membership: ", error);
    return null;
  }
};

export const updateMembership = async (id: string, data: Partial<Omit<MembershipSetting, 'id'>>): Promise<boolean> => {
  try {
    const docRef = doc(db, MEMBERSHIPS_COLLECTION, id);
    await updateDoc(docRef, data);
    return true;
  } catch (error) {
    console.error("Error updating membership: ", error);
    return false;
  }
};

export const deleteMembership = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, MEMBERSHIPS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting membership: ", error);
    return false;
  }
};
