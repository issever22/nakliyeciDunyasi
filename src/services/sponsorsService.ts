
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
import { parseISO, isValid, max, isAfter } from 'date-fns';


export const getActiveSponsorCompanyIds = async (): Promise<Set<string>> => {
    try {
        const usersRef = collection(db, 'users');
        const today = Timestamp.now();

        // Firestore cannot do an OR query on two different fields.
        // We need to fetch users whose sponsorship has not expired OR is indefinite (null).
        const q1 = query(usersRef, where('sponsorshipExpiryDate', '>=', today));
        const q2 = query(usersRef, where('sponsorshipExpiryDate', '==', null));
        
        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(q1),
            getDocs(q2)
        ]);

        const sponsorIds = new Set<string>();
        snapshot1.docs.forEach(doc => sponsorIds.add(doc.id));
        snapshot2.docs.forEach(doc => sponsorIds.add(doc.id));

        return sponsorIds;
    } catch (error) {
        console.error("Error fetching active sponsor company IDs: ", error);
        return new Set<string>();
    }
};


export const addSponsorshipsToUser = async (
  companyId: string,
  countryCodes: string[],
  cityNames: string[],
  startDateStr: string,
  endDateStr?: string
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
    const userData = userDocSnap.data() as CompanyUserProfile;
    const existingSponsorships: SponsorshipLocation[] = userData.sponsorships || [];
    const existingSponsorshipsSet = new Set(existingSponsorships.map(s => `${s.type}:${s.name}`));

    let addedCount = 0;
    
    const newSponsorships: SponsorshipLocation[] = [];

    countryCodes.forEach(code => {
        if (!existingSponsorshipsSet.has(`country:${code}`)) {
            newSponsorships.push({ type: 'country', name: code, startDate: startDateStr, endDate: endDateStr });
            addedCount++;
        }
    });

    cityNames.forEach(name => {
        if (!existingSponsorshipsSet.has(`city:${name}`)) {
            newSponsorships.push({ type: 'city', name: name, startDate: startDateStr, endDate: endDateStr });
            addedCount++;
        }
    });

    if (addedCount === 0) {
        return { success: true, message: 'Seçilen tüm sponsorluklar zaten mevcut, yeni kayıt eklenmedi.', addedCount: 0, skippedCount: countryCodes.length + cityNames.length };
    }

    const allSponsorships = [...existingSponsorships, ...newSponsorships];

    // Calculate the latest expiry date
    let latestExpiry: Date | null = null;
    let hasIndefiniteSponsorship = false;

    for (const sp of allSponsorships) {
        if (!sp.endDate) {
            hasIndefiniteSponsorship = true;
            break; // If one is indefinite, the overall expiry is indefinite (null)
        }
        const currentEndDate = parseISO(sp.endDate);
        if (isValid(currentEndDate)) {
            if (!latestExpiry || isAfter(currentEndDate, latestExpiry)) {
                latestExpiry = currentEndDate;
            }
        }
    }
    
    // If there is an indefinite sponsorship, the expiry date is null.
    // Otherwise, it's the latest date found.
    const newExpiryDate = hasIndefiniteSponsorship ? null : (latestExpiry ? Timestamp.fromDate(latestExpiry) : null);

    await updateDoc(userDocRef, {
        sponsorships: allSponsorships,
        sponsorshipExpiryDate: newExpiryDate
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
