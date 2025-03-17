import { supabase } from '@/integrations/supabase/client';
import { 
  Booking, 
  BookingWithDetails, 
  CreateBookingData,
  RecurringPattern 
} from '@/types/booking';
import { toast } from 'sonner';

// Function to get a single booking by ID with details
export const getBooking = async (bookingId: string): Promise<BookingWithDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        room:rooms(*),
        user:profiles(*)
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      room: data.room,
      user: data.user,
    } as BookingWithDetails;
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return null;
  }
};

// Function to get all bookings for a user with filtering
export const getUserBookings = async (
  userId: string, 
  filters?: {
    status?: 'confirmed' | 'cancelled' | 'completed';
    startDate?: Date;
    endDate?: Date;
    roomId?: string;
  }
): Promise<BookingWithDetails[]> => {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        room:rooms(*),
        user:profiles(*)
      `)
      .eq('user_id', userId);

    // Apply filters if provided
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.startDate) {
        query = query.gte('start_time', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        query = query.lte('end_time', filters.endDate.toISOString());
      }
      
      if (filters.roomId) {
        query = query.eq('room_id', filters.roomId);
      }
    }

    // Order by start time
    query = query.order('start_time', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user bookings:', error);
      return [];
    }

    if (!data) return [];

    return data.map(booking => ({
      ...booking,
      room: booking.room,
      user: booking.user,
    })) as BookingWithDetails[];
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }
};

// Function to create a booking
export const createBooking = async (bookingData: CreateBookingData): Promise<{ success: boolean; bookingId?: string; error?: string }> => {
  try {
    // Format dates to strings
    const formattedData = {
      ...bookingData,
      start_time: bookingData.start_time.toISOString(),
      end_time: bookingData.end_time.toISOString(),
    };

    // Check availability before creating the booking
    const isAvailable = await checkRoomAvailability(
      bookingData.room_id,
      bookingData.start_time,
      bookingData.end_time
    );

    if (!isAvailable) {
      return { success: false, error: "Room is not available during the selected time" };
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert(formattedData)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return { success: false, error: error.message };
    }

    // Send notifications to attendees if applicable
    if (bookingData.attendees && bookingData.attendees.length > 0) {
      // Implement notification logic here
      // For example: sendBookingNotifications(data.id, bookingData.attendees);
    }

    return { success: true, bookingId: data.id };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Function to update a booking
export const updateBooking = async (
  bookingId: string,
  updateData: Partial<Booking | CreateBookingData>
): Promise<boolean> => {
  try {
    // Format dates if they exist in updateData
    const formattedData: any = { ...updateData };
    
    if ('start_time' in updateData && updateData.start_time instanceof Date) {
      formattedData.start_time = updateData.start_time.toISOString();
    }
    
    if ('end_time' in updateData && updateData.end_time instanceof Date) {
      formattedData.end_time = updateData.end_time.toISOString();
    }
    
    // If start_time or end_time is updated, check availability
    if (
      ('start_time' in formattedData || 'end_time' in formattedData) &&
      'room_id' in updateData
    ) {
      // Get current booking to get the unchanged properties
      const currentBooking = await getBooking(bookingId);
      
      if (!currentBooking) {
        return false;
      }
      
      const startTime = formattedData.start_time 
        ? new Date(formattedData.start_time) 
        : new Date(currentBooking.start_time);
        
      const endTime = formattedData.end_time 
        ? new Date(formattedData.end_time) 
        : new Date(currentBooking.end_time);
        
      const roomId = updateData.room_id || currentBooking.room_id;
      
      // Check availability excluding the current booking
      const isAvailable = await checkRoomAvailability(
        roomId,
        startTime,
        endTime,
        bookingId
      );
      
      if (!isAvailable) {
        toast.error("Room is not available during the selected time");
        return false;
      }
    }
    
    // Handle attendees if present
    if (updateData.attendees) {
      // Store attendees separately to handle as needed
      const attendees = updateData.attendees;
      // You might implement attendee notification here
    }
    
    const { error } = await supabase
      .from('bookings')
      .update(formattedData)
      .eq('id', bookingId);
      
    if (error) {
      console.error('Error updating booking:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating booking:', error);
    return false;
  }
};

// Function to cancel a booking
export const cancelBooking = async (
  bookingId: string,
  reason?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        description: reason ? `Cancelled: ${reason}` : 'Cancelled by user'
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Error cancelling booking:', error);
      return false;
    }

    // Fetch booking details to get attendees for notification
    const booking = await getBooking(bookingId);
    
    // Send cancellation notifications if there are attendees
    if (booking && booking.attendees && booking.attendees.length > 0) {
      // Implement notification logic here
      // Example: sendCancellationNotifications(bookingId, booking.attendees, reason);
    }

    return true;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return false;
  }
};

// Function to check if a room is available during a specific time
export const checkRoomAvailability = async (
  roomId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<boolean> => {
  try {
    let query = supabase
      .from('bookings')
      .select('id')
      .eq('room_id', roomId)
      .eq('status', 'confirmed')
      .or(`start_time.lt.${endTime.toISOString()},end_time.gt.${startTime.toISOString()}`);

    // Exclude the current booking when checking for updates
    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking room availability:', error);
      return false;
    }

    // Room is available if no conflicting bookings found
    return data.length === 0;
  } catch (error) {
    console.error('Error checking room availability:', error);
    return false;
  }
};

// Function to create a recurring pattern
export const createRecurringPattern = async (
  patternData: Omit<RecurringPattern, 'id' | 'created_at'>
): Promise<{ success: boolean; patternId?: string; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('recurring_patterns')
      .insert(patternData)
      .select()
      .single();

    if (error) {
      console.error('Error creating recurring pattern:', error);
      return { success: false, error: error.message };
    }

    return { success: true, patternId: data.id };
  } catch (error) {
    console.error('Error creating recurring pattern:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Function to get bookings related to a recurring pattern
export const getRecurringBookings = async (
  patternId: string
): Promise<BookingWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        room:rooms(*),
        user:profiles(*)
      `)
      .eq('recurring_pattern_id', patternId);

    if (error) {
      console.error('Error fetching recurring bookings:', error);
      return [];
    }

    if (!data) return [];

    return data.map(booking => ({
      ...booking,
      room: booking.room,
      user: booking.user,
    })) as BookingWithDetails[];
  } catch (error) {
    console.error('Error fetching recurring bookings:', error);
    return [];
  }
};

// Export other necessary functions
export * from '@/services/bookingService';
