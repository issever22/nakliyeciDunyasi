
import type { 
  CARGO_TYPES, 
  VEHICLES_NEEDED, 
  LOADING_TYPES, 
  CARGO_FORMS, 
  WEIGHT_UNITS,
  SHIPMENT_SCOPES,
  FREIGHT_TYPES,
  RESIDENTIAL_TRANSPORT_TYPES,
  RESIDENTIAL_PLACE_TYPES,
  RESIDENTIAL_ELEVATOR_STATUSES,
  RESIDENTIAL_FLOOR_LEVELS
} from '@/lib/constants';
import type { CountryCode, TurkishCity } from '@/lib/locationData';

export type CargoType = typeof CARGO_TYPES[number];
export type VehicleNeeded = typeof VEHICLES_NEEDED[number]; // Used for Commercial
export type LoadingType = typeof LOADING_TYPES[number]; // Commercial
export type CargoForm = typeof CARGO_FORMS[number]; // Commercial
export type WeightUnit = typeof WEIGHT_UNITS[number]; // Commercial
export type ShipmentScope = typeof SHIPMENT_SCOPES[number]; // Commercial

export type FreightType = typeof FREIGHT_TYPES[number];
export type ResidentialTransportType = typeof RESIDENTIAL_TRANSPORT_TYPES[number];
export type ResidentialPlaceType = typeof RESIDENTIAL_PLACE_TYPES[number];
export type ResidentialElevatorStatus = typeof RESIDENTIAL_ELEVATOR_STATUSES[number];
export type ResidentialFloorLevel = typeof RESIDENTIAL_FLOOR_LEVELS[number];


// Base interface with common fields
interface BaseFreight {
  id: string;
  userId: string;
  
  // Genel Bilgiler (Common to both)
  companyName: string; 
  contactPerson: string; 
  contactEmail: string; 
  workPhone?: string; 
  mobilePhone: string; 
  
  // Yükleme ve Varış Bilgileri (Common to both)
  originCountry: CountryCode | string; 
  originCity: TurkishCity | string;    
  originDistrict?: string;   
  
  destinationCountry: CountryCode | string; 
  destinationCity: TurkishCity | string;     
  destinationDistrict?: string;    
  
  loadingDate: string; // YYYY-MM-DD
  
  // Meta data
  postedAt: string; // ISO date string
  postedBy: string; // Usually companyName
}

// Commercial Freight specific fields
export interface CommercialFreight extends BaseFreight {
  freightType: 'Ticari';
  
  // Yüke Ait Bilgiler (Commercial)
  cargoType: CargoType;
  vehicleNeeded: VehicleNeeded;
  loadingType: LoadingType;
  cargoForm: CargoForm;
  cargoWeight: number;
  cargoWeightUnit: WeightUnit;
  description: string; // Yükle İlgili Açıklama (Commercial specific)
  
  isContinuousLoad: boolean; // Sürekli (Proje) Yük (Commercial specific)
  shipmentScope: ShipmentScope; // 'Yurt İçi' or 'Yurt Dışı' (Commercial specific)
}

// Residential Freight specific fields
export interface ResidentialFreight extends BaseFreight {
  freightType: 'Evden Eve';

  // Taşımaya Ait Bilgiler (Residential)
  residentialTransportType: ResidentialTransportType; // Taşımacılık Türü
  residentialPlaceType: ResidentialPlaceType; // Nakliyesi Yapılacak Yer
  residentialElevatorStatus: ResidentialElevatorStatus; // Asansör Durumu
  residentialFloorLevel: ResidentialFloorLevel; // Eşyanın Bulunduğu Kat
  description: string; // Taşınma ile İlgili Açıklama (Residential specific)
}

export type Freight = CommercialFreight | ResidentialFreight;

export interface UserProfile {
  id: string;
  email: string; 
  name: string;  
}

// Keep VehicleType for potential compatibility if old code references it, 
// but new development should use VehicleNeeded for commercial.
export type VehicleType = typeof VEHICLES_NEEDED[number];
