
'use server';
import { db } from '@/lib/firebase';
import type { CompanyUserProfile, SponsorshipLocation } from '@/types';
import { 
  collection, 
  doc, 
  updateDoc, 
  Timestamp,
  getDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

export const getActiveSponsorCompanyIds = async (): Promise<Set<string>> => {
    try {
        const usersRef = collection(db, 'users');
        // Query for users where the sponsorships array exists and is not empty.
        // Firestore's '!=' operator can check for non-empty arrays,
        // but it may require a composite index if you add other range/inequality filters.
        const q = query(usersRef, where('sponsorships', '!=', []));
        const querySnapshot = await getDocs(q);

        const sponsorIds = new Set<string>();
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            // A secondary check to be safe: ensure the array truly has items.
            if (data.sponsorships && Array.isArray(data.sponsorships) && data.sponsorships.length > 0) {
                 sponsorIds.add(doc.id);
            }
        });

        return sponsorIds;
    } catch (error) {
        console.error("Error fetching active sponsor company IDs: ", error);
        return new Set<string>();
    }
};


export const addSponsorshipsToUser = async (
  companyId: string,
  countryCodes: string[],
  cityNames: string[]
): Promise<{ success: boolean; message: string; addedCount: number; skippedCount: number }> => {
  if (!companyId) {
    return { success: false, message: "Firma seçimi zorunludur.", addedCount: 0, skippedCount: 0 };
  }
  if (countryCodes.length === 0 && cityNames.length === 0) {
    return { success: false, message: "En az bir ülke veya şehir seçilmelidir.", addedCount: 0, skippedCount: 0 };
  }

  try {
    const userDocRef = doc(db, 'users', companyId);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return { success: false, message: "Seçilen firma bulunamadı.", addedCount: 0, skippedCount: 0 };
    }
    const userData = userDocSnap.data();
    const existingSponsorships: SponsorshipLocation[] = userData.sponsorships || [];
    const existingSponsorshipsSet = new Set(existingSponsorships.map(s => `${s.type}:${s.name}`));

    let addedCount = 0;
    
    const newSponsorships: SponsorshipLocation[] = [];

    countryCodes.forEach(code => {
        if (!existingSponsorshipsSet.has(`country:${code}`)) {
            newSponsorships.push({ type: 'country', name: code });
            addedCount++;
        }
    });

    cityNames.forEach(name => {
        if (!existingSponsorshipsSet.has(`city:${name}`)) {
            newSponsorships.push({ type: 'city', name: name });
            addedCount++;
        }
    });

    if (addedCount === 0) {
        return { success: true, message: 'Seçilen tüm sponsorluklar zaten mevcut, yeni kayıt eklenmedi.', addedCount: 0, skippedCount: countryCodes.length + cityNames.length };
    }

    const allSponsorships = [...existingSponsorships, ...newSponsorships];
    
    await updateDoc(userDocRef, {
        sponsorships: allSponsorships,
    });

    let message = `${addedCount} yeni sponsorluk eklendi.`;
    const skippedCount = countryCodes.length + cityNames.length - addedCount;
    if (skippedCount > 0) message += ` ${skippedCount} mevcut sponsorluk atlandı.`;

    return { success: true, message, addedCount, skippedCount };
  } catch (error) {
    console.error("Error adding sponsorships to user: ", error);
    return { success: false, message: "Sponsorluklar eklenirken bir hata oluştu.", addedCount: 0, skippedCount: 0 };
  }
};
