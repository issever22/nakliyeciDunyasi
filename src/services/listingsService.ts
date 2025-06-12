
'use server';
import { db } from '@/lib/firebase';
import type { Freight, CommercialFreight, ResidentialFreight } from '@/types';
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
  DocumentData,
  QueryDocumentSnapshot,
  getDoc
} from 'firebase/firestore';
import { parseISO } from 'date-fns';

const LISTINGS_COLLECTION = 'listings';

// Firestore'dan gelen Timestamp'ı YYYY-MM-DD string'ine çevirir
const formatTimestampToDateString = (timestamp: Timestamp | string | undefined): string => {
  if (!timestamp) return new Date().toISOString().split('T')[0]; // Veya uygun bir varsayılan
  if (typeof timestamp === 'string') {
     try {
      return parseISO(timestamp).toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  }
  return timestamp.toDate().toISOString().split('T')[0];
};

const convertToFreight = (docData: DocumentData, id: string): Freight => {
  const data = { ...docData };
  
  // Tarih alanlarını string'e çevirme
  if (data.loadingDate) {
    data.loadingDate = formatTimestampToDateString(data.loadingDate);
  }
  if (data.postedAt && data.postedAt.toDate) { // postedAt Timestamp ise
    data.postedAt = data.postedAt.toDate().toISOString();
  } else if (typeof data.postedAt === 'string') {
    // Zaten string ise dokunma
  } else {
    data.postedAt = new Date().toISOString(); // Fallback
  }
  
  // isActive alanı için varsayılan değer
  data.isActive = data.isActive === undefined ? true : data.isActive;

  return {
    id,
    ...data,
  } as Freight;
};


export const getListings = async (
    lastVisible?: QueryDocumentSnapshot<DocumentData> | null, 
    pageSize: number = 10
  ): Promise<{freights: Freight[], newLastVisible: QueryDocumentSnapshot<DocumentData> | null}> => {
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    let q;
    if (lastVisible) {
      q = query(listingsRef, orderBy('postedAt', 'desc'), startAfter(lastVisible), limit(pageSize));
    } else {
      q = query(listingsRef, orderBy('postedAt', 'desc'), limit(pageSize));
    }
    const querySnapshot = await getDocs(q);
    const freights = querySnapshot.docs.map(doc => convertToFreight(doc.data(), doc.id));
    const newLastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    return { freights, newLastVisible: newLastVisibleDoc };
  } catch (error) {
    console.error("Error fetching listings: ", error);
    return { freights: [], newLastVisible: null };
  }
};

export const getListingById = async (id: string): Promise<Freight | null> => {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return convertToFreight(docSnap.data(), docSnap.id);
    }
    return null;
  } catch (error) {
    console.error("Error fetching listing by ID: ", error);
    return null;
  }
}


export const addListing = async (listingData: Omit<Freight, 'id' | 'postedAt'>): Promise<string | null> => {
  try {
    const dataToSave = {
      ...listingData,
      postedAt: Timestamp.fromDate(new Date()),
      loadingDate: listingData.loadingDate ? Timestamp.fromDate(parseISO(listingData.loadingDate)) : Timestamp.fromDate(new Date()),
      isActive: listingData.isActive === undefined ? true : listingData.isActive,
    };
    const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), dataToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error adding listing: ", error);
    return null;
  }
};

export const updateListing = async (id: string, listingData: Partial<Freight>): Promise<boolean> => {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    const dataToUpdate = { ...listingData };

    if (dataToUpdate.loadingDate && typeof dataToUpdate.loadingDate === 'string') {
      dataToUpdate.loadingDate = Timestamp.fromDate(parseISO(dataToUpdate.loadingDate)) as any; // any to bypass type error with Timestamp
    }
    // postedAt genellikle güncellenmez, ama gerekirse benzer dönüşüm yapılabilir
    // id ve postedAt'ı güncelleme verisinden çıkaralım (eğer varsa)
    delete dataToUpdate.id;
    delete dataToUpdate.postedAt;

    await updateDoc(docRef, dataToUpdate);
    return true;
  } catch (error) {
    console.error("Error updating listing: ", error);
    return false;
  }
};

export const deleteListing = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting listing: ", error);
    return false;
  }
};

// Admin panelinde tüm ilanları getirmek için (sayfalama olmadan veya farklı bir sayfalama ile)
export const getAllListingsForAdmin = async (): Promise<Freight[]> => {
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const q = query(listingsRef, orderBy('postedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToFreight(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching all listings for admin: ", error);
    return [];
  }
};
