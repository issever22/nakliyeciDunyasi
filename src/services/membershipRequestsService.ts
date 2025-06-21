
'use server';

import { db } from '@/lib/firebase';
import type { MembershipRequest } from '@/types';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp,
  DocumentData,
  doc,
  updateDoc
} from 'firebase/firestore';

const REQUESTS_COLLECTION = 'membershipRequests';

const convertToMembershipRequest = (docData: DocumentData, id: string): MembershipRequest => {
    return {
        id,
        name: docData.name || '',
        phone: docData.phone || '',
        email: docData.email,
        companyName: docData.companyName,
        details: docData.details || '',
        status: docData.status || 'new',
        createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate().toISOString() : new Date().toISOString(),
        userId: docData.userId,
    };
};

export const addMembershipRequest = async (data: Omit<MembershipRequest, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; message: string; requestId?: string }> => {
    try {
        const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), {
            ...data,
            status: 'new',
            createdAt: Timestamp.fromDate(new Date()),
        });
        return { success: true, message: 'Talep başarıyla oluşturuldu.', requestId: docRef.id };
    } catch (error) {
        console.error("Error adding membership request:", error);
        return { success: false, message: 'Talep oluşturulurken bir hata oluştu.' };
    }
};

export const getAllMembershipRequests = async (): Promise<MembershipRequest[]> => {
    try {
        const q = query(collection(db, REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => convertToMembershipRequest(doc.data(), doc.id));
    } catch (error) {
        console.error("Error fetching membership requests:", error);
        return [];
    }
};

export const updateMembershipRequestStatus = async (requestId: string, status: MembershipRequest['status']): Promise<boolean> => {
    try {
        const docRef = doc(db, REQUESTS_COLLECTION, requestId);
        await updateDoc(docRef, { status });
        return true;
    } catch (error) {
        console.error(`Error updating membership request ${requestId} status:`, error);
        return false;
    }
};
