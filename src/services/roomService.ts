
import { supabase } from '@/integrations/supabase/client';
import { Room, RoomWithAmenities, RoomFilterOptions } from '@/types';

// Get a single room by ID
export const getRoom = async (roomId: string): Promise<Room | null> => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      console.error('Error fetching room:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching room:', error);
    return null;
  }
};

// Get a room with amenities
export const getRoomWithAmenities = async (roomId: string): Promise<RoomWithAmenities | null> => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        amenities:room_amenities!inner(
          amenity:amenities(*)
        )
      `)
      .eq('id', roomId)
      .single();

    if (error) {
      console.error('Error fetching room with amenities:', error);
      return null;
    }

    if (!data) return null;

    // Transform the data structure
    const amenities = data.amenities?.map((item: any) => item.amenity) || [];

    return {
      ...data,
      amenities,
      status: data.status || 'available'
    };
  } catch (error) {
    console.error('Error fetching room with amenities:', error);
    return null;
  }
};

// Get all rooms with filtering options
export const getRooms = async (filters?: RoomFilterOptions): Promise<Room[]> => {
  try {
    let query = supabase
      .from('rooms')
      .select('*');

    // Apply filters if provided
    if (filters) {
      if (filters.capacity) {
        query = query.gte('capacity', filters.capacity);
      }
      
      if (filters.location) {
        query = query.eq('location', filters.location);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
};

// Get room availability for a specific date range
export const getRoomAvailability = async (
  roomId: string,
  startDate: Date,
  endDate: Date
): Promise<{ available: boolean; conflictingBookings?: any[] }> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'confirmed')
      .or(`start_time.lt.${endDate.toISOString()},end_time.gt.${startDate.toISOString()}`);

    if (error) {
      console.error('Error checking room availability:', error);
      return { available: false };
    }

    return {
      available: data.length === 0,
      conflictingBookings: data.length > 0 ? data : undefined
    };
  } catch (error) {
    console.error('Error checking room availability:', error);
    return { available: false };
  }
};

// Export functions
export {
  getRoom as getRoomById,
  getRoomWithAmenities,
  getRooms,
  getRoomAvailability
};
