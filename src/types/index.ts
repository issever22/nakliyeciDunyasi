
import type { VEHICLE_TYPES, SHIPMENT_SCOPES } from '@/lib/constants';

export type VehicleType = typeof VEHICLE_TYPES[number];
export type ShipmentScope = typeof SHIPMENT_SCOPES[number]; // New type for shipment scope

export interface Freight {
  id: string;
  origin: string;
  destination: string;
  vehicleType: VehicleType;
  shipmentScope: ShipmentScope; // Added field for shipment scope
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
