import { ApiService } from './apiService';
import { supabase } from '../lib/supabase';
import { Room, Amenity } from '../types/room';
import { RoomDetails, TimeSlot, RoomFilters, AvailabilityCheckResult } from '../types/room.service';
import { ApiError } from '../utils/errors';

export class RoomService extends ApiService {
  /**
   * Get all rooms with optional filtering
   */
  async getAllRooms(filters?: RoomFilters): Promise<RoomWithAmenities[]> {
    let query = supabase
      .from('rooms')
      .select(`
        *,
        amenities:room_amenities(
          amenity:amenities(*)
        )
      `);
    
    // Apply filters if provided
    if (filters) {
      if (filters.capacity && filters.capacity > 0) {
        query = query.gte('capacity', filters.capacity);
      }
      
      if (filters.location && filters.location !== '_all') {
        query = query.eq('location', filters.location);
      }
      
      if (filters.status === 'available') {
        query = query.eq('is_active', true);
      } else if (filters.status === 'inactive') {
        query = query.eq('is_active', false);
      }
      
      // Sort results if specified
      if (filters.sort_by) {
        const direction = filters.sort_direction || 'asc';
        query = query.order(filters.sort_by, { ascending: direction === 'asc' });
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      this.handleError(error);
    }
    
    // Process the nested data to flatten the amenities
    return (data || []).map((room) => {
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
  }

  /**
   * Get detailed information about a specific room
   */
  async getRoomById(id: string): Promise<RoomWithAmenities> {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        amenities:room_amenities(
          amenity:amenities(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      this.handleError(error);
    }
    
    if (!data) {
      throw new ApiError('Room not found', 404);
    }
    
    // Process the nested data to flatten the amenities
    const amenities = data.amenities
      ? data.amenities
          .map((a) => a.amenity)
          .filter(Boolean)
      : [];
    
    return {
      ...data,
      amenities,
      status: data.is_active ? 'available' : 'inactive',
    };
  }

  /**
   * Check if a room is available for a specific time slot
   */
  async checkRoomAvailability(
    roomId: string, 
    startTime: Date, 
    endTime: Date
  ): Promise<AvailabilityCheckResult> {
    try {
      const { data, error } = await supabase
        .rpc('check_room_availability', {
          room_id: roomId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString()
        });
      
      if (error) {
        this.handleError(error);
      }
      
      // Get conflicting bookings if any
      const { data: conflictingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, title, start_time, end_time')
        .eq('room_id', roomId)
        .eq('status', 'confirmed')
        .or(`start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()}`);
      
      if (bookingsError) {
        console.error('Error fetching conflicting bookings:', bookingsError);
      }
      
      return {
        is_available: data === true,
        conflicting_bookings: conflictingBookings || []
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      this.handleError(error);
    }
  }

  /**
   * Get all rooms available for a specific time slot
   */
  async getAvailableRooms(
    startTime: Date,
    endTime: Date,
    filters?: RoomFilters
  ): Promise<RoomWithAmenities[]> {
    // First get all rooms matching the filters
    const rooms = await this.getAllRooms(filters);
    
    // For each room, check availability
    const availabilityChecks = await Promise.all(
      rooms.map(async (room) => {
        const availability = await this.checkRoomAvailability(
          room.id,
          startTime,
          endTime
        );
        return {
          room,
          isAvailable: availability.is_available
        };
      })
    );
    
    // Filter to only available rooms
    return availabilityChecks
      .filter(check => check.isAvailable)
      .map(check => check.room);
  }

  /**
   * Get the availability schedule for a room over a date range
   */
  async getRoomAvailabilitySchedule(
    roomId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilityCheckResult> {
    try {
      // Get bookings for this room in the specified date range
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, title, start_time, end_time')
        .eq('room_id', roomId)
        .eq('status', 'confirmed')
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString());
      
      if (error) {
        this.handleError(error);
      }
      
      // Determine if the room is available (no conflicting bookings)
      const hasConflictingBookings = bookings && bookings.length > 0;
      
      return {
        is_available: !hasConflictingBookings,
        conflicting_bookings: bookings || []
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      this.handleError(error);
    }
  }

  /**
   * Get the most popular rooms based on booking frequency
   */
  async getPopularRooms(limit: number = 5): Promise<RoomWithAmenities[]> {
    // This is a simple implementation - in a real app, you might 
    // have a more complex query to calculate true popularity
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          amenities:room_amenities(
            amenity:amenities(*)
          ),
          bookings:bookings(count)
        `)
        .eq('is_active', true)
        .order('bookings.count', { ascending: false })
        .limit(limit);
      
      if (error) {
        this.handleError(error);
      }
      
      // Process the rooms
      return (data || []).map((room) => {
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
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      this.handleError(error);
      return [];
    }
  }
}

// Export a singleton instance for use throughout the app
export const roomService = new RoomService();

// Export individual functions for more direct usage
export const getRooms = (filters?: RoomFilters) => roomService.getAllRooms(filters);
export const getRoomById = (id: string) => roomService.getRoomById(id);
export const checkRoomAvailability = (roomId: string, startTime: Date, endTime: Date) => 
  roomService.checkRoomAvailability(roomId, startTime, endTime);
export const getRoomAvailability = (roomId: string, startDate: Date, endDate: Date) =>
  roomService.getRoomAvailabilitySchedule(roomId, startDate, endDate);
export const getPopularRooms = (limit?: number) => roomService.getPopularRooms(limit);
