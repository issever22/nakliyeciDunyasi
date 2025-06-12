
'use server';
import { db } from '@/lib/firebase';
import type { Freight, CommercialFreight, ResidentialFreight, FreightFilterOptions } from '@/types';
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
  getDoc,
  QueryConstraint // Import QueryConstraint
} from 'firebase/firestore';
import { parseISO } from 'date-fns';

const LISTINGS_COLLECTION = 'listings';

const formatTimestampToDateString = (timestamp: Timestamp | string | undefined): string => {
  if (!timestamp) return new Date().toISOString().split('T')[0];
  if (typeof timestamp === 'string') {
     try {
      return parseISO(timestamp).toISOString().split('T')[0];
    } catch (e) {
      console.warn("Invalid date string for parsing in listingsService:", timestamp, e);
      return new Date().toISOString().split('T')[0]; // Fallback
    }
  }
  return timestamp.toDate().toISOString().split('T')[0];
};

const convertToFreight = (docData: DocumentData, id: string): Freight => {
  const data = { ...docData };
  
  if (data.loadingDate) {
    data.loadingDate = formatTimestampToDateString(data.loadingDate);
  }
  
  if (data.postedAt && typeof data.postedAt.toDate === 'function') {
    data.postedAt = data.postedAt.toDate().toISOString();
  } else if (typeof data.postedAt === 'string') {
    // Check if it's a valid ISO string, otherwise fallback
    try {
      parseISO(data.postedAt); // This will throw if invalid
    } catch (e) {
      console.warn("Invalid postedAt string, falling back for freight ID:", id, data.postedAt);
      data.postedAt = new Date().toISOString(); // Fallback
    }
  } else {
    data.postedAt = new Date().toISOString(); 
  }
  
  data.isActive = data.isActive === undefined ? true : data.isActive;

  return {
    id,
    ...data,
  } as Freight;
};


export const getListings = async (
    lastVisible?: QueryDocumentSnapshot<DocumentData> | null, 
    pageSize: number = 10,
    currentFilters?: FreightFilterOptions
  ): Promise<{freights: Freight[], newLastVisible: QueryDocumentSnapshot<DocumentData> | null}> => {
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const queryConstraints: QueryConstraint[] = [];

    // Default filter: always get active listings
    queryConstraints.push(where("isActive", "==", true));

    // Apply filters from currentFilters
    if (currentFilters) {
      if (currentFilters.originCity) {
        queryConstraints.push(where("originCity", "==", currentFilters.originCity));
      }
      if (currentFilters.destinationCity) {
        queryConstraints.push(where("destinationCity", "==", currentFilters.destinationCity));
      }
      if (currentFilters.freightType) {
        queryConstraints.push(where("freightType", "==", currentFilters.freightType));
        // Apply type-specific filters only if freightType is selected
        if (currentFilters.freightType === 'Ticari') {
          if (currentFilters.vehicleNeeded) {
            queryConstraints.push(where("vehicleNeeded", "==", currentFilters.vehicleNeeded));
          }
          if (currentFilters.shipmentScope) {
            queryConstraints.push(where("shipmentScope", "==", currentFilters.shipmentScope));
          }
        }
      } else {
        // If no specific freightType, but other commercial filters are present,
        // it implies user might be looking for commercial even without explicitly selecting type.
        // This logic might need refinement based on desired UX.
        if (currentFilters.vehicleNeeded) {
          queryConstraints.push(where("vehicleNeeded", "==", currentFilters.vehicleNeeded));
        }
        if (currentFilters.shipmentScope) {
          queryConstraints.push(where("shipmentScope", "==", currentFilters.shipmentScope));
        }
      }
    }
    
    // Sorting: Firestore requires the orderBy field to be the first inequality field if one exists.
    // For simplicity with multiple '==' where clauses, we stick to 'postedAt' for now.
    // Complex sorting with multiple filters might require composite indexes.
    if (currentFilters?.sortBy === 'oldest') {
        queryConstraints.push(orderBy('postedAt', 'asc'));
    } else {
        queryConstraints.push(orderBy('postedAt', 'desc')); // Default to newest
    }

    if (lastVisible) {
      queryConstraints.push(startAfter(lastVisible));
    }
    queryConstraints.push(limit(pageSize));
    
    const q = query(listingsRef, ...queryConstraints);
    
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
      dataToUpdate.loadingDate = Timestamp.fromDate(parseISO(dataToUpdate.loadingDate)) as any; 
    }
    
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

export const getAllListingsForAdmin = async (): Promise<Freight[]> => {
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    // Admin should see all listings, regardless of isActive status for management purposes
    const q = query(listingsRef, orderBy('postedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToFreight(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching all listings for admin: ", error);
    return [];
  }
};
