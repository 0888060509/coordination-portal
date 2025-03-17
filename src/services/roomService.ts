
import { supabase } from '@/integrations/supabase/client';
import { Room, RoomWithAmenities, Amenity } from '@/types/room';

// Get all rooms with optional filtering
export const getRooms = async ({ filterOptions } = {}) => {
  try {
    let query = supabase
      .from('rooms')
      .select(`
        *,
        amenities:room_amenities(
          amenity:amenities(*)
        )
      `);

    // Apply filters if provided
    if (filterOptions) {
      if (filterOptions.capacity) {
        query = query.gte('capacity', filterOptions.capacity);
      }
      
      if (filterOptions.location) {
        query = query.eq('location', filterOptions.location);
      }
      
      if (filterOptions.status === 'available') {
        query = query.eq('is_active', true);
      } else if (filterOptions.status === 'inactive') {
        query = query.eq('is_active', false);
      }
      
      // More filters can be added as needed
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }

    // Process the nested data to flatten the amenities
    const rooms = data.map((room) => {
      const amenities = room.amenities
        ? room.amenities
            .map((a) => a.amenity)
            .filter(Boolean)
        : [];
      
      return {
        ...room,
        amenities,
        status: room.is_active ? 'available' : 'inactive',
      };
    });

    return rooms;
  } catch (error) {
    console.error('Error in getRooms:', error);
    return [];
  }
};

// Get a single room by ID
export const getRoomById = async (roomId: string): Promise<Room | null> => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        amenities:room_amenities(
          amenity:amenities(*)
        )
      `)
      .eq('id', roomId)
      .single();

    if (error) {
      console.error('Error fetching room:', error);
      return null;
    }

    if (!data) return null;

    // Process the nested data to flatten the amenities
    const amenities = data.amenities
      ? data.amenities
          .map((a) => a.amenity)
          .filter(Boolean)
      : [];
    
    const room = {
      ...data,
      amenities,
      status: data.is_active ? 'available' : 'inactive',
    };

    return room;
  } catch (error) {
    console.error('Error in getRoomById:', error);
    return null;
  }
};

// Check room availability for a specific time range
export const getRoomAvailability = async (roomId: string, startDate: Date, endDate: Date) => {
  try {
    // Convert dates to ISO strings
    const startTimeISO = startDate.toISOString();
    const endTimeISO = endDate.toISOString();

    // Get all bookings for this room within the time range
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'confirmed')
      .or(`start_time.lte.${endTimeISO},end_time.gte.${startTimeISO}`);

    if (error) {
      console.error('Error checking room availability:', error);
      throw error;
    }

    // The room is available if there are no overlapping bookings
    return {
      available: bookings.length === 0,
      conflictingBookings: bookings.length > 0 ? bookings : []
    };
  } catch (error) {
    console.error('Error in getRoomAvailability:', error);
    return { available: false };
  }
};

// Get popular rooms based on booking frequency
export const getPopularRooms = async (limit = 5) => {
  try {
    // This would typically be a more complex query aggregating booking data
    // For now, we'll just return the first few rooms
    const rooms = await getRooms();
    return rooms.slice(0, limit);
  } catch (error) {
    console.error('Error in getPopularRooms:', error);
    return [];
  }
};

export default {
  getRooms,
  getRoomById,
  getRoomAvailability,
  getPopularRooms
};
