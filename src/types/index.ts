

import type {
  CARGO_TYPES,
  VEHICLES_NEEDED,
  LOADING_TYPES,
  CARGO_FORMS,
  WEIGHT_UNITS,
  SHIPMENT_SCOPES,
  FREIGHT_TYPES,
  RESIDENTIAL_PLACE_TYPES,
  RESIDENTIAL_ELEVATOR_STATUSES,
  RESIDENTIAL_FLOOR_LEVELS,
  COMPANY_TYPES,
  WORKING_METHODS,
  WORKING_ROUTES,
  EMPTY_VEHICLE_SERVICE_TYPES,
  COMPANY_CATEGORIES,
} from '@/lib/constants';
import type { CountryCode, TurkishCity } from '@/lib/locationData';

export type CargoType = typeof CARGO_TYPES[number];
export type VehicleNeeded = typeof VEHICLES_NEEDED[number];
export type LoadingType = typeof LOADING_TYPES[number];
export type CargoForm = typeof CARGO_FORMS[number];
export type WeightUnit = typeof WEIGHT_UNITS[number];
export type ShipmentScope = typeof SHIPMENT_SCOPES[number];

export type FreightType = typeof FREIGHT_TYPES[number];
export type ResidentialTransportType = string;
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

  loadingDate: string; 
  postedAt: string; 
  isActive: boolean;
  description: string;
}

export interface CommercialFreight extends BaseFreight {
  freightType: 'Yük';
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


export type UserRole = 'company'; 
export type CompanyUserType = typeof COMPANY_TYPES[number]['value'];
export type CompanyCategory = typeof COMPANY_CATEGORIES[number]['value'];
export type CompanyCategoryDetail = typeof COMPANY_CATEGORIES[number];

export type WorkingMethodType = typeof WORKING_METHODS[number]['id'];
export type WorkingRouteType = typeof WORKING_ROUTES[number]['id'];
export type MembershipStatus = 'Yok' | 'Standart' | 'Premium';

export interface SponsorshipLocation {
  type: 'country' | 'city';
  name: string; // Country code or City name
}

interface BaseUserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string; 
  isActive: boolean; 
  createdAt: string; 
}

export interface CompanyUserProfile extends BaseUserProfile {
  role: 'company';
  password: string; 
  username: string;
  logoUrl?: string;
  companyTitle: string; 
  category: CompanyCategory;
  contactFullName: string;
  workPhone?: string;
  mobilePhone: string;
  fax?: string;
  website?: string;
  companyDescription?: string;
  companyType: CompanyUserType;
  addressCountry: CountryCode | string;
  addressCity: TurkishCity | string;
  addressDistrict?: string;
  fullAddress: string;
  workingMethods: WorkingMethodType[];
  workingRoutes: WorkingRouteType[];
  preferredCities: (TurkishCity | string)[];
  preferredCountries: (CountryCode | string)[];
  membershipStatus?: MembershipStatus;
  membershipEndDate?: string; 
  ownedVehicles: string[];
  authDocuments: string[];
  sponsorships?: SponsorshipLocation[];
}

export type UserProfile = CompanyUserProfile; 

interface BaseRegisterData {
  email: string;
  password?: string; 
  name: string; 
  role: UserRole;
}
export interface CompanyRegisterData extends BaseRegisterData {
  role: 'company';
  password: string; 
  username: string;
  category: CompanyCategory;
  logoUrl?: string;
  contactFullName: string;
  workPhone?: string;
  mobilePhone: string;
  fax?: string;
  website?: string;
  companyDescription?: string;
  companyType: CompanyUserType;
  addressCountry: CountryCode | string;
  addressCity: TurkishCity | string;
  addressDistrict?: string;
  fullAddress: string;
  workingMethods: WorkingMethodType[];
  workingRoutes: WorkingRouteType[];
  preferredCities: (TurkishCity | string)[];
  preferredCountries: (CountryCode | string)[];
  isActive?: boolean; 
}

export type RegisterData = CompanyRegisterData; 


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
  startDate?: string; 
  endDate?: string; 
  isActive: boolean;
  createdAt: string; 
}

export interface CompanyNote {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO string
  author?: string; // Name of admin who wrote it
  type?: 'note' | 'payment';
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  createdAt: string; // ISO string
  isRead: boolean;
}

export interface MembershipRequest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  details: string;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  createdAt: string; // ISO string
  userId?: string; // Link to existing user if available
}

export type FreightFilterOptions = {
  originCity?: string;
  destinationCity?: string;
  vehicleNeeded?: VehicleNeeded;
  shipmentScope?: ShipmentScope;
  freightType?: FreightType;
  sortBy?: 'newest' | 'oldest';
  postedToday?: boolean;
  isContinuousLoad?: boolean;
};

export type CompanyFilterOptions = {
    searchTerm: string;
    category: string;
    city: string;
    country?: string;
};


// HERO SLIDER TYPES
export type HeroSlideType = 'centered' | 'left-aligned' | 'with-input' | 'split' | 'title-only' | 'video-background';

export interface BaseHeroSlide {
  id: string;
  type: HeroSlideType;
  title: string;
  subtitle?: string;
  isActive: boolean;
  order: number;
  createdAt: string; // ISO string
}

export interface CenteredHeroSlide extends BaseHeroSlide {
  type: 'centered';
  backgroundImageUrl: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonIcon?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonShape?: 'default' | 'rounded';
  textColor?: string;
  overlayOpacity?: number;
}

export interface LeftAlignedHeroSlide extends BaseHeroSlide {
  type: 'left-aligned';
  backgroundImageUrl: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonIcon?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonShape?: 'default' | 'rounded';
  textColor?: string;
  overlayOpacity?: number;
}

export interface WithInputHeroSlide extends BaseHeroSlide {
    type: 'with-input';
    backgroundImageUrl: string;
    inputPlaceholder?: string;
    buttonText: string;
    buttonColor?: string;
    buttonTextColor?: string;
    buttonShape?: 'default' | 'rounded';
    formActionUrl: string;
    buttonIcon?: string;
    textColor?: string;
    overlayOpacity?: number;
}

export interface SplitHeroSlide extends BaseHeroSlide {
    type: 'split';
    mediaType: 'image' | 'video';
    mediaUrl: string;
    buttonText?: string;
    buttonUrl?: string;
    buttonIcon?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    buttonShape?: 'default' | 'rounded';
    backgroundColor?: string;
    backgroundImageUrl?: string;
    textColor?: string;
    overlayOpacity?: number;
}

export interface TitleOnlyHeroSlide extends BaseHeroSlide {
    type: 'title-only';
    backgroundImageUrl: string;
    textColor?: string;
    overlayOpacity?: number;
}

export interface VideoBackgroundHeroSlide extends BaseHeroSlide {
    type: 'video-background';
    videoUrl: string;
    buttonText?: string;
    buttonUrl?: string;
    buttonIcon?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    buttonShape?: 'default' | 'rounded';
    textColor?: string;
    overlayOpacity?: number;
}

export type HeroSlide = 
  | CenteredHeroSlide
  | LeftAlignedHeroSlide
  | WithInputHeroSlide
  | SplitHeroSlide
  | TitleOnlyHeroSlide
  | VideoBackgroundHeroSlide;

export type HeroSlideCreationData = Omit<HeroSlide, 'id' | 'createdAt'>;
export type HeroSlideUpdateData = Partial<Omit<HeroSlide, 'id'>>;
