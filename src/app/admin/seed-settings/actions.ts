'use server';

import { db } from '@/lib/firebase';
import { VEHICLES_NEEDED, CARGO_TYPES } from '@/lib/constants';
import type { VehicleTypeSetting, CargoTypeSetting } from '@/types';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const VEHICLE_TYPES_COLLECTION = 'settingsVehicleTypes';
const CARGO_TYPES_COLLECTION = 'settingsCargoTypes';

interface SeedResultDetail {
  category?: string;
  name?: string;
  status: string;
}

export async function seedInitialSettings(): Promise<{ success: boolean; message: string; details?: SeedResultDetail[] }> {
  const results: SeedResultDetail[] = [];
  let successOverall = true;

  try {
    // Seed Vehicle Types
    const vehicleTypesRef = collection(db, VEHICLE_TYPES_COLLECTION);
    results.push({ category: 'Araç Tipleri', status: 'Başlatılıyor...' });

    for (const vehicleName of VEHICLES_NEEDED) {
      try {
        const q = query(vehicleTypesRef, where('name', '==', vehicleName));
        const existingDocs = await getDocs(q);

        if (existingDocs.empty) {
          const newVehicleType: Omit<VehicleTypeSetting, 'id'> = {
            name: vehicleName,
            description: `Araç tipi: ${vehicleName}`,
            isActive: true,
          };
          await addDoc(vehicleTypesRef, newVehicleType);
          results.push({ name: vehicleName, status: 'Başarıyla eklendi' });
        } else {
          results.push({ name: vehicleName, status: 'Zaten mevcut, atlandı' });
        }
      } catch (e: any) {
        results.push({ name: vehicleName, status: `Ekleme hatası: ${e.message}`});
        successOverall = false;
      }
    }
    results.push({ category: 'Araç Tipleri', status: 'Tamamlandı.' });

    // Seed Cargo Types
    const cargoTypesRef = collection(db, CARGO_TYPES_COLLECTION);
    results.push({ category: 'Yük Cinsleri', status: 'Başlatılıyor...' });

    for (const cargoName of CARGO_TYPES) {
      try {
        const q = query(cargoTypesRef, where('name', '==', cargoName));
        const existingDocs = await getDocs(q);

        if (existingDocs.empty) {
          const newCargoType: Omit<CargoTypeSetting, 'id'> = {
            name: cargoName,
            category: 'Genel', // Varsayılan kategori
            isActive: true,
          };
          await addDoc(cargoTypesRef, newCargoType);
          results.push({ name: cargoName, status: 'Başarıyla eklendi' });
        } else {
          results.push({ name: cargoName, status: 'Zaten mevcut, atlandı' });
        }
      } catch (e: any) {
        results.push({ name: cargoName, status: `Ekleme hatası: ${e.message}`});
        successOverall = false;
      }
    }
    results.push({ category: 'Yük Cinsleri', status: 'Tamamlandı.' });
    
    const finalMessage = successOverall 
        ? 'Başlangıç ayarları başarıyla Firestore\'a yüklendi (veya zaten mevcuttu).'
        : 'Bazı ayarlar yüklenirken hatalar oluştu. Detayları kontrol edin.';

    return { success: successOverall, message: finalMessage, details: results };

  } catch (error: any) {
    console.error("Genel veri yükleme hatası:", error);
    results.push({ category: 'Genel Hata', status: `Hata: ${error.message}` });
    return { success: false, message: `Başlangıç ayarları yüklenirken bir hata oluştu: ${error.message}`, details: results };
  }
}
