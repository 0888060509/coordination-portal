
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { Booking, BookingWithDetails, CreateBookingData } from '@/types/booking';
import { UserProfile } from '@/types/booking';
import { toast } from '@/hooks/use-toast';

export const bookingService = {
  // Get all bookings for the current user
  async getUserBookings(): Promise<BookingWithDetails[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // First, get all bookings for the current user
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms (*)
        `)
        .eq('user_id', userId)
        .order('start_time', { ascending: true });

      if (bookingsError) {
        throw bookingsError;
      }

      // Get user profile separately since there's no direct FK relationship
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Format the data to match our BookingWithDetails type
      const bookings = bookingsData.map(booking => ({
        ...booking,
        room: booking.rooms,
        user: profileData,
        rooms: undefined,
      })) as unknown as BookingWithDetails[];

      return bookings;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  },

  // Get a specific booking by ID
  async getBookingById(id: string): Promise<BookingWithDetails | null> {
    try {
      // First, get the booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms (*)
        `)
        .eq('id', id)
        .single();

      if (bookingError) {
        throw bookingError;
      }

      if (!bookingData) {
        return null;
      }

      // Get user profile separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', bookingData.user_id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Format the data to match our BookingWithDetails type
      const booking = {
        ...bookingData,
        room: bookingData.rooms,
        user: profileData,
        rooms: undefined,
      } as unknown as BookingWithDetails;

      return booking;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  },

  // Create a new booking
  async createBooking(bookingData: CreateBookingData): Promise<string> {
    try {
      // Validate booking times
      if (!this.validateBookingTimes(bookingData.start_time, bookingData.end_time)) {
        throw new Error('Invalid booking times. Please check your start and end times.');
      }

      // Check availability before creating booking
      const isAvailable = await this.isRoomAvailable(
        bookingData.room_id,
        bookingData.start_time,
        bookingData.end_time
      );

      if (!isAvailable) {
        throw new Error('The room is not available during the selected time period');
      }

      // Use the create_booking RPC function which handles conflict checking
      const { data, error } = await supabase.rpc('create_booking', {
        p_room_id: bookingData.room_id,
        p_user_id: bookingData.user_id,
        p_title: bookingData.title,
        p_description: bookingData.description || '',
        p_start_time: bookingData.start_time.toISOString(),
        p_end_time: bookingData.end_time.toISOString()
      });

      if (error) {
        throw error;
      }

      // If we have attendees, add them to the booking
      if (bookingData.attendees && bookingData.attendees.length > 0) {
        await this.addAttendeesToBooking(data as string, bookingData.attendees);
      }

      return data as string;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Add attendees to a booking
  async addAttendeesToBooking(bookingId: string, attendeeIds: string[]): Promise<void> {
    try {
      const attendees = attendeeIds.map(userId => ({
        booking_id: bookingId,
        user_id: userId,
        status: 'invited'
      }));

      const { error } = await supabase
        .from('booking_attendees')
        .insert(attendees);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error adding attendees:', error);
      throw error;
    }
  },

  // Update an existing booking
  async updateBooking(id: string, bookingData: Partial<Booking>): Promise<void> {
    try {
      // If updating times, check availability first
      if (bookingData.start_time && bookingData.end_time) {
        // Validate booking times
        if (!this.validateBookingTimes(
          new Date(bookingData.start_time), 
          new Date(bookingData.end_time)
        )) {
          throw new Error('Invalid booking times. Please check your start and end times.');
        }

        const isAvailable = await this.isRoomAvailable(
          bookingData.room_id!,
          new Date(bookingData.start_time),
          new Date(bookingData.end_time),
          id
        );

        if (!isAvailable) {
          throw new Error('The room is not available during the selected time period');
        }
      }

      const { error } = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  // Cancel a booking
  async cancelBooking(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  // Delete a booking
  async deleteBooking(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  },

  // Get all bookings for a specific room
  async getRoomBookings(roomId: string, startDate: Date, endDate: Date): Promise<Booking[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', roomId)
        .eq('status', 'confirmed')
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .order('start_time');

      if (error) {
        throw error;
      }

      return data as Booking[];
    } catch (error) {
      console.error('Error fetching room bookings:', error);
      throw error;
    }
  },

  // Enhanced check availability for a room with better error handling
  async checkAvailability(
    roomId: string, 
    startTime: Date, 
    endTime: Date, 
    excludeBookingId?: string
  ): Promise<boolean> {
    try {
      // Validate booking times first
      if (!this.validateBookingTimes(startTime, endTime)) {
        return false;
      }

      const { data, error } = await supabase.rpc(
        'check_room_availability',
        {
          room_id: roomId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          exclude_booking_id: excludeBookingId || null
        }
      );

      if (error) {
        console.error('Error checking room availability:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking room availability:', error);
      throw error;
    }
  },

  // New function: isRoomAvailable - with more comprehensive checking and fallbacks
  async isRoomAvailable(
    roomId: string, 
    startTime: Date, 
    endTime: Date, 
    excludeBookingId?: string
  ): Promise<boolean> {
    try {
      // First check if the room exists and is in 'available' status
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('status')
        .eq('id', roomId)
        .single();

      if (roomError) {
        throw roomError;
      }

      // If room is not in available status, it's not available
      if (roomData.status !== 'available') {
        return false;
      }

      // Then check for booking conflicts
      return await this.checkAvailability(roomId, startTime, endTime, excludeBookingId);
    } catch (error) {
      console.error('Error checking room availability:', error);
      // Default to unavailable on error for safety
      return false;
    }
  },

  // New function: findAvailableTimeSlots
  async findAvailableTimeSlots(
    roomId: string, 
    date: Date, 
    startHour: number = 8, 
    endHour: number = 18,
    intervalMinutes: number = 60
  ): Promise<Array<{ startTime: Date; endTime: Date; isAvailable: boolean }>> {
    try {
      // Format date to YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];

      const { data, error } = await supabase.rpc(
        'find_available_time_slots',
        {
          room_id: roomId,
          date_to_check: formattedDate,
          business_start_hour: startHour,
          business_end_hour: endHour,
          slot_duration_minutes: intervalMinutes
        }
      );

      if (error) {
        throw error;
      }

      // Convert the results to the required format
      return (data || []).map(slot => ({
        startTime: new Date(slot.start_time),
        endTime: new Date(slot.end_time),
        isAvailable: slot.is_available
      }));
    } catch (error) {
      console.error('Error finding available time slots:', error);
      throw error;
    }
  },

  // New function: validateBookingTimes
  validateBookingTimes(startTime: Date, endTime: Date): boolean {
    // Ensure end time is after start time
    if (startTime >= endTime) {
      return false;
    }

    // Get business hours (8am to 6pm)
    const businessStartHour = 8;
    const businessEndHour = 18;

    // Check if booking is within business hours
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    const endMinutes = endTime.getMinutes();

    if (startHour < businessStartHour || 
        (endHour > businessEndHour || (endHour === businessEndHour && endMinutes > 0))) {
      return false;
    }

    // Check if booking is too short (less than 30 minutes)
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    if (durationMinutes < 30) {
      return false;
    }

    return true;
  },

  // Get available users for attendee selection
  async getAvailableUsers(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name', { ascending: true });

      if (error) {
        throw error;
      }

      return data as UserProfile[];
    } catch (error) {
      console.error('Error getting available users:', error);
      throw error;
    }
  },

  // Create a recurring booking
  async createRecurringBooking(
    bookingData: CreateBookingData,
    recurringPattern: {
      frequency: 'daily' | 'weekly' | 'monthly';
      interval: number;
      daysOfWeek?: number[];
      endDate?: Date;
      maxOccurrences?: number;
    }
  ): Promise<string[]> {
    try {
      // Create the recurring pattern
      const { data: patternData, error: patternError } = await supabase
        .from('recurring_patterns')
        .insert({
          user_id: bookingData.user_id,
          frequency: recurringPattern.frequency,
          interval: recurringPattern.interval,
          days_of_week: recurringPattern.daysOfWeek,
          start_date: bookingData.start_time.toISOString(),
          end_date: recurringPattern.endDate?.toISOString(),
          max_occurrences: recurringPattern.maxOccurrences
        })
        .select()
        .single();

      if (patternError) {
        throw patternError;
      }

      // Create the first booking
      const bookingId = await this.createBooking({
        ...bookingData,
        recurring_pattern_id: patternData.id
      });

      return [bookingId];
      
      // Note: For a full implementation, we would generate all instances of the recurring booking
      // and create them in a transaction. This implementation just creates the first booking
      // and associates it with a recurring pattern.
    } catch (error) {
      console.error('Error creating recurring booking:', error);
      throw error;
    }
  },

  // Subscribe to booking changes for real-time updates
  subscribeToBookingChanges(
    roomId: string, 
    callback: (payload: any) => void
  ): { unsubscribe: () => void } {
    const channel = supabase
      .channel('room-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }
};

export default bookingService;
