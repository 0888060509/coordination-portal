
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { Booking, BookingWithDetails, CreateBookingData } from '@/types/booking';

export const bookingService = {
  // Get all bookings for the current user
  async getUserBookings(): Promise<BookingWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms (*),
          profiles!bookings_user_id_fkey (*)
        `)
        .order('start_time', { ascending: true });

      if (error) {
        throw error;
      }

      // Format the data to match our BookingWithDetails type
      const bookings = data.map(booking => ({
        ...booking,
        room: booking.rooms,
        user: booking.profiles,
        rooms: undefined,
        profiles: undefined
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
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms (*),
          profiles!bookings_user_id_fkey (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      // Format the data to match our BookingWithDetails type
      const booking = {
        ...data,
        room: data.rooms,
        user: data.profiles,
        rooms: undefined,
        profiles: undefined
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
  }
};

export default bookingService;
