
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

      // Fetch rooms
      const { data: rooms, error } = await query;

      if (error) {
        throw error;
      }

      // Transform data to match our RoomWithAmenities type
      const transformedRooms: RoomWithAmenities[] = rooms.map((room) => {
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
  }
};

export default roomService;
