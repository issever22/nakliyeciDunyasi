
'use server';

import { db } from '@/lib/firebase';
import type { Freight, FreightFilterOptions, FreightCreationData, FreightUpdateData, EmptyVehicleListing } from '@/types';
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

const GUEST_USER_ID_PREFIX = "guest_";

// Helper to convert Firestore document data to Freight type
const convertToFreight = (docSnap: QueryDocumentSnapshot<DocumentData> | DocumentData, id?: string): Freight => {
  const data = id ? docSnap as DocumentData : (docSnap as QueryDocumentSnapshot<DocumentData>).data();
  const docId = id || (docSnap as QueryDocumentSnapshot<DocumentData>).id;

  let loadingDateStr: string;
  if (data.loadingDate && data.loadingDate instanceof Timestamp) {
    loadingDateStr = data.loadingDate.toDate().toISOString();
  } else if (data.loadingDate && typeof data.loadingDate === 'string' && isValid(parseISO(data.loadingDate))) {
    loadingDateStr = data.loadingDate;
  } else {
    console.warn(`[listingsService - convertToFreight] Listing ${docId}: loadingDate is not a Timestamp or valid ISO string. Original:`, data.loadingDate, "Fallback to today.");
    loadingDateStr = new Date().toISOString();
  }

  let postedAtStr: string;
  if (data.postedAt && data.postedAt instanceof Timestamp) {
    postedAtStr = data.postedAt.toDate().toISOString();
  } else if (data.postedAt && typeof data.postedAt === 'string' && isValid(parseISO(data.postedAt))) {
    postedAtStr = data.postedAt;
  } else {
    console.warn(`[listingsService - convertToFreight] Listing ${docId}: postedAt is not a Timestamp or valid ISO string. Original:`, data.postedAt, "Fallback to current time.");
    postedAtStr = new Date().toISOString();
  }

  const baseFreight = {
    id: docId,
    userId: data.userId || `${GUEST_USER_ID_PREFIX}unknown`, // Ensure userId is always present
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

  if (data.freightType === 'Yük') { 
    return {
      ...baseFreight,
      freightType: 'Yük', 
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
    if (data.advertisedVehicleType === undefined) console.warn(`[listingsService - convertToFreight] Listing ${docId} (Boş Araç): 'advertisedVehicleType' is missing. Defaulting.`);
    if (data.serviceTypeForLoad === undefined) console.warn(`[listingsService - convertToFreight] Listing ${docId} (Boş Araç): 'serviceTypeForLoad' is missing. Defaulting.`);
    if (data.vehicleStatedCapacity === undefined) console.warn(`[listingsService - convertToFreight] Listing ${docId} (Boş Araç): 'vehicleStatedCapacity' is missing. Defaulting.`);
    if (data.vehicleStatedCapacityUnit === undefined) console.warn(`[listingsService - convertToFreight] Listing ${docId} (Boş Araç): 'vehicleStatedCapacityUnit' is missing. Defaulting.`);
    return {
      ...baseFreight,
      freightType: 'Boş Araç',
      advertisedVehicleType: data.advertisedVehicleType || 'Belirtilmemiş',
      serviceTypeForLoad: data.serviceTypeForLoad || 'Komple',
      vehicleStatedCapacity: data.vehicleStatedCapacity === undefined ? 0 : data.vehicleStatedCapacity,
      vehicleStatedCapacityUnit: data.vehicleStatedCapacityUnit || 'Ton',
    } as Freight;
  }
  console.warn(`[listingsService - convertToFreight] Listing ${docId}: Unknown freightType "${data.freightType}". Defaulting to 'Yük'. Original data:`, data);
  return { ...baseFreight, freightType: 'Yük', cargoType: 'Diğer', vehicleNeeded: 'Araç Farketmez', loadingType: 'Komple', cargoForm: 'Diğer', cargoWeight: 0, cargoWeightUnit: 'Ton', isContinuousLoad: false, shipmentScope: 'Yurt İçi' } as Freight;
};

export const getListingsByUserId = async (userId: string): Promise<{ listings: Freight[]; error?: { message: string; indexCreationUrl?: string } }> => {
  console.log(`[listingsService - getListingsByUserId] Called for userId: ${userId}`);
   if (userId.startsWith(GUEST_USER_ID_PREFIX)) {
    console.log(`[listingsService - getListingsByUserId] Attempted to fetch listings for a guest ID (${userId}). Returning empty list.`);
    return { listings: [] }; // Guests cannot have "my listings" page
  }
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const q = query(listingsRef, where('userId', '==', userId), orderBy('postedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    console.log(`[listingsService - getListingsByUserId] Firestore query returned ${querySnapshot.docs.length} documents for userId: ${userId}`);
    const listings = querySnapshot.docs.map(doc => convertToFreight(doc));
    console.log(`[listingsService - getListingsByUserId] Processed ${listings.length} listings for userId: ${userId}`);
    return { listings };
  } catch (error: any) {
    console.error("[listingsService - getListingsByUserId] Error fetching listings by user ID:", error);
    let errorMessage = "Kullanıcı ilanları yüklenirken bilinmeyen bir hata oluştu.";
    let indexCreationUrl: string | undefined = undefined;

    if (error.code === 'failed-precondition') {
        errorMessage = error.message || "Eksik Firestore dizini (kullanıcı ilanları). Lütfen sunucu konsolunu kontrol edin.";
        console.error(`[listingsService - getListingsByUserId] FIRESTORE PRECONDITION FAILED: ${errorMessage}`);
        
        const urlRegex = /(https:\/\/console.firebase.google.com\/project\/[^/]+\/firestore\/indexes\?create_composite=[^ ]+)/;
        const match = errorMessage.match(urlRegex);
        if (match && match[0]) {
            indexCreationUrl = match[0];
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.error("!!! MISSING FIRESTORE INDEX (getListingsByUserId) !!!");
            console.error("!!! To fix this, create the composite index by visiting the following URL (copy and paste into your browser):");
            console.error(`!!! ${indexCreationUrl}`);
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        } else {
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.error("!!! MISSING FIRESTORE INDEX (getListingsByUserId) !!!");
            console.error("!!! Could not automatically extract the index creation URL. Please check Firebase console.");
            console.error("!!! Likely involves fields: 'userId' (equals) and 'postedAt' (descending).");
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        }
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { listings: [], error: { message: errorMessage, indexCreationUrl } };
  }
};

export const getListings = async (
  options: {
    lastVisibleDoc?: QueryDocumentSnapshot<DocumentData> | null;
    pageSize?: number;
    filters?: FreightFilterOptions;
  } = {}
): Promise<{ 
  freights: Freight[]; 
  newLastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null; 
  error?: { message: string; indexCreationUrl?: string } 
}> => {
  const { lastVisibleDoc = null, pageSize = 6, filters = {} } = options; 
  console.log('[listingsService - getListings] Called with options:', { pageSize, filters, lastVisibleDocExists: !!lastVisibleDoc });

  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const queryConstraints: QueryConstraint[] = [];

    queryConstraints.push(where('isActive', '==', true));
    
    if (filters?.originCity) {
      queryConstraints.push(where('originCity', '==', filters.originCity));
    }
    if (filters?.destinationCity) {
      queryConstraints.push(where('destinationCity', '==', filters.destinationCity));
    }
    if (filters?.freightType) {
      queryConstraints.push(where('freightType', '==', filters.freightType));
    }
    
    if (!filters?.freightType || filters.freightType === 'Yük') { 
        if (filters?.vehicleNeeded) {
          queryConstraints.push(where('vehicleNeeded', '==', filters.vehicleNeeded));
        }
        if (filters?.shipmentScope) {
          queryConstraints.push(where('shipmentScope', '==', filters.shipmentScope));
        }
    }
    
    const sortBy = filters?.sortBy || 'newest'; 
    queryConstraints.push(orderBy('postedAt', sortBy === 'newest' ? 'desc' : 'asc'));
    
    if (lastVisibleDoc) {
      queryConstraints.push(startAfter(lastVisibleDoc));
    }
    queryConstraints.push(limit(pageSize));

    const constraintDescriptions = queryConstraints.map(c => {
        let desc = `Type: ${c.type}`;
        try {
            if ((c as any)._fieldPath && (c as any)._fieldPath.segments) desc += `, Field: ${(c as any)._fieldPath.segments.join('.')}`;
            if ((c as any)._op) desc += `, Op: ${(c as any)._op}`;
            if ((c as any)._value) desc += `, Value: ${JSON.stringify((c as any)._value)}`;
            if ((c as any)._direction) desc += `, Dir: ${(c as any)._direction}`;
        } catch (e) { /* ignore */ }
        return desc;
    });
    console.log('[listingsService - getListings] Final query constraints:', JSON.stringify(constraintDescriptions, null, 2));

    const q = query(listingsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    console.log(`[listingsService - getListings] Firestore query returned ${querySnapshot.docs.length} documents.`);

    const freights = querySnapshot.docs.map(doc => convertToFreight(doc));
    const newLastDoc = querySnapshot.docs.length === pageSize ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

    if(freights.length > 0) {
      // console.log('[listingsService - getListings] First fetched listing (raw data from Firestore):', JSON.stringify(querySnapshot.docs[0].data(), null, 2));
      // console.log('[listingsService - getListings] First fetched listing (converted):', JSON.stringify(freights[0], null, 2));
    } else {
      console.log('[listingsService - getListings] No listings fetched or processed after conversion.');
    }
    console.log(`[listingsService - getListings] Returning ${freights.length} listings. newLastVisibleDoc exists: ${!!newLastDoc}`);
    return { freights, newLastVisibleDoc: newLastDoc };
  } catch (error: any) {
    console.error("[listingsService - getListings] Error fetching listings:", error);
    let errorMessage = "İlanlar yüklenirken bilinmeyen bir hata oluştu.";
    let indexCreationUrl: string | undefined = undefined;

    if (error.code === 'failed-precondition') {
        errorMessage = error.message || "Eksik Firestore dizini. Lütfen sunucu konsolunu kontrol edin.";
        console.error(`[listingsService - getListings] FIRESTORE PRECONDITION FAILED: ${errorMessage}`);
        
        const urlRegex = /(https:\/\/console.firebase.google.com\/project\/[^/]+\/firestore\/indexes\?create_composite=[^ ]+)/;
        const match = errorMessage.match(urlRegex);
        if (match && match[0]) {
            indexCreationUrl = match[0];
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.error("!!! MISSING FIRESTORE INDEX (getListings) !!!");
            console.error("!!! To fix this, create the composite index by visiting the following URL (copy and paste into your browser):");
            console.error(`!!! ${indexCreationUrl}`);
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        } else {
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.error("!!! MISSING FIRESTORE INDEX (getListings) !!!");
            console.error("!!! Could not automatically extract the index creation URL from the error message.");
            console.error("!!! Please check the Firebase console for the exact error and the suggested index.");
            let involvedFields = "Fields likely involved: 'isActive', 'postedAt'";
            if (filters?.originCity) involvedFields += ", 'originCity'";
            if (filters?.destinationCity) involvedFields += ", 'destinationCity'";
            if (filters?.freightType) involvedFields += ", 'freightType'";
            if (filters?.vehicleNeeded && (!filters.freightType || filters.freightType === 'Yük')) involvedFields += ", 'vehicleNeeded'"; 
            if (filters?.shipmentScope && (!filters.freightType || filters.freightType === 'Yük')) involvedFields += ", 'shipmentScope'"; 
            console.error(`!!! ${involvedFields}`);
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        }
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { freights: [], newLastVisibleDoc: null, error: { message: errorMessage, indexCreationUrl } };
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
  } catch (error: any) {
    console.error("[listingsService - getAllListingsForAdmin] Error fetching all listings for admin:", error);
     if (error.code === 'failed-precondition') {
        const errorMessage = error.message || "Missing or insufficient permissions. This often means a composite index is required for admin query.";
        console.error(`[listingsService - getAllListingsForAdmin] FIRESTORE PRECONDITION FAILED: ${errorMessage}`);
         const urlRegex = /(https:\/\/console.firebase.google.com\/project\/[^/]+\/firestore\/indexes\?create_composite=[^ ]+)/;
        const match = errorMessage.match(urlRegex);
        if (match && match[0]) {
            const indexCreationUrl = match[0];
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.error("!!! ADMIN LISTING - MISSING FIRESTORE INDEX !!!");
            console.error(`!!! Index URL: ${indexCreationUrl}`);
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        }
     }
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

export const addListing = async (userIdFromAuth: string | undefined, listingData: FreightCreationData): Promise<string | null> => {
  console.log('[listingsService - addListing] called for userIdFromAuth:', userIdFromAuth);
  try {
    let loadingDateTimestamp: Timestamp;
    if (listingData.loadingDate && typeof listingData.loadingDate === 'string' && isValid(parseISO(listingData.loadingDate))) {
      loadingDateTimestamp = Timestamp.fromDate(parseISO(listingData.loadingDate));
    } else {
      console.warn(`[listingsService - addListing] Invalid or missing loadingDate string for new listing. Original:`, listingData.loadingDate, "Defaulting to today.");
      loadingDateTimestamp = Timestamp.fromDate(new Date());
    }

    const finalUserId = userIdFromAuth || `${GUEST_USER_ID_PREFIX}${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const dataToSave = {
      ...listingData,
      userId: finalUserId,
      postedBy: listingData.postedBy || 'Bilinmiyor', // Should be pre-filled by calling component
      companyName: listingData.companyName, // Mandatory from form
      contactPerson: listingData.contactPerson, // Mandatory from form
      mobilePhone: listingData.mobilePhone, // Mandatory from form
      postedAt: Timestamp.fromDate(new Date()),
      loadingDate: loadingDateTimestamp,
      isActive: typeof listingData.isActive === 'boolean' ? listingData.isActive : true,
    };
    const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), dataToSave);
    console.log(`[listingsService - addListing] Successfully added listing with ID: ${docRef.id} for userId: ${finalUserId}`);
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

    if (dataToUpdate.hasOwnProperty('loadingDate')) {
      if (dataToUpdate.loadingDate && typeof dataToUpdate.loadingDate === 'string' && isValid(parseISO(dataToUpdate.loadingDate))) {
        dataToUpdate.loadingDate = Timestamp.fromDate(parseISO(dataToUpdate.loadingDate));
      } else if (dataToUpdate.loadingDate === null || dataToUpdate.loadingDate === undefined || (typeof dataToUpdate.loadingDate === 'string' && dataToUpdate.loadingDate.trim() === '')) {
        dataToUpdate.loadingDate = null; 
      } else {
        console.warn(`[listingsService - updateListing] Invalid loadingDate string for ID ${id}: ${dataToUpdate.loadingDate}. Field not updated.`);
        delete dataToUpdate.loadingDate;
      }
    }

    delete dataToUpdate.id; 
    delete dataToUpdate.postedAt; // Keep postedAt as is, or update to 'lastModifiedAt' if needed
    // userId should not be updatable by a user editing their own listing.
    // delete dataToUpdate.userId; 

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

    