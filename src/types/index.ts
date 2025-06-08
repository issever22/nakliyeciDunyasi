
import type { 
  CARGO_TYPES, 
  VEHICLES_NEEDED, 
  LOADING_TYPES, 
  CARGO_FORMS, 
  WEIGHT_UNITS,
  SHIPMENT_SCOPES
} from '@/lib/constants';
import type { CountryCode, TurkishCity } from '@/lib/locationData';

export type CargoType = typeof CARGO_TYPES[number];
export type VehicleNeeded = typeof VEHICLES_NEEDED[number];
export type LoadingType = typeof LOADING_TYPES[number];
export type CargoForm = typeof CARGO_FORMS[number];
export type WeightUnit = typeof WEIGHT_UNITS[number];
export type ShipmentScope = typeof SHIPMENT_SCOPES[number];

// This replaces the old VehicleType
export type VehicleType = typeof VEHICLES_NEEDED[number];


export interface Freight {
  id: string;
  userId: string; // ID of the user who posted
  
  // Genel Bilgiler
  companyName: string; // Firma Adı (replaces postedBy)
  contactPerson: string; // Yetkili Kişi
  contactEmail: string; // E-Posta (contact for the freight)
  workPhone?: string; // İş Telefonu (optional)
  mobilePhone: string; // Cep Telefonu
  
  // Yüke Ait Bilgiler
  cargoType: CargoType; // Yük Cinsi
  vehicleNeeded: VehicleNeeded; // Aranılan Araç (replaces old vehicleType)
  loadingType: LoadingType; // Yükün Yükleniş Şekli
  cargoForm: CargoForm; // Yükün Biçimi
  cargoWeight: number; // Yükün Tonajı
  cargoWeightUnit: WeightUnit; // Tonaj Birimi
  description: string; // Yükle İlgili Açıklama (replaces details)
  
  // Yükleme ve Varış Bilgileri
  originCountry: CountryCode | string; // Yükleneceği Ülke (string for 'OTHER')
  originCity: TurkishCity | string;    // Yükleneceği Şehir (string if not TR or 'OTHER' country)
  originDistrict?: string;   // Yükleneceği İlçe (optional, string)
  
  destinationCountry: CountryCode | string; // Varış Ülkesi
  destinationCity: TurkishCity | string;     // Varış Şehri
  destinationDistrict?: string;    // Varış İlçesi (optional, string)
  
  loadingDate: string; // Yükleme Tarihi (ISO date string)
  isContinuousLoad: boolean; // Sürekli (Proje) Yük
  
  // Meta data
  postedAt: string; // ISO date string (when the ad was posted)
  shipmentScope: ShipmentScope; // 'Yurt İçi' or 'Yurt Dışı', derived from countries
  
  // For compatibility with existing mock data structure and potential use, kept postedBy
  // This will be set to companyName during form submission.
  postedBy: string;
}

export interface UserProfile {
  id: string;
  email: string; // Auth email
  name: string;  // User's registered name / fallback for company name if not provided
}
