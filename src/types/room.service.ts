
import { Room, Amenity } from './room';

export interface RoomDetails extends Room {
  amenities: Amenity[];
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  booking_id?: string;
}

export interface RoomFilters {
  capacity?: number;
  location?: string;
  floor?: string;
  amenities?: string[];
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  status?: 'available' | 'maintenance' | 'inactive';
  date?: Date | null;
  startTime?: string;
  endTime?: string;
}

export interface AvailabilityCheckResult {
  is_available: boolean;
  conflicting_bookings?: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
  }[];
}
