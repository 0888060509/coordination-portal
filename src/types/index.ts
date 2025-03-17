
import { Database } from './supabase';

// Basic database types from schema
export type Room = Database['public']['Tables']['rooms']['Row'];
export type Amenity = Database['public']['Tables']['amenities']['Row'];
export type RoomAmenity = Database['public']['Tables']['room_amenities']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type RecurringPattern = Database['public']['Tables']['recurring_patterns']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

// Room status enum
export type RoomStatus = 'available' | 'maintenance' | 'inactive';

// Booking status enum
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

// Notification type enum
export type NotificationType = 'confirmation' | 'reminder' | 'update' | 'cancellation';

// Frequency type enum
export type FrequencyType = 'daily' | 'weekly' | 'monthly';

// Extended types for UI components
export interface RoomWithAmenities extends Room {
  amenities: Amenity[];
  status: RoomStatus; // Add status field explicitly
}

export interface BookingWithDetails extends Omit<Booking, 'room' | 'user'> {
  room: Room;
  user: Profile;
}

// Filter options for room listings
export interface RoomFilterOptions {
  capacity?: number;
  location?: string;
  date?: Date;
  startTime?: string;
  endTime?: string;
  amenities?: string[];
  searchQuery?: string;
  status?: RoomStatus;
  sortBy?: 'name' | 'capacity' | 'capacity_asc'; // Add sortBy property for sorting
}

// Data for creating a new booking
export interface CreateBookingData {
  room_id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  attendees?: string[];
  meeting_type?: string;
  equipment_needed?: string[];
  special_requests?: string;
}

// Data for creating a recurring pattern
export interface CreateRecurringPatternData {
  user_id: string;
  frequency: FrequencyType;
  interval?: number;
  days_of_week?: number[];
  start_date: Date;
  end_date?: Date;
  max_occurrences?: number;
}

// Data for creating a notification
export interface CreateNotificationData {
  user_id: string;
  booking_id: string;
  type: NotificationType;
  message: string;
}

// Extended user type with profile data
export interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  profile: Profile;
}
