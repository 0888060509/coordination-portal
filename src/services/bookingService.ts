
import { supabase } from '@/integrations/supabase/client';
import { Booking, BookingWithDetails, CreateBookingData, RecurringPattern } from '@/types/booking';
import { Room } from '@/types/room';

// Create a new booking
export const createBooking = async (bookingData: CreateBookingData): Promise<string> => {
  try {
    // Convert dates to ISO strings if they aren't already
    const formattedData = {
      ...bookingData,
      start_time: bookingData.start_time instanceof Date 
        ? bookingData.start_time.toISOString() 
        : bookingData.start_time,
      end_time: bookingData.end_time instanceof Date 
        ? bookingData.end_time.toISOString() 
        : bookingData.end_time,
    };

    // Create the booking record
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          room_id: formattedData.room_id,
          user_id: formattedData.user_id,
          title: formattedData.title,
          description: formattedData.description,
          start_time: formattedData.start_time,
          end_time: formattedData.end_time,
          recurring_pattern_id: formattedData.recurring_pattern_id,
          status: 'confirmed',
        },
      ])
      .select();

    if (error) {
      console.error('Error creating booking:', error);
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('No booking data returned after creation');
    }

    const bookingId = data[0].id;

    // Store attendees if provided
    if (formattedData.attendees && formattedData.attendees.length > 0) {
      const attendeeRecords = formattedData.attendees.map((attendeeId) => ({
        booking_id: bookingId,
        user_id: attendeeId,
      }));

      const { error: attendeesError } = await supabase
        .from('booking_attendees')
        .insert(attendeeRecords);

      if (attendeesError) {
        console.error('Error adding attendees:', attendeesError);
        // Don't fail the booking creation, just log the error
      }
    }

    // Store equipment if provided
    if (formattedData.equipment_needed && formattedData.equipment_needed.length > 0) {
      const equipmentRecords = formattedData.equipment_needed.map((equipment) => ({
        booking_id: bookingId,
        equipment_type: equipment,
      }));

      const { error: equipmentError } = await supabase
        .from('booking_equipment')
        .insert(equipmentRecords);

      if (equipmentError) {
        console.error('Error adding equipment:', equipmentError);
        // Don't fail the booking creation, just log the error
      }
    }

    return bookingId;
  } catch (error: any) {
    console.error('Error in createBooking:', error);
    throw error;
  }
};

// Get a booking by ID with related details
export const getBookingById = async (bookingId: string): Promise<BookingWithDetails | null> => {
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

    // Get attendees for this booking
    const { data: attendees, error: attendeesError } = await supabase
      .from('booking_attendees')
      .select('user_id')
      .eq('booking_id', bookingId);

    if (attendeesError) {
      console.error('Error fetching attendees:', attendeesError);
    }

    // Get equipment for this booking
    const { data: equipment, error: equipmentError } = await supabase
      .from('booking_equipment')
      .select('equipment_type')
      .eq('booking_id', bookingId);

    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
    }

    const bookingWithDetails: BookingWithDetails = {
      ...data,
      attendees: attendees ? attendees.map(a => a.user_id) : undefined,
      equipment_needed: equipment ? equipment.map(e => e.equipment_type) : undefined,
    };

    return bookingWithDetails;
  } catch (error) {
    console.error('Error in getBookingById:', error);
    return null;
  }
};

// Get all bookings for a user with filtering options
export const getUserBookings = async (
  userId: string,
  filters: {
    status?: 'confirmed' | 'cancelled' | 'completed';
    startDate?: Date;
    endDate?: Date;
    upcoming?: boolean;
    past?: boolean;
  } = {}
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

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.startDate) {
      query = query.gte('start_time', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('end_time', filters.endDate.toISOString());
    }

    if (filters.upcoming) {
      query = query.gte('start_time', new Date().toISOString());
    }

    if (filters.past) {
      query = query.lt('end_time', new Date().toISOString());
    }

    // Order by start time
    query = query.order('start_time', { ascending: filters.upcoming !== false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user bookings:', error);
      return [];
    }

    // Get attendees and equipment for each booking
    const bookingsWithDetails: BookingWithDetails[] = [];
    
    for (const booking of data || []) {
      // Get attendees for this booking
      const { data: attendees, error: attendeesError } = await supabase
        .from('booking_attendees')
        .select('user_id')
        .eq('booking_id', booking.id);

      if (attendeesError) {
        console.error('Error fetching attendees:', attendeesError);
      }

      // Get equipment for this booking
      const { data: equipment, error: equipmentError } = await supabase
        .from('booking_equipment')
        .select('equipment_type')
        .eq('booking_id', booking.id);

      if (equipmentError) {
        console.error('Error fetching equipment:', equipmentError);
      }

      bookingsWithDetails.push({
        ...booking,
        attendees: attendees ? attendees.map(a => a.user_id) : undefined,
        equipment_needed: equipment ? equipment.map(e => e.equipment_type) : undefined,
      });
    }

    return bookingsWithDetails;
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    return [];
  }
};

// Update an existing booking
export const updateBooking = async (
  bookingId: string,
  bookingData: Partial<Booking | CreateBookingData>
): Promise<boolean> => {
  try {
    // Convert dates to ISO strings if they aren't already
    const formattedData: any = {
      ...bookingData,
    };

    if (bookingData.start_time) {
      formattedData.start_time = bookingData.start_time instanceof Date 
        ? bookingData.start_time.toISOString() 
        : bookingData.start_time;
    }

    if (bookingData.end_time) {
      formattedData.end_time = bookingData.end_time instanceof Date 
        ? bookingData.end_time.toISOString() 
        : bookingData.end_time;
    }

    // Update the booking record
    const { error } = await supabase
      .from('bookings')
      .update({
        title: formattedData.title,
        description: formattedData.description,
        start_time: formattedData.start_time,
        end_time: formattedData.end_time,
        recurring_pattern_id: formattedData.recurring_pattern_id,
        status: formattedData.status,
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking:', error);
      throw new Error(error.message);
    }

    // Update attendees if provided
    if (formattedData.attendees !== undefined) {
      // First, delete existing attendees
      const { error: deleteError } = await supabase
        .from('booking_attendees')
        .delete()
        .eq('booking_id', bookingId);

      if (deleteError) {
        console.error('Error deleting attendees:', deleteError);
      }

      // Then, add new attendees
      if (formattedData.attendees && formattedData.attendees.length > 0) {
        const attendeeRecords = formattedData.attendees.map((attendeeId: string) => ({
          booking_id: bookingId,
          user_id: attendeeId,
        }));

        const { error: attendeesError } = await supabase
          .from('booking_attendees')
          .insert(attendeeRecords);

        if (attendeesError) {
          console.error('Error adding attendees:', attendeesError);
        }
      }
    }

    // Update equipment if provided
    if (formattedData.equipment_needed !== undefined) {
      // First, delete existing equipment
      const { error: deleteError } = await supabase
        .from('booking_equipment')
        .delete()
        .eq('booking_id', bookingId);

      if (deleteError) {
        console.error('Error deleting equipment:', deleteError);
      }

      // Then, add new equipment
      if (formattedData.equipment_needed && formattedData.equipment_needed.length > 0) {
        const equipmentRecords = formattedData.equipment_needed.map((equipment: string) => ({
          booking_id: bookingId,
          equipment_type: equipment,
        }));

        const { error: equipmentError } = await supabase
          .from('booking_equipment')
          .insert(equipmentRecords);

        if (equipmentError) {
          console.error('Error adding equipment:', equipmentError);
        }
      }
    }

    return true;
  } catch (error: any) {
    console.error('Error in updateBooking:', error);
    throw error;
  }
};

// Cancel a booking
export const cancelBooking = async (
  bookingId: string,
  reason?: string
): Promise<boolean> => {
  try {
    // Update the booking status to cancelled
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Error cancelling booking:', error);
      throw new Error(error.message);
    }

    return true;
  } catch (error: any) {
    console.error('Error in cancelBooking:', error);
    throw error;
  }
};

// Create a recurring pattern
export const createRecurringPattern = async (
  patternData: Omit<RecurringPattern, 'id' | 'created_at'>
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('recurring_patterns')
      .insert([patternData])
      .select();

    if (error) {
      console.error('Error creating recurring pattern:', error);
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('No pattern data returned after creation');
    }

    return data[0].id;
  } catch (error: any) {
    console.error('Error in createRecurringPattern:', error);
    throw error;
  }
};

// Get available users for booking attendees
export const getAvailableUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, department')
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAvailableUsers:', error);
    return [];
  }
};

// Get bookings for a specific room
export const getRoomBookings = async (
  roomId: string,
  startDate?: Date,
  endDate?: Date
): Promise<BookingWithDetails[]> => {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        room:rooms(*),
        user:profiles(*)
      `)
      .eq('room_id', roomId)
      .eq('status', 'confirmed');

    if (startDate) {
      query = query.gte('start_time', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('start_time', endDate.toISOString());
    }

    // Order by start time
    query = query.order('start_time', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching room bookings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRoomBookings:', error);
    return [];
  }
};

// Get all bookings
export const getAllBookings = async (
  filters: {
    status?: 'confirmed' | 'cancelled' | 'completed';
    startDate?: Date;
    endDate?: Date;
    roomId?: string;
    userId?: string;
  } = {}
): Promise<BookingWithDetails[]> => {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        room:rooms(*),
        user:profiles(*)
      `);

    // Apply filters
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

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    // Order by start time
    query = query.order('start_time', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all bookings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllBookings:', error);
    return [];
  }
};

// Export as named exports and as a default object
const bookingService = {
  createBooking,
  getBookingById,
  getUserBookings,
  updateBooking,
  cancelBooking,
  createRecurringPattern,
  getAvailableUsers,
  getRoomBookings,
  getAllBookings,
};

export default bookingService;
