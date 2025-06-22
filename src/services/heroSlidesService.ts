
'use server';
import { db } from '@/lib/firebase';
import type { HeroSlide, HeroSlideCreationData, HeroSlideUpdateData } from '@/types';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  Timestamp,
  DocumentData
} from 'firebase/firestore';

const HERO_SLIDES_COLLECTION = 'heroSlides';

const convertToHeroSlide = (docData: DocumentData, id: string): HeroSlide => {
  const data = { ...docData } as any;
  if (data.createdAt && data.createdAt instanceof Timestamp) {
    data.createdAt = data.createdAt.toDate().toISOString();
  } else {
    data.createdAt = new Date().toISOString();
  }
  return { id, ...data } as HeroSlide;
};

// For Admin: Get all slides regardless of status
export const getAllHeroSlides = async (): Promise<HeroSlide[]> => {
  try {
    const q = query(collection(db, HERO_SLIDES_COLLECTION), orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToHeroSlide(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching all hero slides: ", error);
    return [];
  }
};

// For Frontend: Get only active slides
export const getActiveHeroSlides = async (): Promise<HeroSlide[]> => {
    try {
      const q = query(
        collection(db, HERO_SLIDES_COLLECTION), 
        where('isActive', '==', true), 
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => convertToHeroSlide(doc.data(), doc.id));
    } catch (error) {
      console.error("Error fetching active hero slides: ", error);
      return [];
    }
  };

export const addHeroSlide = async (data: HeroSlideCreationData): Promise<string | null> => {
  try {
    const dataToSave = {
        ...data,
        createdAt: Timestamp.fromDate(new Date()),
    };
    const docRef = await addDoc(collection(db, HERO_SLIDES_COLLECTION), dataToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error adding hero slide: ", error);
    return null;
  }
};

export const updateHeroSlide = async (id: string, data: HeroSlideUpdateData): Promise<boolean> => {
  try {
    const docRef = doc(db, HERO_SLIDES_COLLECTION, id);
    // Don't update createdAt
    const { createdAt, id: slideId, ...updateData } = data as any;
    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating hero slide: ", error);
    return false;
  }
};

export const deleteHeroSlide = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, HERO_SLIDES_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting hero slide: ", error);
    return false;
  }
};
