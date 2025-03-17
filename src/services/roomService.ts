
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { Room, RoomWithAmenities, Amenity } from '@/types/room';

export interface RoomFilterOptions {
  capacity?: number;
  location?: string;
  amenities?: string[];
  date?: Date;
  startTime?: string;
  endTime?: string;
  searchQuery?: string;
}

export const roomService = {
  // Get all rooms with optional filtering
  async getRooms(filters?: RoomFilterOptions): Promise<RoomWithAmenities[]> {
    try {
      console.log("Fetching rooms with filters:", filters);
      
      let query = supabase
        .from('rooms')
        .select(`
          *,
          room_amenities (
            amenity_id,
            amenities (*)
          )
        `)
        .eq('is_active', true);

      // Apply filters if provided
      if (filters) {
        // Filter by capacity
        if (filters.capacity) {
          query = query.gte('capacity', filters.capacity);
        }

        // Filter by location
        if (filters.location && filters.location !== '_all') {
          query = query.eq('location', filters.location);
        }

        // Filter by search query
        if (filters.searchQuery) {
          query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching rooms from Supabase:", error);
        throw error;
      }

      console.log("Rooms data from Supabase:", data);

      // Process the data to match our RoomWithAmenities type
      let rooms = data.map(room => {
        // Extract amenities from the nested structure
        const amenities = room.room_amenities 
          ? room.room_amenities.map((ra: any) => ra.amenities).filter(Boolean)
          : [];
        
        return {
          ...room,
          amenities,
          room_amenities: undefined // Remove the nested structure
        } as unknown as RoomWithAmenities;
      });

      console.log("Processed rooms data:", rooms);

      // Post-process for amenity filtering
      if (filters?.amenities && filters.amenities.length > 0) {
        rooms = rooms.filter(room => {
          const roomAmenityIds = room.amenities.map(a => a.id);
          return filters.amenities!.every(id => roomAmenityIds.includes(id));
        });
      }

      // If date and time filters are provided, check availability
      if (filters?.date && filters?.startTime && filters?.endTime) {
        const startDate = new Date(filters.date);
        const endDate = new Date(filters.date);
        
        // Parse time strings (assuming format like "09:00")
        const [startHours, startMinutes] = filters.startTime.split(':').map(Number);
        const [endHours, endMinutes] = filters.endTime.split(':').map(Number);
        
        startDate.setHours(startHours, startMinutes, 0, 0);
        endDate.setHours(endHours, endMinutes, 0, 0);
        
        // Convert to ISO strings for the database
        const startTimeIso = startDate.toISOString();
        const endTimeIso = endDate.toISOString();
        
        console.log("Checking availability for timeframe:", {
          startTimeIso,
          endTimeIso
        });
        
        // Filter out rooms that are not available during the requested time
        const availableRooms = await Promise.all(
          rooms.map(async (room) => {
            try {
              const { data: isAvailable, error } = await supabase
                .rpc('check_room_availability', {
                  room_id: room.id,
                  start_time: startTimeIso,
                  end_time: endTimeIso
                });
              
              if (error) {
                console.error('Error checking room availability:', error);
                return null;
              }
              
              console.log(`Room ${room.id} availability:`, isAvailable);
              return isAvailable ? room : null;
            } catch (err) {
              console.error(`Error in availability check for room ${room.id}:`, err);
              return null;
            }
          })
        );
        
        // Filter out nulls and return available rooms
        rooms = availableRooms.filter(room => room !== null) as RoomWithAmenities[];
      }

      return rooms;
    } catch (error) {
      console.error('Error in getRooms:', error);
      throw error;
    }
  },

  // Get a single room by ID
  async getRoomById(id: string): Promise<RoomWithAmenities | null> {
    try {
      console.log("Fetching room by ID:", id);
      
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_amenities (
            amenity_id,
            amenities (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching room by ID:", error);
        throw error;
      }

      if (!data) {
        console.log("No room found with ID:", id);
        return null;
      }

      console.log("Room data from Supabase:", data);

      // Process the data to match our RoomWithAmenities type
      const amenities = data.room_amenities 
        ? data.room_amenities.map((ra: any) => ra.amenities).filter(Boolean)
        : [];
      
      const room = {
        ...data,
        amenities,
        room_amenities: undefined // Remove the nested structure
      } as unknown as RoomWithAmenities;

      console.log("Processed room data:", room);
      
      return room;
    } catch (error) {
      console.error('Error in getRoomById:', error);
      throw error;
    }
  },

  // Get all available amenities
  async getAmenities(): Promise<Amenity[]> {
    try {
      console.log("Fetching amenities");
      
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .order('name');

      if (error) {
        console.error("Error fetching amenities:", error);
        throw error;
      }

      console.log("Amenities data from Supabase:", data);
      
      return data as Amenity[];
    } catch (error) {
      console.error('Error in getAmenities:', error);
      throw error;
    }
  },

  // Get all unique locations for filtering
  async getLocations(): Promise<string[]> {
    try {
      console.log("Fetching locations");
      
      const { data, error } = await supabase
        .from('rooms')
        .select('location')
        .eq('is_active', true)
        .order('location');

      if (error) {
        console.error("Error fetching locations:", error);
        throw error;
      }

      console.log("Locations data from Supabase:", data);
      
      // Extract unique locations
      const locations = [...new Set(data.map(room => room.location))];
      console.log("Processed locations:", locations);
      
      return locations;
    } catch (error) {
      console.error('Error in getLocations:', error);
      throw error;
    }
  },

  // Check if a room is available for a specific time period
  async checkRoomAvailability(
    roomId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    try {
      console.log("Checking room availability:", {
        roomId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        excludeBookingId
      });
      
      const { data, error } = await supabase.rpc('check_room_availability', {
        room_id: roomId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        exclude_booking_id: excludeBookingId || null
      });

      if (error) {
        console.error("Error checking room availability:", error);
        throw error;
      }

      console.log("Room availability result:", data);
      
      return !!data;
    } catch (error) {
      console.error('Error in checkRoomAvailability:', error);
      throw error;
    }
  }
};
