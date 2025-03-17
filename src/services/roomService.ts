import { supabase } from "@/integrations/supabase/client";
import { RoomWithAmenities, Amenity, RoomFilterOptions } from "@/types/index";
import { toast } from "@/hooks/use-toast";

export const roomService = {
  // Get all rooms with optional filtering
  async getRooms(filters?: RoomFilterOptions): Promise<RoomWithAmenities[]> {
    try {
      let query = supabase
        .from("rooms")
        .select(
          `*,
          room_amenities!inner(
            amenities(*)
          )`
        )
        .eq("is_active", true);

      // Apply filters
      if (filters?.capacity) {
        query = query.gte("capacity", filters.capacity);
      }

      if (filters?.location) {
        query = query.ilike("location", `%${filters.location}%`);
      }

      if (filters?.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      
      // Apply amenity filters if provided
      if (filters?.amenities && filters.amenities.length > 0) {
        // We'll handle amenity filtering after we get the results
        // since supabase's nested arrays are challenging to filter
      }

      // Fetch rooms
      const { data: rooms, error } = await query;

      if (error) {
        throw error;
      }

      // Transform data to match our RoomWithAmenities type
      let transformedRooms: RoomWithAmenities[] = rooms.map((room) => {
        const amenities = room.room_amenities.map(
          (ra: any) => ra.amenities
        );

        const transformedRoom: RoomWithAmenities = {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          location: room.location,
          floor: room.floor,
          room_number: room.room_number,
          description: room.description,
          image_url: room.image_url,
          is_active: room.is_active,
          created_at: room.created_at,
          updated_at: room.updated_at,
          status: room.status || 'available',
          amenities: amenities,
        };

        return transformedRoom;
      });
      
      // Manual filtering for amenities
      if (filters?.amenities && filters.amenities.length > 0) {
        transformedRooms = transformedRooms.filter(room => {
          // Check if the room has all the requested amenities
          return filters.amenities!.every(amenityId => 
            room.amenities.some(amenity => amenity.id === amenityId)
          );
        });
      }

      // If date and time filters are provided, check availability
      if (
        filters?.date &&
        filters?.startTime &&
        filters?.endTime
      ) {
        const date = filters.date;
        const startDateTime = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          parseInt(filters.startTime.split(":")[0]),
          parseInt(filters.startTime.split(":")[1])
        );
        const endDateTime = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          parseInt(filters.endTime.split(":")[0]),
          parseInt(filters.endTime.split(":")[1])
        );

        // Check availability for each room using try-catch to handle missing function
        const availabilityChecks = await Promise.all(
          transformedRooms.map(async (room) => {
            try {
              const { data, error } = await supabase.rpc(
                "check_room_availability",
                {
                  room_id: room.id,
                  start_time: startDateTime.toISOString(),
                  end_time: endDateTime.toISOString(),
                }
              );

              if (error) {
                console.error("Error checking room availability:", error);
                // If the function doesn't exist, assume all rooms are available
                if (error.code === "PGRST202") {
                  return { ...room, isAvailable: true };
                }
                return { ...room, isAvailable: false };
              }

              return { ...room, isAvailable: data };
            } catch (err) {
              console.error("Error checking room availability:", err);
              // If any error occurs, assume the room is available to avoid blocking the UI
              return { ...room, isAvailable: true };
            }
          })
        );

        // Filter out unavailable rooms
        return availabilityChecks.filter((room) => room.isAvailable);
      }

      return transformedRooms;
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast({
        variant: "destructive",
        title: "Error loading rooms",
        description: "Could not load room data. Please try again later.",
      });
      return [];
    }
  },

  // Get a single room by ID
  async getRoomById(roomId: string): Promise<RoomWithAmenities | null> {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select(
          `*,
          room_amenities!inner(
            amenities(*)
          )`
        )
        .eq("id", roomId)
        .single();

      if (error) {
        throw error;
      }

      // Transform data to match our RoomWithAmenities type
      const amenities = data.room_amenities.map((ra: any) => ra.amenities);

      return {
        id: data.id,
        name: data.name,
        capacity: data.capacity,
        location: data.location,
        floor: data.floor,
        room_number: data.room_number,
        description: data.description,
        image_url: data.image_url,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
        status: data.status || 'available',
        amenities: amenities,
      };
    } catch (error) {
      console.error("Error fetching room details:", error);
      toast({
        variant: "destructive",
        title: "Error loading room",
        description: "Could not load room details. Please try again later.",
      });
      return null;
    }
  },

  // Check room availability for a specific time
  async checkRoomAvailability(
    roomId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("check_room_availability", {
        room_id: roomId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });

      if (error) {
        // If the function doesn't exist, assume the room is available
        if (error.code === "PGRST202") {
          console.warn("Room availability check function not found, assuming available");
          return true;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error checking room availability:", error);
      // If any error occurs, assume the room is available to prevent blocking the user
      return true;
    }
  },

  // Get all amenities
  async getAmenities(): Promise<Amenity[]> {
    try {
      const { data, error } = await supabase
        .from("amenities")
        .select("*")
        .order("name");

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching amenities:", error);
      toast({
        variant: "destructive",
        title: "Error loading amenities",
        description: "Could not load amenities data. Please try again later.",
      });
      return [];
    }
  },

  // Get room amenities by room ID
  async getRoomAmenities(roomId: string): Promise<Amenity[]> {
    try {
      const { data, error } = await supabase
        .from("room_amenities")
        .select(`
          amenities(*)
        `)
        .eq("room_id", roomId);

      if (error) {
        throw error;
      }

      // Extract and transform the amenities from the nested structure
      const amenities: Amenity[] = data.map(item => {
        // Ensure we're properly casting the amenity object, not treating it as an array
        const amenity = item.amenities as unknown;
        return amenity as Amenity;
      });
      
      return amenities || [];
    } catch (error) {
      console.error("Error fetching room amenities:", error);
      toast({
        variant: "destructive",
        title: "Error loading amenities",
        description: "Could not load room amenities. Please try again later.",
      });
      return [];
    }
  },

  // Get all unique locations
  async getLocations(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("location")
        .eq("is_active", true)
        .order("location");

      if (error) {
        throw error;
      }

      // Extract unique locations
      const locations = [...new Set(data.map(room => room.location))];
      return locations;
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast({
        variant: "destructive",
        title: "Error loading locations",
        description: "Could not load location data. Please try again later.",
      });
      return [];
    }
  },

  // Get room availability for a date range
  async getRoomAvailability(
    roomId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    bookings: {
      id: string;
      start_time: Date | string;
      end_time: Date | string;
      title: string;
    }[];
    is_available: boolean;
  }> {
    try {
      // Fetch bookings for this room in the specified date range
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("id, start_time, end_time, title")
        .eq("room_id", roomId)
        .eq("status", "confirmed") // Only consider confirmed bookings
        .gte("start_time", startDate.toISOString())
        .lte("end_time", endDate.toISOString());

      if (error) {
        throw error;
      }

      // Check if room is generally available (not under maintenance, etc.)
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("status")
        .eq("id", roomId)
        .single();

      if (roomError) {
        throw roomError;
      }

      return {
        bookings: bookings || [],
        is_available: room.status === 'available'
      };
    } catch (error) {
      console.error("Error fetching room availability:", error);
      toast({
        variant: "destructive",
        title: "Error loading availability",
        description: "Could not load room availability. Please try again later.",
      });
      return { bookings: [], is_available: false };
    }
  },
  
  // Get floor plans for a room
  async getRoomFloorPlan(roomId: string): Promise<string | null> {
    try {
      // This function assumes there's a column for floor plan images
      // If there isn't one, you'd need to add it to the database
      const { data, error } = await supabase
        .from("rooms")
        .select("floor_plan_url")
        .eq("id", roomId)
        .single();

      if (error) {
        throw error;
      }

      return data?.floor_plan_url || null;
    } catch (error) {
      console.error("Error fetching room floor plan:", error);
      return null;
    }
  },
  
  // Get additional room images
  async getRoomImages(roomId: string): Promise<string[]> {
    try {
      // This would assume there's a room_images table
      // If there isn't one, you'd need to add it to the database
      const { data, error } = await supabase
        .from("room_images")
        .select("image_url")
        .eq("room_id", roomId);

      if (error) {
        throw error;
      }

      return data?.map(img => img.image_url) || [];
    } catch (error) {
      console.error("Error fetching room images:", error);
      return [];
    }
  }
};

export default roomService;
