
import { Room } from './room';
import { Database } from './supabase';

export type Booking = Database['public']['Tables']['bookings']['Row'];

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  department: string | null;
  position: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Omit<Booking, 'rooms' | 'profiles'> {
  room: Room;
  user: UserProfile;
}

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
  recurring_pattern_id?: string;
}

export interface RecurringPattern {
  id: string;
  user_id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  days_of_week?: number[];
  start_date: string;
  end_date?: string;
  max_occurrences?: number;
  created_at: string;
}
