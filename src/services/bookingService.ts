
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { Booking, BookingWithDetails, CreateBookingData } from '@/types/booking';

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
      // Prepare booking data with all fields
      const booking = {
        room_id: bookingData.room_id,
        user_id: bookingData.user_id,
        title: bookingData.title,
        description: bookingData.description || '',
        start_time: bookingData.start_time.toISOString(),
        end_time: bookingData.end_time.toISOString(),
        meeting_type: bookingData.meeting_type || null,
        special_requests: bookingData.special_requests || null,
        status: 'confirmed'
      };

      // Use create_booking RPC function which handles conflict checking
      const { data, error } = await supabase.rpc('create_booking', {
        p_room_id: booking.room_id,
        p_user_id: booking.user_id,
        p_title: booking.title,
        p_description: booking.description,
        p_start_time: booking.start_time,
        p_end_time: booking.end_time
      });

      if (error) {
        throw error;
      }

      // The RPC function returns the booking ID
      const bookingId = data as string;
      
      // Update the booking with additional fields
      // (RPC doesn't handle all fields, so we update separately)
      if (booking.meeting_type || booking.special_requests) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            meeting_type: booking.meeting_type,
            special_requests: booking.special_requests
          })
          .eq('id', bookingId);

        if (updateError) {
          console.error('Error updating booking with additional details:', updateError);
          // Don't throw here - the booking was created, just the extra fields weren't updated
        }
      }

      // If attendees are provided, add them
      if (bookingData.attendees && bookingData.attendees.length > 0) {
        const attendeesData = bookingData.attendees.map(attendeeId => ({
          booking_id: bookingId,
          user_id: attendeeId,
          status: 'pending'
        }));

        const { error: attendeesError } = await supabase
          .from('booking_attendees')
          .insert(attendeesData);

        if (attendeesError) {
          console.error('Error adding booking attendees:', attendeesError);
          // Don't throw here - the booking was created, just the attendees weren't added
        }
      }

      return bookingId;
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
  async cancelBooking(id: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: reason || 'Cancelled by user'
        })
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
  }
};

export default bookingService;
