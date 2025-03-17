
import { Database } from './supabase';

export type Room = Database['public']['Tables']['rooms']['Row'];
export type Amenity = Database['public']['Tables']['amenities']['Row'];
export type RoomAmenity = Database['public']['Tables']['room_amenities']['Row'];

export interface RoomWithAmenities extends Room {
  amenities: Amenity[];
}
