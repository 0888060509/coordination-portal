import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { Booking, BookingWithDetails, CreateBookingData } from '@/types/booking';
import { UserProfile } from '@/types/booking';

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

      return data as string;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Update an existing booking
  async updateBooking(id: string, bookingData: Partial<Booking>): Promise<void> {
    try {
      // If updating times, check availability first
      if (bookingData.start_time && bookingData.end_time) {
        const { data: isAvailable, error: availabilityError } = await supabase.rpc(
          'check_room_availability',
          {
            room_id: bookingData.room_id,
            start_time: bookingData.start_time,
            end_time: bookingData.end_time,
            exclude_booking_id: id
          }
        );

        if (availabilityError) {
          throw availabilityError;
        }

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

  // Check availability for a room
  async checkAvailability(roomId: string, startTime: Date, endTime: Date, excludeBookingId?: string): Promise<boolean> {
    try {
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
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking room availability:', error);
      throw error;
    }
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
  }
};

export default bookingService;
