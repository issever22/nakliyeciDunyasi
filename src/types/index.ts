
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
  contactEmail: string; 
  workPhone?: string; 
  mobilePhone: string; 
  originCountry: CountryCode | string; 
  originCity: TurkishCity | string;    
  originDistrict?: string;   
  destinationCountry: CountryCode | string; 
  destinationCity: TurkishCity | string;     
  destinationDistrict?: string;    
  loadingDate: string; 
  postedAt: string; 
  postedBy: string; 
}

export interface CommercialFreight extends BaseFreight {
  freightType: 'Ticari';
  cargoType: CargoType;
  vehicleNeeded: VehicleNeeded;
  loadingType: LoadingType;
  cargoForm: CargoForm;
  cargoWeight: number;
  cargoWeightUnit: WeightUnit;
  description: string; 
  isContinuousLoad: boolean; 
  shipmentScope: ShipmentScope; 
}

export interface ResidentialFreight extends BaseFreight {
  freightType: 'Evden Eve';
  residentialTransportType: ResidentialTransportType; 
  residentialPlaceType: ResidentialPlaceType; 
  residentialElevatorStatus: ResidentialElevatorStatus; 
  residentialFloorLevel: ResidentialFloorLevel; 
  description: string; 
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
  name: string; // For individual: full name. For company: company title.
  isActive?: boolean; 
  createdAt?: Date; 
}

export interface IndividualUserProfile extends BaseUserProfile {
  role: 'individual';
}

export interface CompanyUserProfile extends BaseUserProfile {
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
  membershipStatus?: 'Yok' | 'Standart' | 'Premium' | string; 
  membershipEndDate?: Date; // Added for remaining membership days
}

export type UserProfile = IndividualUserProfile | CompanyUserProfile;

export type VehicleType = typeof VEHICLES_NEEDED[number];

export type SponsorEntityType = 'country' | 'city';

export interface Sponsor {
  id: string;
  name: string; 
  logoUrl?: string;
  linkUrl?: string; 
  entityType: SponsorEntityType; 
  entityName: string; 
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
}
