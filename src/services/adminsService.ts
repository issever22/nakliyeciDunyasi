
'use server';
import { db } from '@/lib/firebase';
import type { AdminProfile } from '@/types';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';

const ADMINS_COLLECTION = 'admins';

const convertToAdminProfile = (docData: DocumentData, id: string): AdminProfile => {
  return {
    id,
    name: docData.name || 'İsimsiz',
    userName: docData.userName || 'kullanici_adi_yok',
    role: docData.role || 'admin',
    isActive: docData.isActive === undefined ? false : docData.isActive,
  };
};

export const getAllAdmins = async (): Promise<AdminProfile[]> => {
  try {
    const q = query(collection(db, ADMINS_COLLECTION));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToAdminProfile(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching admins: ", error);
    return [];
  }
};

export const addAdmin = async (data: Omit<AdminProfile, 'id'>): Promise<{ success: boolean; message: string; }> => {
  try {
    // Check for duplicate username
    const q = query(collection(db, ADMINS_COLLECTION), where("userName", "==", data.userName));
    const existing = await getDocs(q);
    if (!existing.empty) {
      return { success: false, message: "Bu kullanıcı adı zaten mevcut." };
    }

    await addDoc(collection(db, ADMINS_COLLECTION), {
      ...data,
      createdAt: Timestamp.fromDate(new Date()),
    });
    return { success: true, message: `Yönetici "${data.userName}" başarıyla oluşturuldu.` };
  } catch (error: any) {
    console.error("Error adding admin: ", error);
    return { success: false, message: error.message || "Yönetici eklenirken bir hata oluştu." };
  }
};

export const updateAdmin = async (id: string, data: Partial<Omit<AdminProfile, 'id'>>): Promise<{ success: boolean; message: string; }> => {
  try {
    const docRef = doc(db, ADMINS_COLLECTION, id);
    await updateDoc(docRef, data);
    return { success: true, message: "Yönetici bilgileri güncellendi." };
  } catch (error: any) {
    console.error("Error updating admin: ", error);
    return { success: false, message: error.message || "Yönetici güncellenirken bir hata oluştu." };
  }
};

export const deleteAdmin = async (id: string): Promise<{ success: boolean; message: string; }> => {
  try {
    const docRef = doc(db, ADMINS_COLLECTION, id);
    await deleteDoc(docRef);
    return { success: true, message: "Yönetici başarıyla silindi." };
  } catch (error: any) {
    console.error("Error deleting admin: ", error);
    return { success: false, message: error.message || "Yönetici silinirken bir hata oluştu." };
  }
};
