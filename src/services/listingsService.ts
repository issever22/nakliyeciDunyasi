
'use server';

import { db } from '@/lib/firebase';
import type { Freight, FreightFilterOptions, FreightCreationData, FreightUpdateData, EmptyVehicleListing, FreightType } from '@/types';
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
import { parseISO, isValid, formatISO, startOfDay } from 'date-fns';

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
    loadingDateStr = new Date().toISOString();
  }

  let postedAtStr: string;
  if (data.postedAt && data.postedAt instanceof Timestamp) {
    postedAtStr = data.postedAt.toDate().toISOString();
  } else if (data.postedAt && typeof data.postedAt === 'string' && isValid(parseISO(data.postedAt))) {
    postedAtStr = data.postedAt;
  } else {
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
    return {
      ...baseFreight,
      freightType: 'Boş Araç',
      advertisedVehicleType: data.advertisedVehicleType || 'Belirtilmemiş',
      serviceTypeForLoad: data.serviceTypeForLoad || 'Komple',
      vehicleStatedCapacity: data.vehicleStatedCapacity === undefined ? 0 : data.vehicleStatedCapacity,
      vehicleStatedCapacityUnit: data.vehicleStatedCapacityUnit || 'Ton',
    } as Freight;
  }
  return { ...baseFreight, freightType: 'Yük', cargoType: 'Diğer', vehicleNeeded: 'Araç Farketmez', loadingType: 'Komple', cargoForm: 'Diğer', cargoWeight: 0, cargoWeightUnit: 'Ton', isContinuousLoad: false, shipmentScope: 'Yurt İçi' } as Freight;
};

export const getPaginatedAdminListings = async (
  options: {
    lastVisibleDoc?: QueryDocumentSnapshot<DocumentData> | null;
    pageSize?: number;
    filters?: {
      type: FreightType | 'all';
      status: 'active' | 'inactive' | 'all';
      searchTerm: string;
    }
  } = {}
): Promise<{ 
  listings: Freight[]; 
  newLastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null; 
  error?: { message: string; indexCreationUrl?: string } 
}> => {
  const { lastVisibleDoc = null, pageSize = 15, filters = { type: 'all', status: 'all', searchTerm: '' } } = options;
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const queryConstraints: QueryConstraint[] = [];

    // NOTE: Firestore does not support full-text search. This search is a basic "starts with" on companyName.
    if (filters.searchTerm) {
        const searchTerm = filters.searchTerm;
        queryConstraints.push(where('companyName', '>=', searchTerm));
        queryConstraints.push(where('companyName', '<=', searchTerm + '\uf8ff'));
    }

    if (filters.type && filters.type !== 'all') {
        queryConstraints.push(where('freightType', '==', filters.type));
    }
    if (filters.status && filters.status !== 'all') {
        queryConstraints.push(where('isActive', '==', filters.status === 'active'));
    }

    // If searching, order by companyName. Otherwise, order by date.
    // Combining inequality filters (like search) with order by on a different field requires a composite index.
    queryConstraints.push(orderBy(filters.searchTerm ? 'companyName' : 'postedAt', 'desc'));
    
    if (lastVisibleDoc) {
      queryConstraints.push(startAfter(lastVisibleDoc));
    }
    queryConstraints.push(limit(pageSize));

    const q = query(listingsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    const listings = querySnapshot.docs.map(doc => convertToFreight(doc));
    const newLastDoc = querySnapshot.docs.length === pageSize ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;
    
    return { listings, newLastVisibleDoc: newLastDoc };
  } catch (error: any) {
    console.error("[listingsService.ts - getPaginatedAdminListings] Error:", error);
    let errorMessage = "İlanlar yüklenirken bilinmeyen bir hata oluştu.";
    let indexCreationUrl: string | undefined = undefined;

    if (error.code === 'failed-precondition') {
        errorMessage = error.message || "Eksik Firestore dizini. Lütfen tarayıcı konsolunu kontrol edin.";
        const urlRegex = /(https:\/\/console\.firebase\.google\.com\/project\/[^\/]+\/firestore\/indexes\?create_composite=[^ ]+)/;
        const match = errorMessage.match(urlRegex);
        if (match && match[0]) {
            indexCreationUrl = match[0];
        }
    } else {
        errorMessage = error.message;
    }
    return { listings: [], newLastVisibleDoc: null, error: { message: errorMessage, indexCreationUrl } };
  }
};


export const getListingsByUserId = async (userId: string, options: { onlyActive?: boolean; freightType?: FreightType } = {}): Promise<{ listings: Freight[]; error?: { message: string; indexCreationUrl?: string } }> => {
   if (userId.startsWith(GUEST_USER_ID_PREFIX)) {
    return { listings: [] }; // Guests cannot have "my listings" page
  }
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const queryConstraints: QueryConstraint[] = [];

    queryConstraints.push(where('userId', '==', userId));
    
    if (options.onlyActive) {
        queryConstraints.push(where('isActive', '==', true));
    }
    
    if (options.freightType) {
        queryConstraints.push(where('freightType', '==', options.freightType));
    }

    queryConstraints.push(orderBy('postedAt', 'desc'));

    const q = query(listingsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    const listings = querySnapshot.docs.map(doc => convertToFreight(doc));
    return { listings };
  } catch (error: any) {
    let errorMessage = "Kullanıcı ilanları yüklenirken bilinmeyen bir hata oluştu.";
    let indexCreationUrl: string | undefined = undefined;

    if (error.code === 'failed-precondition') {
        errorMessage = error.message || "Eksik Firestore dizini (kullanıcı ilanları). Lütfen sunucu konsolunu kontrol edin.";
        const urlRegex = /(https:\/\/console\.firebase\.google\.com\/project\/[^/]+\/firestore\/indexes\?create_composite=[^ ]+)/;
        const match = errorMessage.match(urlRegex);
        if (match && match[0]) {
            indexCreationUrl = match[0];
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

  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const queryConstraints: QueryConstraint[] = [];

    queryConstraints.push(where('isActive', '==', true));
    
    if (filters?.postedToday) {
      const todayStart = startOfDay(new Date());
      queryConstraints.push(where('postedAt', '>=', Timestamp.fromDate(todayStart)));
    }

    if (filters?.isContinuousLoad) {
      queryConstraints.push(where('isContinuousLoad', '==', true));
    }

    if (filters?.originCity) {
      queryConstraints.push(where('originCity', '==', filters.originCity));
    }
    if (filters?.destinationCity) {
      queryConstraints.push(where('destinationCity', '==', filters.destinationCity));
    }
    if (filters?.freightType) {
      queryConstraints.push(where('freightType', '==', filters.freightType));
    }
    
    // These filters only apply if the freightType is 'Yük' (or not specified)
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

    const q = query(listingsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    const freights = querySnapshot.docs.map(doc => convertToFreight(doc));
    const newLastDoc = querySnapshot.docs.length === pageSize ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

    return { freights, newLastVisibleDoc: newLastDoc };
  } catch (error: any) {
    let errorMessage = "İlanlar yüklenirken bilinmeyen bir hata oluştu.";
    let indexCreationUrl: string | undefined = undefined;

    if (error.code === 'failed-precondition') {
        errorMessage = error.message || "Eksik Firestore dizini. Lütfen sunucu konsolunu kontrol edin.";
        const urlRegex = /(https:\/\/console\.firebase\.google\.com\/project\/[^/]+\/firestore\/indexes\?create_composite=[^ ]+)/;
        const match = errorMessage.match(urlRegex);
        if (match && match[0]) {
            indexCreationUrl = match[0];
        }
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { freights: [], newLastVisibleDoc: null, error: { message: errorMessage, indexCreationUrl } };
  }
};

export const getListingById = async (id: string): Promise<Freight | null> => {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const listing = convertToFreight(docSnap.data() as DocumentData, docSnap.id);
      // Only return if it's active
      if (listing.isActive) {
        return listing;
      }
    }
    return null;
  } catch (error) {
    console.error(`[listingsService - getListingById] Error fetching listing by ID ${id}:`, error);
    return null;
  }
};

export const addListing = async (userIdFromAuth: string | undefined, listingData: FreightCreationData): Promise<string | null> => {
  try {
    let loadingDateTimestamp: Timestamp;
    if (listingData.loadingDate && typeof listingData.loadingDate === 'string' && isValid(parseISO(listingData.loadingDate))) {
      loadingDateTimestamp = Timestamp.fromDate(parseISO(listingData.loadingDate));
    } else {
      loadingDateTimestamp = Timestamp.fromDate(new Date());
    }

    const finalUserId = userIdFromAuth || `${GUEST_USER_ID_PREFIX}${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const dataToSave = {
      ...listingData,
      userId: finalUserId,
      postedBy: listingData.postedBy || 'Bilinmiyor', 
      companyName: listingData.companyName, 
      contactPerson: listingData.contactPerson,
      mobilePhone: listingData.mobilePhone,
      postedAt: Timestamp.fromDate(new Date()),
      loadingDate: loadingDateTimestamp,
      isActive: typeof listingData.isActive === 'boolean' ? listingData.isActive : true,
    };
    const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), dataToSave);
    return docRef.id;
  } catch (error) {
    console.error("[listingsService - addListing] Error adding listing:", error);
    return null;
  }
};

export const updateListing = async (id: string, listingUpdateData: FreightUpdateData): Promise<boolean> => {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    const dataToUpdate: any = { ...listingUpdateData };

    if (dataToUpdate.hasOwnProperty('loadingDate')) {
      if (dataToUpdate.loadingDate && typeof dataToUpdate.loadingDate === 'string' && isValid(parseISO(dataToUpdate.loadingDate))) {
        dataToUpdate.loadingDate = Timestamp.fromDate(parseISO(dataToUpdate.loadingDate));
      } else if (dataToUpdate.loadingDate === null || dataToUpdate.loadingDate === undefined || (typeof dataToUpdate.loadingDate === 'string' && dataToUpdate.loadingDate.trim() === '')) {
        dataToUpdate.loadingDate = null; 
      } else {
        delete dataToUpdate.loadingDate;
      }
    }

    delete dataToUpdate.id; 
    delete dataToUpdate.postedAt;
    
    await updateDoc(docRef, dataToUpdate);
    return true;
  } catch (error) {
    console.error(`[listingsService - updateListing] Error updating listing with ID ${id}:`, error);
    return false;
  }
};

export const deleteListing = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`[listingsService - deleteListing] Error deleting listing with ID ${id}:`, error);
    return false;
  }
};
