
import { supabase } from '@/lib/supabase';
import { BookingWithDetails, CreateBookingData, RecurringPattern } from '@/types/booking';
import { Booking } from '@/types/index';
import { toast } from '@/hooks/use-toast';

// Get a booking by ID with related details
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
    console.error('Error in getBooking:', error);
    return null;
  }
};

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

// Create a recurring booking
export const createRecurringBooking = async (
  bookingData: CreateBookingData, 
  recurringPattern: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: Date;
    maxOccurrences?: number;
    excludeDates?: Date[];
  }
): Promise<{ bookingIds: string[], conflicts: Date[] }> => {
  try {
    // Format the data for the function call
    const excludeDates = recurringPattern.excludeDates 
      ? recurringPattern.excludeDates.map(d => d.toISOString()) 
      : null;
    
    const { data, error } = await supabase.rpc('create_recurring_bookings', {
      p_room_id: bookingData.room_id,
      p_user_id: bookingData.user_id,
      p_title: bookingData.title,
      p_description: bookingData.description || null,
      p_start_time: bookingData.start_time instanceof Date 
        ? bookingData.start_time.toISOString() 
        : bookingData.start_time,
      p_end_time: bookingData.end_time instanceof Date 
        ? bookingData.end_time.toISOString() 
        : bookingData.end_time,
      p_frequency: recurringPattern.frequency,
      p_interval: recurringPattern.interval,
      p_days_of_week: recurringPattern.daysOfWeek || null,
      p_max_occurrences: recurringPattern.maxOccurrences || null,
      p_pattern_end_date: recurringPattern.endDate ? recurringPattern.endDate.toISOString() : null,
      p_exclude_dates: excludeDates
    });

    if (error) {
      console.error('Error creating recurring bookings:', error);
      throw new Error(error.message);
    }

    // Process the results
    const bookingIds: string[] = [];
    const conflicts: Date[] = [];

    if (data && data.length > 0) {
      data.forEach((result: any) => {
        if (result.status === 'confirmed' && result.booking_id) {
          bookingIds.push(result.booking_id);
        } else if (result.status === 'conflict') {
          conflicts.push(new Date(result.occurrence_date));
        }
      });
    }

    return { bookingIds, conflicts };
  } catch (error: any) {
    console.error('Error in createRecurringBooking:', error);
    throw error;
  }
};

// Check recurring booking availability
export const checkRecurringAvailability = async (
  roomId: string,
  startTime: Date,
  endTime: Date,
  recurringPattern: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: Date;
    maxOccurrences?: number;
  }
): Promise<{ date: Date, available: boolean, conflictId?: string }[]> => {
  try {
    const { data, error } = await supabase.rpc('check_recurring_availability', {
      p_room_id: roomId,
      p_start_date: startTime.toISOString(),
      p_end_date: endTime.toISOString(),
      p_frequency: recurringPattern.frequency,
      p_interval: recurringPattern.interval,
      p_days_of_week: recurringPattern.daysOfWeek || null,
      p_max_occurrences: recurringPattern.maxOccurrences || null,
      p_pattern_end_date: recurringPattern.endDate ? recurringPattern.endDate.toISOString() : null
    });

    if (error) {
      console.error('Error checking recurring availability:', error);
      throw new Error(error.message);
    }

    return (data || []).map((item: any) => ({
      date: new Date(item.occurrence_date),
      available: item.is_available,
      conflictId: item.conflicting_booking_id
    }));
  } catch (error: any) {
    console.error('Error in checkRecurringAvailability:', error);
    throw error;
  }
};

// Get the pattern for a recurring booking
export const getRecurringPattern = async (patternId: string): Promise<RecurringPattern | null> => {
  try {
    const { data, error } = await supabase
      .from('recurring_patterns')
      .select('*')
      .eq('id', patternId)
      .single();

    if (error) {
      console.error('Error fetching recurring pattern:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getRecurringPattern:', error);
    return null;
  }
};

// Get all instances of a recurring booking
export const getRecurringBookingInstances = async (patternId: string): Promise<BookingWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        room:rooms(*),
        user:profiles(*)
      `)
      .eq('recurring_pattern_id', patternId)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching recurring booking instances:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecurringBookingInstances:', error);
    return [];
  }
};

// Cancel a recurring booking
export const cancelRecurringBooking = async (
  patternId: string,
  cancelAll: boolean = true,
  bookingId?: string,
  reason?: string
): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('cancel_recurring_bookings', {
      p_pattern_id: patternId,
      p_cancel_all: cancelAll,
      p_booking_id: bookingId || null,
      p_cancellation_reason: reason || null
    });

    if (error) {
      console.error('Error cancelling recurring booking:', error);
      throw new Error(error.message);
    }

    return data || 0;
  } catch (error: any) {
    console.error('Error in cancelRecurringBooking:', error);
    throw error;
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
        room:rooms(*)
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

    // Transform the data to match BookingWithDetails structure
    // We'll add placeholder user data since we can't fetch from profiles
    const bookingsWithDetails: BookingWithDetails[] = data.map(booking => ({
      ...booking,
      user: {
        id: userId,
        first_name: "Current",
        last_name: "User",
        email: "",
        avatar_url: "",
        // Add other required user fields
      }
    }));

    return bookingsWithDetails;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
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
        meeting_type: formattedData.meeting_type,
        special_requests: formattedData.special_requests
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

// Update a recurring booking
export const updateRecurringBooking = async (
  patternId: string,
  bookingData: Partial<Booking | CreateBookingData>,
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: Date;
    maxOccurrences?: number;
  },
  updateAll: boolean = true,
  bookingId?: string
): Promise<boolean> => {
  try {
    // If updating just a single instance
    if (!updateAll && bookingId) {
      // Remove the recurring pattern link for this booking
      const { error: detachError } = await supabase
        .from('bookings')
        .update({ recurring_pattern_id: null })
        .eq('id', bookingId);

      if (detachError) {
        console.error('Error detaching booking from recurring pattern:', detachError);
        throw new Error(detachError.message);
      }

      // Update the individual booking
      return await updateBooking(bookingId, bookingData);
    }

    // If updating the entire series
    if (recurringPattern) {
      // First update the recurring pattern
      const { error: patternError } = await supabase
        .from('recurring_patterns')
        .update({
          frequency: recurringPattern.frequency,
          interval: recurringPattern.interval,
          days_of_week: recurringPattern.daysOfWeek || null,
          end_date: recurringPattern.endDate ? recurringPattern.endDate.toISOString() : null,
          max_occurrences: recurringPattern.maxOccurrences || null
        })
        .eq('id', patternId);

      if (patternError) {
        console.error('Error updating recurring pattern:', patternError);
        throw new Error(patternError.message);
      }
    }

    // Then update all the bookings in the series
    if (bookingData) {
      const updateData: any = {
        title: bookingData.title,
        description: bookingData.description
      };
      
      // Only add these properties if they exist in the bookingData
      if ('meeting_type' in bookingData) {
        updateData.meeting_type = bookingData.meeting_type;
      }
      
      if ('special_requests' in bookingData) {
        updateData.special_requests = bookingData.special_requests;
      }
      
      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('recurring_pattern_id', patternId)
        .eq('status', 'confirmed');

      if (error) {
        console.error('Error updating recurring bookings:', error);
        throw new Error(error.message);
      }
    }

    return true;
  } catch (error: any) {
    console.error('Error in updateRecurringBooking:', error);
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
        room:rooms(*)
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
  getBooking,
  createBooking,
  createRecurringBooking,
  checkRecurringAvailability,
  getRecurringPattern,
  getRecurringBookingInstances,
  cancelRecurringBooking,
  getUserBookings,
  updateBooking,
  updateRecurringBooking,
  cancelBooking,
  createRecurringPattern,
  getAvailableUsers,
  getRoomBookings,
  getAllBookings,
};

export default bookingService;
