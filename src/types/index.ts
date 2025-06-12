
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
  RESIDENTIAL_FLOOR_LEVELS,
  COMPANY_TYPES,
  WORKING_METHODS,
  WORKING_ROUTES
} from '@/lib/constants';
import type { CountryCode, TurkishCity } from '@/lib/locationData';

export type CargoType = typeof CARGO_TYPES[number];
export type VehicleNeeded = typeof VEHICLES_NEEDED[number]; 
export type LoadingType = typeof LOADING_TYPES[number]; 
export type CargoForm = typeof CARGO_FORMS[number]; 
export type WeightUnit = typeof WEIGHT_UNITS[number]; 
export type ShipmentScope = typeof SHIPMENT_SCOPES[number]; 

export type FreightType = typeof FREIGHT_TYPES[number];
export type ResidentialTransportType = typeof RESIDENTIAL_TRANSPORT_TYPES[number];
export type ResidentialPlaceType = typeof RESIDENTIAL_PLACE_TYPES[number];
export type ResidentialElevatorStatus = typeof RESIDENTIAL_ELEVATOR_STATUSES[number];
export type ResidentialFloorLevel = typeof RESIDENTIAL_FLOOR_LEVELS[number];

interface BaseFreight {
  id: string;
  userId: string;
  companyName: string; 
  contactPerson: string; 
  contactEmail?: string; // Optional made
  workPhone?: string; 
  mobilePhone: string; 
  originCountry: CountryCode | string; 
  originCity: TurkishCity | string;    
  originDistrict?: string;   
  destinationCountry: CountryCode | string; 
  destinationCity: TurkishCity | string;     
  destinationDistrict?: string;    
  loadingDate: string; // Should be string after conversion from Timestamp
  postedAt: string; // Should be string (ISO) after conversion from Timestamp
  postedBy: string; 
  isActive?: boolean;
  description: string; // Common field
}

export interface CommercialFreight extends BaseFreight {
  freightType: 'Ticari';
  cargoType: CargoType;
  vehicleNeeded: VehicleNeeded;
  loadingType: LoadingType;
  cargoForm: CargoForm;
  cargoWeight: number;
  cargoWeightUnit: WeightUnit;
  isContinuousLoad?: boolean; 
  shipmentScope: ShipmentScope; 
}

export interface ResidentialFreight extends BaseFreight {
  freightType: 'Evden Eve';
  residentialTransportType: ResidentialTransportType; 
  residentialPlaceType: ResidentialPlaceType; 
  residentialElevatorStatus: ResidentialElevatorStatus; 
  residentialFloorLevel: ResidentialFloorLevel; 
}

export type Freight = CommercialFreight | ResidentialFreight;

// User Profile Types
export type UserRole = 'individual' | 'company';
export type CompanyUserType = typeof COMPANY_TYPES[number]['value'];
export type WorkingMethodType = typeof WORKING_METHODS[number]['id'];
export type WorkingRouteType = typeof WORKING_ROUTES[number]['id'];

interface BaseUserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string; 
  isActive: boolean; // Non-optional, default to true on creation
  createdAt: string; // ISO string from Timestamp
}

export interface IndividualUserProfile extends BaseUserProfile {
  role: 'individual';
  // Individual specific fields can be added here if any
}

export interface CompanyUserProfile extends BaseUserProfile {
  role: 'company';
  username: string; 
  logoUrl?: string; 
  companyTitle: string; // Redundant if 'name' is companyTitle, but can keep for clarity
  contactFullName: string; 
  workPhone?: string;
  mobilePhone: string; 
  fax?: string;
  website?: string;
  companyDescription?: string;
  companyType: CompanyUserType;
  addressCity: TurkishCity | string;
  addressDistrict?: string;
  fullAddress: string;
  workingMethods: WorkingMethodType[];
  workingRoutes: WorkingRouteType[];
  preferredCities: (TurkishCity | string)[]; 
  preferredCountries: (CountryCode | string)[]; 
  membershipStatus?: 'Yok' | 'Standart' | 'Premium' | string; 
  membershipEndDate?: string; // ISO string from Timestamp
}

export type UserProfile = IndividualUserProfile | CompanyUserProfile;


// Types for Settings Pages
export interface VehicleTypeSetting {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export type RequiredFor = 'Bireysel' | 'Firma' | 'Her İkisi de';
export interface AuthDocSetting {
  id: string;
  name: string;
  requiredFor: RequiredFor;
  details?: string;
  isActive: boolean;
}

export type DurationUnit = 'Gün' | 'Ay' | 'Yıl';
export interface MembershipSetting {
  id: string;
  name: string;
  price: number;
  duration: number;
  durationUnit: DurationUnit;
  features: string[];
  isActive: boolean;
  description?: string;
}

export interface CargoTypeSetting {
  id: string;
  name: string;
  category?: string;
  isActive: boolean;
}

export type ApplicableTo = 'Ticari' | 'Evden Eve' | 'Her İkisi de';
export interface TransportTypeSetting {
  id: string;
  name: string;
  description?: string;
  applicableTo: ApplicableTo;
  isActive: boolean;
}

export type TargetAudience = 'Tümü' | 'Bireysel Kullanıcılar' | 'Firma Kullanıcıları';
export interface AnnouncementSetting {
  id: string;
  title: string;
  content: string;
  targetAudience: TargetAudience;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  isActive: boolean;
  createdAt: string; // ISO string
}

export type NoteCategory = 'Yönetici' | 'Kullanıcı Geri Bildirimi' | 'Geliştirme' | 'Genel';
export interface AdminNoteSetting {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  createdDate: string; // ISO string
  lastModifiedDate: string; // ISO string
  isImportant: boolean;
}

export type SponsorEntityType = 'country' | 'city';
export interface Sponsor {
  id: string;
  name: string; 
  logoUrl?: string;
  linkUrl?: string; 
  entityType: SponsorEntityType; 
  entityName: string; 
  startDate: string; // ISO string
  endDate?: string; // ISO string
  isActive: boolean;
  createdAt: string; // ISO string
}
