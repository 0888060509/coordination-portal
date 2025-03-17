
import { supabase } from '@/integrations/supabase/client';
import { BookingWithDetails } from '@/types/booking';
import { RoomWithAmenities, Room } from '@/types/room';
import { getRoomById, getRooms } from './roomService';
import { getBooking } from './bookingService';

// Define the DashboardStats interface
export interface DashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  mostBookedRoom?: {
    id: string;
    name: string;
    bookings: number;
  };
  bookingsByWeekday: {
    day: string;
    count: number;
  }[];
  bookingsByStatus: {
    status: string;
    count: number;
  }[];
}

// Define the DashboardData interface
export interface DashboardData {
  stats: DashboardStats;
  upcomingBookings: BookingWithDetails[];
  todayBookings: BookingWithDetails[];
  availableRooms: RoomWithAmenities[];
}

// Get dashboard stats for a user
export const getBookingStats = async (userId: string): Promise<DashboardStats> => {
  try {
    // Get counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('bookings')
      .select('status', { count: 'exact', head: false })
      .eq('user_id', userId)
      .or('status.eq.confirmed,status.eq.completed,status.eq.cancelled');

    if (statusError) {
      console.error('Error fetching booking status counts:', statusError);
      throw statusError;
    }

    // Count bookings by status
    let confirmed = 0;
    let completed = 0;
    let cancelled = 0;

    statusCounts?.forEach((item) => {
      if (item.status === 'confirmed') confirmed++;
      if (item.status === 'completed') completed++;
      if (item.status === 'cancelled') cancelled++;
    });

    // Get bookings by weekday
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('start_time')
      .eq('user_id', userId);

    if (bookingsError) {
      console.error('Error fetching bookings for weekday stats:', bookingsError);
      throw bookingsError;
    }

    // Process bookings by weekday
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bookingsByWeekday = weekdays.map(day => ({ day, count: 0 }));

    bookings?.forEach(booking => {
      const date = new Date(booking.start_time);
      const weekday = date.getDay();
      bookingsByWeekday[weekday].count++;
    });

    // Get most booked room
    const { data: roomBookings, error: roomError } = await supabase
      .from('bookings')
      .select('room_id')
      .eq('user_id', userId);

    if (roomError) {
      console.error('Error fetching room bookings:', roomError);
      throw roomError;
    }

    // Count bookings per room
    const roomCounts: { [key: string]: number } = {};
    roomBookings?.forEach(booking => {
      roomCounts[booking.room_id] = (roomCounts[booking.room_id] || 0) + 1;
    });

    // Find the most booked room
    let mostBookedRoomId = '';
    let maxBookings = 0;

    for (const [roomId, count] of Object.entries(roomCounts)) {
      if (count > maxBookings) {
        mostBookedRoomId = roomId;
        maxBookings = count;
      }
    }

    let mostBookedRoom;
    if (mostBookedRoomId) {
      const room = await getRoomById(mostBookedRoomId);
      if (room) {
        mostBookedRoom = {
          id: room.id,
          name: room.name,
          bookings: maxBookings
        };
      }
    }

    return {
      totalBookings: (statusCounts?.length || 0),
      upcomingBookings: confirmed,
      completedBookings: completed,
      cancelledBookings: cancelled,
      mostBookedRoom,
      bookingsByWeekday,
      bookingsByStatus: [
        { status: 'Confirmed', count: confirmed },
        { status: 'Completed', count: completed },
        { status: 'Cancelled', count: cancelled }
      ]
    };
  } catch (error) {
    console.error('Error in getBookingStats:', error);
    // Return default stats in case of error
    return {
      totalBookings: 0,
      upcomingBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      bookingsByWeekday: [],
      bookingsByStatus: []
    };
  }
};

// Get upcoming bookings for a user
export const getUpcomingBookings = async (userId: string, limit = 5): Promise<BookingWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        room:rooms(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming bookings:', error);
      return [];
    }

    // Get user profiles for each booking
    const bookingsWithDetails: BookingWithDetails[] = await Promise.all(
      (data || []).map(async (booking) => {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', booking.user_id)
          .single();

        if (userError) {
          console.error('Error fetching user profile:', userError);
        }

        return {
          ...booking,
          user: userData || { id: booking.user_id, email: '', first_name: '', last_name: '' }
        } as BookingWithDetails;
      })
    );

    return bookingsWithDetails;
  } catch (error) {
    console.error('Error in getUpcomingBookings:', error);
    return [];
  }
};

// Get today's bookings for a user
export const getTodayBookings = async (userId: string): Promise<BookingWithDetails[]> => {
  try {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        room:rooms(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .gte('start_time', todayStart)
      .lte('start_time', todayEnd)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching today bookings:', error);
      return [];
    }

    // Get user profiles for each booking
    const bookingsWithDetails: BookingWithDetails[] = await Promise.all(
      (data || []).map(async (booking) => {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', booking.user_id)
          .single();

        if (userError) {
          console.error('Error fetching user profile:', userError);
        }

        return {
          ...booking,
          user: userData || { id: booking.user_id, email: '', first_name: '', last_name: '' }
        } as BookingWithDetails;
      })
    );

    return bookingsWithDetails;
  } catch (error) {
    console.error('Error in getTodayBookings:', error);
    return [];
  }
};

// Get available rooms
export const getAvailableRooms = async (limit = 5): Promise<RoomWithAmenities[]> => {
  try {
    const rooms = await getRooms({ status: 'available' });
    
    // Convert Room to RoomWithAmenities
    const availableRooms: RoomWithAmenities[] = rooms.slice(0, limit).map(room => ({
      ...room,
      amenities: room.amenities || [],
      status: room.is_active ? 'available' : 'inactive'
    }));
    
    return availableRooms;
  } catch (error) {
    console.error('Error in getAvailableRooms:', error);
    return [];
  }
};

// Get all dashboard data
export const getDashboardStats = async (userId: string): Promise<DashboardData> => {
  try {
    const stats = await getBookingStats(userId);
    const upcomingBookings = await getUpcomingBookings(userId);
    const todayBookings = await getTodayBookings(userId);
    const availableRooms = await getAvailableRooms();

    return {
      stats,
      upcomingBookings,
      todayBookings,
      availableRooms
    };
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    return {
      stats: {
        totalBookings: 0,
        upcomingBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        bookingsByWeekday: [],
        bookingsByStatus: []
      },
      upcomingBookings: [],
      todayBookings: [],
      availableRooms: []
    };
  }
};

export default {
  getUpcomingBookings,
  getTodayBookings,
  getAvailableRooms,
  getBookingStats,
  getDashboardStats
};
