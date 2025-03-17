import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { Booking, BookingWithDetails, CreateBookingData } from '@/types/booking';
import { toast } from '@/hooks/use-toast';

export const bookingService = {
  // Get all bookings for the current user
  async getUserBookings(): Promise<BookingWithDetails[]> {
    try {
      console.log("Fetching user bookings");
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting current user:", userError);
        throw userError;
      }
      
      const userId = userData.user?.id;

      if (!userId) {
        console.error("No authenticated user found");
        throw new Error('User not authenticated');
      }

      console.log("Fetching bookings for user:", userId);

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
        console.error("Error fetching user bookings:", bookingsError);
        throw bookingsError;
      }

      console.log("Bookings data from Supabase:", bookingsData);

      if (!bookingsData || bookingsData.length === 0) {
        return [];
      }

      // Get user profile separately since there's no direct FK relationship
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        throw profileError;
      }

      console.log("Profile data from Supabase:", profileData);

      // Format the data to match our BookingWithDetails type
      const bookings = bookingsData.map(booking => ({
        ...booking,
        room: booking.rooms,
        user: profileData,
        rooms: undefined,
      })) as unknown as BookingWithDetails[];

      console.log("Processed bookings data:", bookings);
      
      return bookings;
    } catch (error) {
      console.error('Error in getUserBookings:', error);
      throw error;
    }
  },

  // Get a specific booking by ID
  async getBookingById(id: string): Promise<BookingWithDetails | null> {
    try {
      console.log("Fetching booking by ID:", id);
      
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
        console.error("Error fetching booking by ID:", bookingError);
        throw bookingError;
      }

      if (!bookingData) {
        console.log("No booking found with ID:", id);
        return null;
      }

      console.log("Booking data from Supabase:", bookingData);

      // Get user profile separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', bookingData.user_id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        throw profileError;
      }

      console.log("Profile data from Supabase:", profileData);

      // Format the data to match our BookingWithDetails type
      const booking = {
        ...bookingData,
        room: bookingData.rooms,
        user: profileData,
        rooms: undefined,
      } as unknown as BookingWithDetails;

      console.log("Processed booking data:", booking);
      
      return booking;
    } catch (error) {
      console.error('Error in getBookingById:', error);
      throw error;
    }
  },

  // Create a new booking
  async createBooking(bookingData: CreateBookingData): Promise<string> {
    try {
      console.log("Creating new booking:", bookingData);
      
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

      console.log("Prepared booking data:", booking);

      // First check room availability
      const { data: isAvailable, error: availabilityError } = await supabase.rpc(
        'check_room_availability',
        {
          room_id: booking.room_id,
          start_time: booking.start_time,
          end_time: booking.end_time
        }
      );

      if (availabilityError) {
        console.error("Error checking room availability:", availabilityError);
        throw new Error(`Failed to check room availability: ${availabilityError.message}`);
      }

      console.log("Room availability check result:", isAvailable);

      if (!isAvailable) {
        throw new Error('The room is not available during the selected time period');
      }

      // Direct insert instead of using RPC function if it's causing issues
      const { data: newBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert([booking])
        .select('id')
        .single();

      if (bookingError) {
        console.error("Error creating booking:", bookingError);
        throw new Error(`Failed to create booking: ${bookingError.message}`);
      }

      if (!newBooking) {
        throw new Error('Failed to create booking: No ID returned');
      }

      console.log("Booking created successfully:", newBooking);
      
      const bookingId = newBooking.id;

      // If attendees are provided, add them
      if (bookingData.attendees && bookingData.attendees.length > 0) {
        console.log("Adding attendees to booking:", bookingData.attendees);
        
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
          // Don't fail the whole booking if attendees couldn't be added
          toast({
            title: "Booking created but with warnings",
            description: "Room booked successfully, but there was an issue adding attendees.",
            variant: "destructive"
          });
        }
      }

      return bookingId;
    } catch (error: any) {
      console.error('Error in createBooking:', error);
      throw error;
    }
  },

  // Update an existing booking
  async updateBooking(id: string, bookingData: Partial<Booking>): Promise<void> {
    try {
      console.log("Updating booking:", id, bookingData);
      
      // If updating times, check availability first
      if (bookingData.start_time && bookingData.end_time) {
        console.log("Checking availability for updated time slot");
        
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
          console.error("Error checking room availability:", availabilityError);
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
        console.error("Error updating booking:", error);
        throw error;
      }

      console.log("Booking updated successfully");
    } catch (error) {
      console.error('Error in updateBooking:', error);
      throw error;
    }
  },

  // Cancel a booking
  async cancelBooking(id: string, reason?: string): Promise<void> {
    try {
      console.log("Cancelling booking:", id, reason);
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: reason || 'Cancelled by user'
        })
        .eq('id', id);

      if (error) {
        console.error("Error cancelling booking:", error);
        throw error;
      }

      console.log("Booking cancelled successfully");
    } catch (error) {
      console.error('Error in cancelBooking:', error);
      throw error;
    }
  },

  // Delete a booking
  async deleteBooking(id: string): Promise<void> {
    try {
      console.log("Deleting booking:", id);
      
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting booking:", error);
        throw error;
      }

      console.log("Booking deleted successfully");
    } catch (error) {
      console.error('Error in deleteBooking:', error);
      throw error;
    }
  },

  // Get all bookings for a specific room
  async getRoomBookings(roomId: string, startDate: Date, endDate: Date): Promise<Booking[]> {
    try {
      console.log("Fetching room bookings:", {
        roomId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', roomId)
        .eq('status', 'confirmed')
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .order('start_time');

      if (error) {
        console.error("Error fetching room bookings:", error);
        throw error;
      }

      console.log("Room bookings data:", data);
      
      return data as Booking[];
    } catch (error) {
      console.error('Error in getRoomBookings:', error);
      throw error;
    }
  }
};
