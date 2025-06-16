
'use server';

import { db } from '@/lib/firebase';
import type { TransportOffer, TransportOfferCreationData, TransportOfferUpdateData } from '@/types';
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
  where,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
  getDoc,
} from 'firebase/firestore';
import { parseISO, isValid } from 'date-fns';

const TRANSPORT_OFFERS_COLLECTION = 'transportOffers';

const convertToTransportOffer = (docSnap: QueryDocumentSnapshot<DocumentData> | DocumentData, id?: string): TransportOffer => {
  const data = id ? docSnap as DocumentData : (docSnap as QueryDocumentSnapshot<DocumentData>).data();
  const docId = id || (docSnap as QueryDocumentSnapshot<DocumentData>).id;

  let postedAtStr: string;
  if (data.postedAt && data.postedAt instanceof Timestamp) {
    postedAtStr = data.postedAt.toDate().toISOString();
  } else {
    console.warn(`[transportOffersService] Offer ${docId}: postedAt is not a Timestamp or is missing. Defaulting. Original:`, data.postedAt);
    postedAtStr = new Date().toISOString(); // Fallback
  }
  
  return {
    id: docId,
    userId: data.userId || '',
    companyName: data.companyName || 'Bilinmiyor',
    postedAt: postedAtStr,
    isActive: data.isActive === undefined ? true : data.isActive,
    originCountry: data.originCountry || 'TR',
    originCity: data.originCity || '',
    originDistrict: data.originDistrict,
    destinationCountry: data.destinationCountry || 'TR',
    destinationCity: data.destinationCity || '',
    destinationDistrict: data.destinationDistrict,
    vehicleType: data.vehicleType || '',
    distanceKm: data.distanceKm || 0,
    priceTRY: data.priceTRY,
    priceUSD: data.priceUSD,
    priceEUR: data.priceEUR,
    notes: data.notes,
  } as TransportOffer;
};

export const addTransportOffer = async (userId: string, companyName: string, offerData: TransportOfferCreationData): Promise<string | null> => {
  try {
    const dataToSave = {
      ...offerData,
      userId,
      companyName,
      postedAt: Timestamp.fromDate(new Date()),
      isActive: offerData.isActive === undefined ? true : offerData.isActive,
    };
    const docRef = await addDoc(collection(db, TRANSPORT_OFFERS_COLLECTION), dataToSave);
    return docRef.id;
  } catch (error) {
    console.error("[transportOffersService] Error adding transport offer:", error);
    return null;
  }
};

export const updateTransportOffer = async (id: string, offerUpdateData: TransportOfferUpdateData): Promise<boolean> => {
  try {
    const docRef = doc(db, TRANSPORT_OFFERS_COLLECTION, id);
    const dataToUpdate: any = {
        ...offerUpdateData,
        postedAt: Timestamp.fromDate(new Date()), // Update postedAt on every update
    };
    
    delete dataToUpdate.id;
    delete dataToUpdate.userId;
    delete dataToUpdate.companyName;

    await updateDoc(docRef, dataToUpdate);
    return true;
  } catch (error) {
    console.error(`[transportOffersService] Error updating transport offer with ID ${id}:`, error);
    return false;
  }
};

export const deleteTransportOffer = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, TRANSPORT_OFFERS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`[transportOffersService] Error deleting transport offer with ID ${id}:`, error);
    return false;
  }
};

export const getTransportOffersByUserId = async (userId: string): Promise<{ offers: TransportOffer[]; error?: { message: string; indexCreationUrl?: string } }> => {
  try {
    const offersRef = collection(db, TRANSPORT_OFFERS_COLLECTION);
    const q = query(offersRef, where('userId', '==', userId), orderBy('postedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const offers = querySnapshot.docs.map(doc => convertToTransportOffer(doc));
    return { offers };
  } catch (error: any) {
    console.error("[transportOffersService] Error fetching transport offers by user ID:", error);
    let errorMessage = "Kullanıcıya ait nakliye fiyat teklifleri yüklenirken bilinmeyen bir hata oluştu.";
    let indexCreationUrl: string | undefined = undefined;
    if (error.code === 'failed-precondition') {
      errorMessage = error.message || "Eksik Firestore dizini (kullanıcı fiyat teklifleri). Lütfen sunucu konsolunu kontrol edin.";
      const urlRegex = /(https:\/\/console.firebase.google.com\/project\/[^/]+\/firestore\/indexes\?create_composite=[^ ]+)/;
      const match = errorMessage.match(urlRegex);
      if (match && match[0]) {
        indexCreationUrl = match[0];
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { offers: [], error: { message: errorMessage, indexCreationUrl } };
  }
};

// Example for a public listing page, can be expanded with filters
export const getAllActiveTransportOffers = async (
   options: {
    lastVisibleDoc?: QueryDocumentSnapshot<DocumentData> | null;
    pageSize?: number;
    // Add filters here later if needed
  } = {}
): Promise<{ offers: TransportOffer[]; newLastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null; error?: { message: string; indexCreationUrl?: string } }> => {
  const { lastVisibleDoc = null, pageSize = 10 } = options;
  try {
    const offersRef = collection(db, TRANSPORT_OFFERS_COLLECTION);
    const queryConstraints: any[] = [
      where('isActive', '==', true),
      orderBy('postedAt', 'desc'),
      limit(pageSize)
    ];
    if (lastVisibleDoc) {
      queryConstraints.push(startAfter(lastVisibleDoc));
    }
    const q = query(offersRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    const offers = querySnapshot.docs.map(doc => convertToTransportOffer(doc));
    const newLastDoc = querySnapshot.docs.length === pageSize ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;
    return { offers, newLastVisibleDoc: newLastDoc };
  } catch (error: any) {
    console.error("[transportOffersService] Error fetching all active transport offers:", error);
     let errorMessage = "Aktif nakliye fiyat teklifleri yüklenirken bilinmeyen bir hata oluştu.";
    let indexCreationUrl: string | undefined = undefined;
    if (error.code === 'failed-precondition') {
      errorMessage = error.message || "Eksik Firestore dizini (aktif fiyat teklifleri). Lütfen sunucu konsolunu kontrol edin.";
      const urlRegex = /(https:\/\/console.firebase.google.com\/project\/[^/]+\/firestore\/indexes\?create_composite=[^ ]+)/;
      const match = errorMessage.match(urlRegex);
      if (match && match[0]) {
        indexCreationUrl = match[0];
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { offers: [], newLastVisibleDoc: null, error: { message: errorMessage, indexCreationUrl } };
  }
};
