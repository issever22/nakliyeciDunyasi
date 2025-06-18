
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
  WORKING_ROUTES,
  EMPTY_VEHICLE_SERVICE_TYPES
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
export type EmptyVehicleServiceType = typeof EMPTY_VEHICLE_SERVICE_TYPES[number];


interface BaseFreight {
  id: string;
  userId: string;
  postedBy: string;
  companyName: string;
  contactPerson: string;
  contactEmail?: string;
  workPhone?: string;
  mobilePhone: string;

  originCountry: CountryCode | string;
  originCity: TurkishCity | string;
  originDistrict?: string;

  destinationCountry: CountryCode | string;
  destinationCity: TurkishCity | string;
  destinationDistrict?: string;

  loadingDate: string; // ISO Date string
  postedAt: string; // ISO Date string
  isActive: boolean;
  description: string;
}

export interface CommercialFreight extends BaseFreight {
  freightType: 'Yük'; // Changed from 'Ticari'
  cargoType: CargoType;
  vehicleNeeded: VehicleNeeded;
  loadingType: LoadingType;
  cargoForm: CargoForm;
  cargoWeight: number;
  cargoWeightUnit: WeightUnit;
  isContinuousLoad: boolean;
  shipmentScope: ShipmentScope;
}

export interface ResidentialFreight extends BaseFreight {
  freightType: 'Evden Eve';
  residentialTransportType: ResidentialTransportType;
  residentialPlaceType: ResidentialPlaceType;
  residentialElevatorStatus: ResidentialElevatorStatus;
  residentialFloorLevel: ResidentialFloorLevel;
}

export interface EmptyVehicleListing extends BaseFreight {
  freightType: 'Boş Araç';
  advertisedVehicleType?: string;
  serviceTypeForLoad?: EmptyVehicleServiceType;
  vehicleStatedCapacity?: number;
  vehicleStatedCapacityUnit?: WeightUnit;
}

export type Freight = CommercialFreight | ResidentialFreight | EmptyVehicleListing;

export type FreightCreationData =
  | Omit<CommercialFreight, 'id' | 'postedAt' | 'userId'>
  | Omit<ResidentialFreight, 'id' | 'postedAt' | 'userId'>
  | Omit<EmptyVehicleListing, 'id' | 'postedAt' | 'userId'>;

export type FreightUpdateData = Partial<FreightCreationData>;


export type UserRole = 'individual' | 'company';
export type CompanyUserType = typeof COMPANY_TYPES[number]['value'];
export type WorkingMethodType = typeof WORKING_METHODS[number]['id'];
export type WorkingRouteType = typeof WORKING_ROUTES[number]['id'];

interface BaseUserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  isActive: boolean;
  createdAt: string; // ISO Date string
}

export interface IndividualUserProfile extends BaseUserProfile {
  role: 'individual';
}

export interface CompanyUserProfile extends BaseUserProfile {
  role: 'company';
  username: string;
  logoUrl?: string;
  companyTitle: string;
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
  membershipEndDate?: string; // ISO Date string
  ownedVehicles: string[];
  authDocuments: string[];
}

export type UserProfile = IndividualUserProfile | CompanyUserProfile;

interface BaseRegisterData {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
}

export interface IndividualRegisterData extends BaseRegisterData {
  role: 'individual';
}

export interface CompanyRegisterData extends BaseRegisterData {
  role: 'company';
  username: string;
  logoUrl?: string;
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
}

export type RegisterData = IndividualRegisterData | CompanyRegisterData;


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
  startDate?: string; // ISO Date string
  endDate?: string; // ISO Date string
  isActive: boolean;
  createdAt: string; // ISO Date string
}

export type NoteCategory = 'Yönetici' | 'Kullanıcı Geri Bildirimi' | 'Geliştirme' | 'Genel';
export interface AdminNoteSetting {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  createdDate: string; // ISO Date string
  lastModifiedDate: string; // ISO Date string
  isImportant: boolean;
}

export type SponsorEntityType = 'country' | 'city';
export interface Sponsor {
  id: string;
  name: string;
  logoUrl?: string;
  linkUrl?: string;
  entityType: SponsorEntityType;
  entityName: string; // Could be CountryCode or TurkishCity or string
  startDate: string; // ISO Date string
  endDate?: string; // ISO Date string
  isActive: boolean;
  createdAt: string; // ISO Date string
}

export type FreightFilterOptions = {
  originCity?: string;
  destinationCity?: string;
  vehicleNeeded?: VehicleNeeded;
  shipmentScope?: ShipmentScope;
  freightType?: FreightType;
  sortBy?: 'newest' | 'oldest';
};

// New Type for Transport Offers
export interface TransportOffer {
  id: string;
  userId: string;
  companyName: string; // Name of the company providing the offer
  postedAt: string; // ISO Date string when the offer was created/updated
  isActive: boolean;

  originCountry: CountryCode | string;
  originCity: TurkishCity | string;
  originDistrict?: string;

  destinationCountry: CountryCode | string;
  destinationCity: TurkishCity | string;
  destinationDistrict?: string;

  vehicleType: string; // Name of the vehicle type from settingsVehicleTypes
  distanceKm: number;

  priceTRY?: number;
  priceUSD?: number;
  priceEUR?: number;
  notes?: string; // Optional notes for the offer
}

export type TransportOfferCreationData = Omit<TransportOffer, 'id' | 'postedAt' | 'userId' | 'companyName'>;
export type TransportOfferUpdateData = Partial<TransportOfferCreationData>;

