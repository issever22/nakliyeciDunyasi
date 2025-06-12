
'use server';

import { db } from '@/lib/firebase';
import { VEHICLES_NEEDED, CARGO_TYPES } from '@/lib/constants';
import type { 
  VehicleTypeSetting, 
  CargoTypeSetting, 
  AuthDocSetting, 
  MembershipSetting, 
  TransportTypeSetting, 
  AnnouncementSetting, 
  AdminNoteSetting,
  RequiredFor,
  DurationUnit,
  ApplicableTo,
  TargetAudience,
  NoteCategory
} from '@/types';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { parseISO } from 'date-fns';

const VEHICLE_TYPES_COLLECTION = 'settingsVehicleTypes';
const CARGO_TYPES_COLLECTION = 'settingsCargoTypes';
const AUTH_DOCS_COLLECTION = 'settingsAuthDocs';
const MEMBERSHIPS_COLLECTION = 'settingsMemberships';
const TRANSPORT_TYPES_COLLECTION = 'settingsTransportTypes';
const ANNOUNCEMENTS_COLLECTION = 'settingsAnnouncements';
const ADMIN_NOTES_COLLECTION = 'settingsAdminNotes';

interface SeedResultDetail {
  category?: string;
  name?: string; // For items with a 'name' or 'title'
  status: string;
}

const DUMMY_AUTH_DOCS: Omit<AuthDocSetting, 'id'>[] = [
  { name: "K1 Yetki Belgesi", requiredFor: "Firma", details: "Yurtiçi ticari amaçlı eşya taşımacılığı yapacaklara verilir.", isActive: true },
  { name: "C2 Yetki Belgesi", requiredFor: "Firma", details: "Uluslararası ve yurtiçi ticari amaçlı eşya taşımacılığı yapacaklara verilir.", isActive: true },
  { name: "Src Belgesi", requiredFor: "Bireysel", details: "Ticari araç sürücüleri için mesleki yeterlilik belgesi.", isActive: true },
];

const DUMMY_MEMBERSHIPS: Omit<MembershipSetting, 'id'>[] = [
  { name: "Standart Üyelik", price: 99, duration: 1, durationUnit: "Ay", features: ["Aylık 10 ilan hakkı", "Standart destek"], description: "Başlangıç seviyesi için aylık üyelik.", isActive: true },
  { name: "Premium Üyelik", price: 249, duration: 1, durationUnit: "Ay", features: ["Sınırsız ilan hakkı", "Öne çıkan ilanlar", "7/24 Destek"], description: "Profesyoneller için aylık premium üyelik.", isActive: true },
  { name: "Yıllık Gold Üyelik", price: 2499, duration: 1, durationUnit: "Yıl", features: ["Sınırsız ilan hakkı", "Öne çıkan ilanlar", "Dedicated Destek", "Raporlama"], description: "Uzun vadeli avantajlı yıllık üyelik.", isActive: true },
];

const DUMMY_TRANSPORT_TYPES: Omit<TransportTypeSetting, 'id'>[] = [
  { name: "Komple Taşıma", applicableTo: "Ticari", description: "Tek bir müşterinin yükünü bir araçla taşıma.", isActive: true },
  { name: "Parsiyel Taşıma", applicableTo: "Ticari", description: "Birden fazla müşterinin yükünü aynı araçta birleştirerek taşıma.", isActive: true },
  { name: "Evden Eve Nakliyat", applicableTo: "Evden Eve", description: "Konut ve ofis eşyalarının taşınması.", isActive: true },
  { name: "Proje Taşımacılığı", applicableTo: "Ticari", description: "Özel ekipman ve planlama gerektiren büyük ölçekli yükler.", isActive: true },
];

const DUMMY_ANNOUNCEMENTS: Omit<AnnouncementSetting, 'id' | 'createdAt'>[] = [
  { title: "Yeni Yıl Kampanyası!", content: "Tüm üyeliklerde %20 indirim fırsatını kaçırmayın. Detaylar için tıklayın.", targetAudience: "Tümü", startDate: "2023-12-15", endDate: "2024-01-05", isActive: true },
  { title: "Sistem Bakımı", content: "Platformumuzda 20 Ocak Pazar 02:00-04:00 saatleri arasında kısa süreli bir bakım çalışması yapılacaktır.", targetAudience: "Tümü", startDate: "2024-01-18", endDate: "2024-01-20", isActive: true },
];

const DUMMY_ADMIN_NOTES: Omit<AdminNoteSetting, 'id' | 'createdDate' | 'lastModifiedDate'>[] = [
  { title: "Kullanıcı Arayüzü Geri Bildirimi", content: "Kullanıcılar mobil arayüzde filtrelerin daha belirgin olmasını talep ediyor.", category: "Kullanıcı Geri Bildirimi", isImportant: false },
  { title: "Pazarlama Stratejisi Toplantısı", content: "Gelecek çeyrek pazarlama hedefleri ve bütçesi için 15 Şubat'ta toplantı planlandı.", category: "Yönetici", isImportant: true },
];


export async function seedInitialSettings(): Promise<{ success: boolean; message: string; details?: SeedResultDetail[] }> {
  const results: SeedResultDetail[] = [];
  let successOverall = true;
  const now = Timestamp.fromDate(new Date());

  // Seed Vehicle Types
  try {
    const vehicleTypesRef = collection(db, VEHICLE_TYPES_COLLECTION);
    results.push({ category: 'Araç Tipleri', status: 'Başlatılıyor...' });
    for (const vehicleName of VEHICLES_NEEDED) {
      try {
        const q = query(vehicleTypesRef, where('name', '==', vehicleName));
        const existingDocs = await getDocs(q);
        if (existingDocs.empty) {
          const newVehicleType: Omit<VehicleTypeSetting, 'id'> = { name: vehicleName, description: `Araç tipi: ${vehicleName}`, isActive: true };
          await addDoc(vehicleTypesRef, newVehicleType);
          results.push({ name: vehicleName, status: 'Başarıyla eklendi' });
        } else {
          results.push({ name: vehicleName, status: 'Zaten mevcut, atlandı' });
        }
      } catch (e: any) { results.push({ name: vehicleName, status: `Ekleme hatası: ${e.message}`}); successOverall = false; }
    }
    results.push({ category: 'Araç Tipleri', status: 'Tamamlandı.' });
  } catch (e:any) { results.push({ category: 'Araç Tipleri', status: `Genel Hata: ${e.message}`}); successOverall = false; }

  // Seed Cargo Types
  try {
    const cargoTypesRef = collection(db, CARGO_TYPES_COLLECTION);
    results.push({ category: 'Yük Cinsleri', status: 'Başlatılıyor...' });
    for (const cargoName of CARGO_TYPES) {
      try {
        const q = query(cargoTypesRef, where('name', '==', cargoName));
        const existingDocs = await getDocs(q);
        if (existingDocs.empty) {
          const newCargoType: Omit<CargoTypeSetting, 'id'> = { name: cargoName, category: 'Genel', isActive: true };
          await addDoc(cargoTypesRef, newCargoType);
          results.push({ name: cargoName, status: 'Başarıyla eklendi' });
        } else {
          results.push({ name: cargoName, status: 'Zaten mevcut, atlandı' });
        }
      } catch (e: any) { results.push({ name: cargoName, status: `Ekleme hatası: ${e.message}`}); successOverall = false; }
    }
    results.push({ category: 'Yük Cinsleri', status: 'Tamamlandı.' });
  } catch (e:any) { results.push({ category: 'Yük Cinsleri', status: `Genel Hata: ${e.message}`}); successOverall = false; }

  // Seed Auth Docs
  try {
    const authDocsRef = collection(db, AUTH_DOCS_COLLECTION);
    results.push({ category: 'Yetki Belgeleri', status: 'Başlatılıyor...' });
    for (const docData of DUMMY_AUTH_DOCS) {
      try {
        const q = query(authDocsRef, where('name', '==', docData.name));
        const existingDocs = await getDocs(q);
        if (existingDocs.empty) {
          await addDoc(authDocsRef, docData);
          results.push({ name: docData.name, status: 'Başarıyla eklendi' });
        } else {
          results.push({ name: docData.name, status: 'Zaten mevcut, atlandı' });
        }
      } catch (e: any) { results.push({ name: docData.name, status: `Ekleme hatası: ${e.message}`}); successOverall = false; }
    }
    results.push({ category: 'Yetki Belgeleri', status: 'Tamamlandı.' });
  } catch (e:any) { results.push({ category: 'Yetki Belgeleri', status: `Genel Hata: ${e.message}`}); successOverall = false; }

  // Seed Memberships
  try {
    const membershipsRef = collection(db, MEMBERSHIPS_COLLECTION);
    results.push({ category: 'Üyelikler', status: 'Başlatılıyor...' });
    for (const membershipData of DUMMY_MEMBERSHIPS) {
      try {
        const q = query(membershipsRef, where('name', '==', membershipData.name));
        const existingDocs = await getDocs(q);
        if (existingDocs.empty) {
          await addDoc(membershipsRef, membershipData);
          results.push({ name: membershipData.name, status: 'Başarıyla eklendi' });
        } else {
          results.push({ name: membershipData.name, status: 'Zaten mevcut, atlandı' });
        }
      } catch (e: any) { results.push({ name: membershipData.name, status: `Ekleme hatası: ${e.message}`}); successOverall = false; }
    }
    results.push({ category: 'Üyelikler', status: 'Tamamlandı.' });
  } catch (e:any) { results.push({ category: 'Üyelikler', status: `Genel Hata: ${e.message}`}); successOverall = false; }
  
  // Seed Transport Types
  try {
    const transportTypesRef = collection(db, TRANSPORT_TYPES_COLLECTION);
    results.push({ category: 'Taşımacılık Türleri', status: 'Başlatılıyor...' });
    for (const transportData of DUMMY_TRANSPORT_TYPES) {
      try {
        const q = query(transportTypesRef, where('name', '==', transportData.name));
        const existingDocs = await getDocs(q);
        if (existingDocs.empty) {
          await addDoc(transportTypesRef, transportData);
          results.push({ name: transportData.name, status: 'Başarıyla eklendi' });
        } else {
          results.push({ name: transportData.name, status: 'Zaten mevcut, atlandı' });
        }
      } catch (e: any) { results.push({ name: transportData.name, status: `Ekleme hatası: ${e.message}`}); successOverall = false; }
    }
    results.push({ category: 'Taşımacılık Türleri', status: 'Tamamlandı.' });
  } catch (e:any) { results.push({ category: 'Taşımacılık Türleri', status: `Genel Hata: ${e.message}`}); successOverall = false; }

  // Seed Announcements
  try {
    const announcementsRef = collection(db, ANNOUNCEMENTS_COLLECTION);
    results.push({ category: 'Duyurular', status: 'Başlatılıyor...' });
    for (const announcementData of DUMMY_ANNOUNCEMENTS) {
      try {
        const q = query(announcementsRef, where('title', '==', announcementData.title));
        const existingDocs = await getDocs(q);
        if (existingDocs.empty) {
          const dataToSave = {
            ...announcementData,
            startDate: announcementData.startDate ? Timestamp.fromDate(parseISO(announcementData.startDate)) : null,
            endDate: announcementData.endDate ? Timestamp.fromDate(parseISO(announcementData.endDate)) : null,
            createdAt: now,
          };
          await addDoc(announcementsRef, dataToSave);
          results.push({ name: announcementData.title, status: 'Başarıyla eklendi' });
        } else {
          results.push({ name: announcementData.title, status: 'Zaten mevcut, atlandı' });
        }
      } catch (e: any) { results.push({ name: announcementData.title, status: `Ekleme hatası: ${e.message}`}); successOverall = false; }
    }
    results.push({ category: 'Duyurular', status: 'Tamamlandı.' });
  } catch (e:any) { results.push({ category: 'Duyurular', status: `Genel Hata: ${e.message}`}); successOverall = false; }

  // Seed Admin Notes
  try {
    const adminNotesRef = collection(db, ADMIN_NOTES_COLLECTION);
    results.push({ category: 'Yönetici Notları', status: 'Başlatılıyor...' });
    for (const noteData of DUMMY_ADMIN_NOTES) {
      try {
        const q = query(adminNotesRef, where('title', '==', noteData.title));
        const existingDocs = await getDocs(q);
        if (existingDocs.empty) {
          const dataToSave = {
            ...noteData,
            createdDate: now,
            lastModifiedDate: now,
          };
          await addDoc(adminNotesRef, dataToSave);
          results.push({ name: noteData.title, status: 'Başarıyla eklendi' });
        } else {
          results.push({ name: noteData.title, status: 'Zaten mevcut, atlandı' });
        }
      } catch (e: any) { results.push({ name: noteData.title, status: `Ekleme hatası: ${e.message}`}); successOverall = false; }
    }
    results.push({ category: 'Yönetici Notları', status: 'Tamamlandı.' });
  } catch (e:any) { results.push({ category: 'Yönetici Notları', status: `Genel Hata: ${e.message}`}); successOverall = false; }
  
  const finalMessage = successOverall 
      ? 'Başlangıç ayarları başarıyla Firestore\'a yüklendi (veya zaten mevcuttu).'
      : 'Bazı ayarlar yüklenirken hatalar oluştu. Detayları kontrol edin.';

  return { success: successOverall, message: finalMessage, details: results };
}

    