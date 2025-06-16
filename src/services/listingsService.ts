
'use server';

import { db } from '@/lib/firebase';
import type { Freight, FreightCreationData, FreightFilterOptions, FreightUpdateData, EmptyVehicleListing } from '@/types';
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
  type QueryConstraint,
} from 'firebase/firestore';
import { parseISO, isValid, formatISO } from 'date-fns';

const LISTINGS_COLLECTION = 'listings';

// Helper to convert Firestore document data to Freight type
const convertToFreight = (docSnap: QueryDocumentSnapshot<DocumentData> | DocumentData, id?: string): Freight => {
  const data = id ? docSnap as DocumentData : (docSnap as QueryDocumentSnapshot<DocumentData>).data();
  const docId = id || (docSnap as QueryDocumentSnapshot<DocumentData>).id;

  let loadingDateStr: string;
  if (data.loadingDate) {
    if (data.loadingDate instanceof Timestamp) {
      loadingDateStr = data.loadingDate.toDate().toISOString().split('T')[0];
    } else if (typeof data.loadingDate === 'string' && isValid(parseISO(data.loadingDate))) {
      console.warn(`[listingsService - convertToFreight] Listing ${docId}: loadingDate is a string, should be Timestamp. Converting for client. Original:`, data.loadingDate);
      loadingDateStr = parseISO(data.loadingDate).toISOString().split('T')[0];
    } else {
      console.warn(`[listingsService - convertToFreight] Listing ${docId}: Invalid or unhandled loadingDate format. Defaulting to today. Original:`, data.loadingDate);
      loadingDateStr = new Date().toISOString().split('T')[0];
    }
  } else {
    console.warn(`[listingsService - convertToFreight] Listing ${docId}: Missing loadingDate. Defaulting to today.`);
    loadingDateStr = new Date().toISOString().split('T')[0];
  }

  let postedAtStr: string;
  if (data.postedAt) {
    if (data.postedAt instanceof Timestamp) {
      postedAtStr = data.postedAt.toDate().toISOString();
    } else if (typeof data.postedAt === 'string' && isValid(parseISO(data.postedAt))) {
      console.warn(`[listingsService - convertToFreight] Listing ${docId}: postedAt is a string, should be Timestamp. Converting for client. Original:`, data.postedAt);
      postedAtStr = parseISO(data.postedAt).toISOString();
    } else {
      console.warn(`[listingsService - convertToFreight] Listing ${docId}: Invalid or unhandled postedAt format. Defaulting to current time. Original:`, data.postedAt);
      postedAtStr = new Date().toISOString();
    }
  } else {
    console.warn(`[listingsService - convertToFreight] Listing ${docId}: Missing postedAt. Defaulting to current time.`);
    postedAtStr = new Date().toISOString();
  }
  
  const baseFreight = {
    id: docId,
    userId: data.userId || '',
    postedBy: data.postedBy || 'Bilinmiyor',
    companyName: data.companyName || 'Bilinmiyor',
    contactPerson: data.contactPerson || 'Bilinmiyor',
    contactEmail: data.contactEmail,
    workPhone: data.workPhone,
    mobilePhone: data.mobilePhone || 'Belirtilmedi',
    originCountry: data.originCountry || 'TR',
    originCity: data.originCity || '',
    originDistrict: data.originDistrict,
    destinationCountry: data.destinationCountry || 'TR',
    destinationCity: data.destinationCity || '',
    destinationDistrict: data.destinationDistrict,
    loadingDate: loadingDateStr,
    postedAt: postedAtStr,
    isActive: data.isActive === true,
    description: data.description || '',
  };

  if (data.freightType === 'Ticari') {
    return {
      ...baseFreight,
      freightType: 'Ticari',
      cargoType: data.cargoType || '',
      vehicleNeeded: data.vehicleNeeded || '',
      loadingType: data.loadingType || '',
      cargoForm: data.cargoForm || '',
      cargoWeight: data.cargoWeight || 0,
      cargoWeightUnit: data.cargoWeightUnit || 'Ton',
      isContinuousLoad: typeof data.isContinuousLoad === 'boolean' ? data.isContinuousLoad : false,
      shipmentScope: data.shipmentScope || 'Yurt İçi',
    } as Freight;
  } else if (data.freightType === 'Evden Eve') {
     return {
      ...baseFreight,
      freightType: 'Evden Eve',
      residentialTransportType: data.residentialTransportType || '',
      residentialPlaceType: data.residentialPlaceType || '',
      residentialElevatorStatus: data.residentialElevatorStatus || '',
      residentialFloorLevel: data.residentialFloorLevel || '',
    } as Freight;
  } else if (data.freightType === 'Boş Araç') {
    return {
      ...baseFreight,
      freightType: 'Boş Araç',
      advertisedVehicleType: data.advertisedVehicleType || '',
      serviceTypeForLoad: data.serviceTypeForLoad || '',
      vehicleStatedCapacity: data.vehicleStatedCapacity || 0,
      vehicleStatedCapacityUnit: data.vehicleStatedCapacityUnit || 'Ton',
    } as Freight;
  }
  console.warn(`[listingsService - convertToFreight] Listing ${docId}: Unknown freightType "${data.freightType}". Defaulting to 'Ticari'. Original data:`, data);
  return { ...baseFreight, freightType: 'Ticari', cargoType: 'Diğer', vehicleNeeded: 'Araç Farketmez', loadingType: 'Komple', cargoForm: 'Diğer', cargoWeight: 0, cargoWeightUnit: 'Ton', isContinuousLoad: false, shipmentScope: 'Yurt İçi' } as Freight;
};

export const getListingsByUserId = async (userId: string): Promise<Freight[]> => {
  console.log(`[listingsService - getListingsByUserId] Called for userId: ${userId}`);
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const q = query(listingsRef, where('userId', '==', userId), orderBy('postedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    console.log(`[listingsService - getListingsByUserId] Firestore query returned ${querySnapshot.docs.length} documents for userId: ${userId}`);
    const listings = querySnapshot.docs.map(doc => convertToFreight(doc));
    console.log(`[listingsService - getListingsByUserId] Processed ${listings.length} listings for userId: ${userId}`);
    return listings;
  } catch (error) {
    console.error("[listingsService - getListingsByUserId] Error fetching listings by user ID:", error);
    return [];
  }
};

export const getListings = async (
  options: {
    lastVisibleDoc?: QueryDocumentSnapshot<DocumentData> | null;
    pageSize?: number;
    filters?: FreightFilterOptions;
  } = {}
): Promise<{ freights: Freight[]; newLastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  const { lastVisibleDoc = null, pageSize = 6, filters = {} } = options;
  console.log('[listingsService - getListings] Called with options:', JSON.stringify({ pageSize, filters }, null, 2));
  
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const queryConstraints: QueryConstraint[] = [];
    
    queryConstraints.push(where('isActive', '==', true));
    
    if (filters.freightType) {
      queryConstraints.push(where('freightType', '==', filters.freightType));
      if (filters.freightType === 'Ticari') {
        if (filters.vehicleNeeded) queryConstraints.push(where('vehicleNeeded', '==', filters.vehicleNeeded));
        if (filters.shipmentScope) queryConstraints.push(where('shipmentScope', '==', filters.shipmentScope));
      }
    }
    // Firestore requires the first orderBy to be on the field used in inequality filters.
    // If city filters become range queries (e.g., for startsWith), this needs adjustment.
    // For simple equality, order of `where` vs `orderBy('postedAt')` is less strict.
    if (filters.originCity) {
       queryConstraints.push(where('originCity', '==', filters.originCity));
    }
    if (filters.destinationCity) {
       queryConstraints.push(where('destinationCity', '==', filters.destinationCity));
    }
    queryConstraints.push(orderBy('postedAt', filters.sortBy === 'oldest' ? 'asc' : 'desc'));
    

    if (lastVisibleDoc) {
      queryConstraints.push(startAfter(lastVisibleDoc));
    }
    queryConstraints.push(limit(pageSize));

    const constraintDescriptions = queryConstraints.map(c => {
        let desc = `Type: ${c.type}`;
        if ('_fiel_') desc += `, Field: ${(c as any)._fiel_.segments.join('.')}`; // Using internal property for logging
        if ('_op') desc += `, Op: ${(c as any)._op}`;
        if ('_valu_') desc += `, Value: ${JSON.stringify((c as any)._valu_)}`;
        return desc;
    });
    console.log('[listingsService - getListings] Final query constraints:', JSON.stringify(constraintDescriptions, null, 2));

    const q = query(listingsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    console.log(`[listingsService - getListings] Firestore query returned ${querySnapshot.docs.length} documents.`);

    const freights = querySnapshot.docs.map(doc => convertToFreight(doc));
    const newLastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;
    
    console.log(`[listingsService - getListings] Processed ${freights.length} listings. Has more: ${!!newLastDoc && querySnapshot.docs.length === pageSize}`);
    if(freights.length > 0) {
      console.log('[listingsService - getListings] First fetched listing (raw data from Firestore):', JSON.stringify(querySnapshot.docs[0].data(), null, 2));
      console.log('[listingsService - getListings] First fetched listing (converted):', JSON.stringify(freights[0], null, 2));
    } else {
      console.log('[listingsService - getListings] No listings fetched or processed.');
    }

    return { freights, newLastVisibleDoc: newLastDoc };
  } catch (error) {
    console.error("[listingsService - getListings] Error fetching listings:", error);
    if ((error as any).code === 'failed-precondition') {
        console.error("[listingsService - getListings] Firestore Precondition Failed: This often means you're missing a composite index. Check the Firestore console for index creation links in the error details if available, or review your query and ensure indexes match.");
    }
    return { freights: [], newLastVisibleDoc: null };
  }
};

export const getAllListingsForAdmin = async (): Promise<Freight[]> => {
  console.log('[listingsService - getAllListingsForAdmin] called');
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const q = query(listingsRef, orderBy('postedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    console.log(`[listingsService - getAllListingsForAdmin] Firestore query returned ${querySnapshot.docs.length} documents.`);
    const listings = querySnapshot.docs.map(doc => convertToFreight(doc));
    console.log(`[listingsService - getAllListingsForAdmin] Processed ${listings.length} listings.`);
    return listings;
  } catch (error) {
    console.error("[listingsService - getAllListingsForAdmin] Error fetching all listings for admin:", error);
    return [];
  }
};

export const getListingById = async (id: string): Promise<Freight | null> => {
  console.log(`[listingsService - getListingById] called for id: ${id}`);
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const listing = convertToFreight(docSnap.data() as DocumentData, docSnap.id);
      return listing;
    }
    console.log(`[listingsService - getListingById] No listing found for id ${id}`);
    return null;
  } catch (error) {
    console.error(`[listingsService - getListingById] Error fetching listing by ID ${id}:`, error);
    return null;
  }
};

export const addListing = async (userId: string, listingData: FreightCreationData): Promise<string | null> => {
  console.log('[listingsService - addListing] called for userId:', userId);
  try {
    let loadingDateTimestamp: Timestamp;
    if (listingData.loadingDate && isValid(parseISO(listingData.loadingDate))) {
      loadingDateTimestamp = Timestamp.fromDate(parseISO(listingData.loadingDate));
    } else {
      console.warn(`[listingsService - addListing] Invalid or missing loadingDate string. Defaulting to today. Original:`, listingData.loadingDate);
      loadingDateTimestamp = Timestamp.fromDate(new Date());
    }

    const dataToSave = {
      ...listingData,
      userId,
      postedBy: listingData.postedBy || 'Bilinmiyor',
      companyName: listingData.companyName || 'Bilinmiyor',
      contactPerson: listingData.contactPerson || 'Bilinmiyor',
      mobilePhone: listingData.mobilePhone || 'Belirtilmedi',
      postedAt: Timestamp.fromDate(new Date()),
      loadingDate: loadingDateTimestamp, 
      isActive: typeof listingData.isActive === 'boolean' ? listingData.isActive : true,
    };
    const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), dataToSave);
    console.log(`[listingsService - addListing] Successfully added listing with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("[listingsService - addListing] Error adding listing:", error);
    return null;
  }
};

export const updateListing = async (id: string, listingUpdateData: FreightUpdateData): Promise<boolean> => {
  console.log(`[listingsService - updateListing] called for id: ${id}`);
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    const dataToUpdate: any = { ...listingUpdateData };

    if (dataToUpdate.loadingDate && typeof dataToUpdate.loadingDate === 'string') {
      if (isValid(parseISO(dataToUpdate.loadingDate))) {
        dataToUpdate.loadingDate = Timestamp.fromDate(parseISO(dataToUpdate.loadingDate));
      } else {
        console.warn(`[listingsService - updateListing] Invalid loadingDate string for ID ${id}: ${dataToUpdate.loadingDate}. Skipping date update for this field.`);
        delete dataToUpdate.loadingDate; 
      }
    } else if (dataToUpdate.hasOwnProperty('loadingDate') && dataToUpdate.loadingDate === null) {
        // If explicitly set to null, perhaps remove or handle as error
        console.warn(`[listingsService - updateListing] loadingDate explicitly set to null for ID ${id}. Consider behavior.`);
        delete dataToUpdate.loadingDate;
    }
    
    delete dataToUpdate.id; 
    delete dataToUpdate.postedAt; // Should not update postedAt during an edit

    await updateDoc(docRef, dataToUpdate);
    console.log(`[listingsService - updateListing] Successfully updated listing with ID: ${id}`);
    return true;
  } catch (error) {
    console.error(`[listingsService - updateListing] Error updating listing with ID ${id}:`, error);
    return false;
  }
};

export const deleteListing = async (id: string): Promise<boolean> => {
  console.log(`[listingsService - deleteListing] called for id: ${id}`);
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    await deleteDoc(docRef);
    console.log(`[listingsService - deleteListing] Successfully deleted listing with ID: ${id}`);
    return true;
  } catch (error) {
    console.error(`[listingsService - deleteListing] Error deleting listing with ID ${id}:`, error);
    return false;
  }
};
    
