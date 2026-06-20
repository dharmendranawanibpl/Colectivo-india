export type CityId = string;

export interface GridNode {
  id: string;
  name: string;
  x: number; // percentage from left, 0 to 100
  y: number; // percentage from top, 0 to 100
}

export interface GridEdge {
  from: string;
  to: string;
  streetName: string;
}

export interface CityData {
  id: CityId;
  name: string;
  country: string;
  state: string;
  accentColor: string;
  center: { lat: number; lng: number };
  landmarks: Landmark[];
  nodes: GridNode[];
  edges: GridEdge[];
}

export interface Landmark {
  id: string;
  name: string;
  icon: string;
  x: number; // 0 to 100 grid
  y: number; // 0 to 100 grid
  description: string;
  lat?: number;
  lng?: number;
  address?: string;
}

export type RideStatus =
  | 'idle'
  | 'searching'
  | 'offered'
  | 'picking_up'
  | 'arrived'
  | 'in_transit'
  | 'completed'
  | 'cancelled';

export type VehicleTier = 'comfort' | 'comfortplus';

export interface VehicleConfig {
  id: VehicleTier;
  name: string;
  multiplier: number;
  capacity: number;
  etaBase: number; // base minutes
  iconName: string;
  description: string;
}

export interface Driver {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  status: 'offline' | 'idle' | 'going_to_pickup' | 'at_pickup' | 'carrying';
  vehicle: string;
  plate: string;
  x: number; // 0-100 map coordinates
  y: number; // 0-100 map coordinates
  earnings: number;
  tripsCount: number;
  speed: number;
  phone: string;
  activeRideId: string | null;
  path: GridNode[];
  pathProgress: number; // index parameter or step
  email?: string;
  password?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verificationReason?: string;
  licenseFile?: string;
  insuranceFile?: string;
  docValidity?: string;
  licenseExpiry?: string;
  insuranceExpiry?: string;
  tier?: VehicleTier;
  isBlocked?: boolean;
  walletBalance?: number;
  cityId?: string;
  dailyTripsCount?: number;
  lastTripDate?: string; // stored as YYYY-MM-DD
  idleStartedAt?: number; // timestamp when became idle
}

export interface Ride {
  id: string;
  cityId: CityId;
  pickup: Landmark;
  dropoff: Landmark;
  status: RideStatus;
  tier: VehicleTier;
  price: number;
  distance: number; // in miles/kms simulated
  originalDistance?: number; // original distance preserved for receipt calculations
  eta: number; // in minutes simulated
  driverId: string | null;
  createdAt: string;
  passengerRating: number | null;
  driverRating: number | null;
  messages: ChatMessage[];
  surgeMultiplier: number;
  isPaid: boolean;
  otp?: string;
  // Queue & Priority properties
  queueState?: 'priority' | 'broadcast';
  priorityDriverId?: string | null;
  priorityCountdown?: number; // 5 to 0 seconds
  queueZoneKm?: number; // e.g. 1 if within 1km, 2 if within 2km...
  queueDrivers?: { driverId: string; name: string; distance: number; idx: number }[];
}

export interface ChatMessage {
  id: string;
  sender: 'passenger' | 'driver';
  text: string;
  timestamp: string;
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'payment' | 'earnings';
  amount: number;
  description: string;
  timestamp: string;
}

export interface PromoCode {
  code: string;
  discount: number; // percentage e.g. 20 (for 20%) or flat amount
  description: string;
}

export interface SavedPlace {
  id: string;
  label: 'Home' | 'Work' | 'Gym' | 'Partner' | 'Favorite';
  landmarkId: string;
}

export type TrafficLevel = 'light' | 'moderate' | 'heavy';

export interface SimulationState {
  currentCity: CityId;
  weather: 'sunny' | 'rainy' | 'night';
  trafficLevel: TrafficLevel;
  surgeMultiplier: number;
  passengerWallet: number;
  promoCodeApplied: PromoCode | null;
  pastRides: Ride[];
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  weather: 'sunny' | 'rainy' | 'night';
  trafficLevel: TrafficLevel;
  surgeMultiplier: number;
  iconName: string;
}

export interface PastTrip {
  id: string;
  cityId: CityId;
  pickupName: string;
  dropoffName: string;
  driverName: string;
  driverAvatar: string;
  vehicleName: string;
  price: number;
  distance: number;
  tierName: string;
  timestamp: string;
  rating: number | null;
}

export interface Rider {
  id: string;
  name: string;
  email: string;
  password?: string;
  walletBalance: number;
  isBlocked?: boolean;
}


