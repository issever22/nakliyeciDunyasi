import type { VEHICLE_TYPES } from '@/lib/constants';

export type VehicleType = typeof VEHICLE_TYPES[number];

export interface Freight {
  id: string;
  origin: string;
  destination: string;
  vehicleType: VehicleType;
  details: string;
  postedAt: string; // ISO date string
  postedBy: string; // User's name or company name
  userId: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  // Add other relevant user profile fields here, e.g. companyName, phone
}
