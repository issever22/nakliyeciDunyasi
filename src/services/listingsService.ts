
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
import { parseISO, isValid } from 'date-fns';

const LISTINGS_COLLECTION = 'listings';

// Helper to convert Firestore document data to Freight type
const convertToFreight = (docSnap: QueryDocumentSnapshot<DocumentData> | DocumentData, id?: string): Freight => {
  const data = id ? docSnap as DocumentData : (docSnap as QueryDocumentSnapshot<DocumentData>).data();
  const docId = id || (docSnap as QueryDocumentSnapshot<DocumentData>).id;

  // Ensure dates are ISO strings
  let loadingDateStr = new Date().toISOString().split('T')[0]; // Default to today
  if (data.loadingDate) {
    if (data.loadingDate instanceof Timestamp) {
      loadingDateStr = data.loadingDate.toDate().toISOString().split('T')[0];
    } else if (typeof data.loadingDate === 'string' && isValid(parseISO(data.loadingDate))) {
      loadingDateStr = parseISO(data.loadingDate).toISOString().split('T')[0];
    }
  }

  let postedAtStr = new Date().toISOString(); // Default to now
  if (data.postedAt) {
    if (data.postedAt instanceof Timestamp) {
      postedAtStr = data.postedAt.toDate().toISOString();
    } else if (typeof data.postedAt === 'string' && isValid(parseISO(data.postedAt))) {
      postedAtStr = parseISO(data.postedAt).toISOString();
    }
  }
  
  const baseFreight = {
    id: docId,
    userId: data.userId || '',
    postedBy: data.postedBy || '',
    companyName: data.companyName || '',
    contactPerson: data.contactPerson || '',
    contactEmail: data.contactEmail,
    workPhone: data.workPhone,
    mobilePhone: data.mobilePhone || '',
    originCountry: data.originCountry || 'TR',
    originCity: data.originCity || '',
    originDistrict: data.originDistrict,
    destinationCountry: data.destinationCountry || 'TR',
    destinationCity: data.destinationCity || '',
    destinationDistrict: data.destinationDistrict,
    loadingDate: loadingDateStr, // For EmptyVehicle this is availabilityDate
    postedAt: postedAtStr,
    isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
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
  // Fallback or handle unknown type
  return { ...baseFreight, freightType: data.freightType || 'Ticari' } as Freight; // Default to Commercial if type is unknown
};

export const getListings = async (
  options: {
    lastVisibleDoc?: QueryDocumentSnapshot<DocumentData> | null;
    pageSize?: number;
    filters?: FreightFilterOptions;
  } = {}
): Promise<{ freights: Freight[]; newLastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  const { lastVisibleDoc = null, pageSize = 6, filters = {} } = options;
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const queryConstraints: QueryConstraint[] = [where('isActive', '==', true)];

    if (filters.freightType) {
      queryConstraints.push(where('freightType', '==', filters.freightType));
      if (filters.freightType === 'Ticari') {
        if (filters.vehicleNeeded) queryConstraints.push(where('vehicleNeeded', '==', filters.vehicleNeeded));
        if (filters.shipmentScope) queryConstraints.push(where('shipmentScope', '==', filters.shipmentScope));
      }
      // Add specific filters for 'Boş Araç' if needed in the future
    }
    if (filters.originCity) queryConstraints.push(where('originCity', '>=', filters.originCity), where('originCity', '<=', filters.originCity + '\uf8ff'));
    if (filters.destinationCity) queryConstraints.push(where('destinationCity', '>=', filters.destinationCity), where('destinationCity', '<=', filters.destinationCity + '\uf8ff'));

    queryConstraints.push(orderBy('postedAt', filters.sortBy === 'oldest' ? 'asc' : 'desc'));

    if (lastVisibleDoc) {
      queryConstraints.push(startAfter(lastVisibleDoc));
    }
    queryConstraints.push(limit(pageSize));

    const q = query(listingsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    const freights = querySnapshot.docs.map(doc => convertToFreight(doc));
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    return { freights, newLastVisibleDoc: newLastDoc };
  } catch (error) {
    console.error("Error fetching listings:", error);
    return { freights: [], newLastVisibleDoc: null };
  }
};

export const getAllListingsForAdmin = async (): Promise<Freight[]> => {
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const q = query(listingsRef, orderBy('postedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToFreight(doc));
  } catch (error) {
    console.error("Error fetching all listings for admin:", error);
    return [];
  }
};

export const getListingById = async (id: string): Promise<Freight | null> => {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return convertToFreight(docSnap.data() as DocumentData, docSnap.id);
    }
    return null;
  } catch (error) {
    console.error("Error fetching listing by ID:", error);
    return null;
  }
};

export const addListing = async (userId: string, listingData: FreightCreationData): Promise<string | null> => {
  try {
    const dataToSave = {
      ...listingData,
      userId,
      postedBy: listingData.postedBy || 'Bilinmiyor',
      companyName: listingData.companyName || 'Bilinmiyor',
      contactPerson: listingData.contactPerson || 'Bilinmiyor',
      mobilePhone: listingData.mobilePhone || 'Belirtilmedi',
      postedAt: Timestamp.fromDate(new Date()),
      loadingDate: Timestamp.fromDate(parseISO(listingData.loadingDate)), 
      isActive: typeof listingData.isActive === 'boolean' ? listingData.isActive : true,
    };
    const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), dataToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error adding listing:", error);
    return null;
  }
};

export const updateListing = async (id: string, listingUpdateData: FreightUpdateData): Promise<boolean> => {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    const dataToUpdate: any = { ...listingUpdateData };

    if (dataToUpdate.loadingDate && typeof dataToUpdate.loadingDate === 'string') {
      dataToUpdate.loadingDate = Timestamp.fromDate(parseISO(dataToUpdate.loadingDate));
    }
    
    delete dataToUpdate.id; 
    delete dataToUpdate.postedAt;
    delete dataToUpdate.userId;

    await updateDoc(docRef, dataToUpdate);
    return true;
  } catch (error) {
    console.error("Error updating listing:", error);
    return false;
  }
};

export const deleteListing = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting listing:", error);
    return false;
  }
};
