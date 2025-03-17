
import { Database } from './supabase';

export type Room = Database['public']['Tables']['rooms']['Row'];
export type Amenity = Database['public']['Tables']['amenities']['Row'];
export type RoomAmenity = Database['public']['Tables']['room_amenities']['Row'];

export interface RoomWithAmenities extends Room {
  amenities: Amenity[];
}

// Additional types for room filtering and availability
export interface RoomAvailability {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface RoomFilter {
  capacity?: number;
  location?: string; 
  amenities?: string[];
  date?: Date;
  startTime?: string;
  endTime?: string;
  searchQuery?: string;
}
