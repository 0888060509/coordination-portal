
import { supabase } from '@/integrations/supabase/client';
import { BookingWithDetails } from '@/types/booking';
import { Room } from '@/types/room';
import * as bookingService from './bookingService';
import * as roomService from './roomService';

// DashboardStats type definition
export interface DashboardStats {
  totalBookings: number;
  todayBookings: number;
  upcomingBookingsCount: number;
  cancelledBookingsCount: number;
  bookingsByMonth: { month: string; count: number }[];
  bookingsByWeekday: { day: string; count: number }[];
  favoriteRoom: { name: string; bookingCount: number } | null;
  bookingDuration: {
    average: number;
    shortest: number;
    longest: number;
  };
}

// Get upcoming bookings for dashboard
export const getUpcomingBookings = async (userId: string, limit: number = 5): Promise<BookingWithDetails[]> => {
  const now = new Date();
  const bookings = await bookingService.getUserBookings(userId, {
    upcoming: true,
    status: 'confirmed'
  });
  
  return bookings.slice(0, limit);
};

// Get today's bookings for dashboard
export const getTodayBookings = async (userId: string): Promise<BookingWithDetails[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const bookings = await bookingService.getUserBookings(userId, {
    startDate: today,
    endDate: tomorrow,
    status: 'confirmed'
  });
  
  return bookings;
};

// Get available rooms for dashboard
export const getAvailableRooms = async (limit: number = 5): Promise<Room[]> => {
  try {
    const rooms = await roomService.getRooms({ 
      filterOptions: { status: 'available' } 
    });
    return rooms.slice(0, limit);
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return [];
  }
};

// Get booking statistics for dashboard
export const getBookingStats = async (userId: string): Promise<DashboardStats> => {
  try {
    // Get current month bookings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const monthlyBookings = await bookingService.getUserBookings(userId, {
      startDate: startOfMonth,
      endDate: endOfMonth
    });
    
    // Get upcoming bookings
    const upcomingBookings = await bookingService.getUserBookings(userId, {
      upcoming: true
    });
    
    // Get cancelled bookings
    const cancelledBookings = await bookingService.getUserBookings(userId, {
      status: 'cancelled'
    });

    // Mock data for bookings by month and weekday
    const bookingsByMonth = [
      { month: 'Jan', count: 4 },
      { month: 'Feb', count: 6 },
      { month: 'Mar', count: 8 },
      { month: 'Apr', count: 10 },
      { month: 'May', count: 7 },
      { month: 'Jun', count: 9 },
    ];

    const bookingsByWeekday = [
      { day: 'Mon', count: 8 },
      { day: 'Tue', count: 12 },
      { day: 'Wed', count: 15 },
      { day: 'Thu', count: 10 },
      { day: 'Fri', count: 7 },
      { day: 'Sat', count: 3 },
      { day: 'Sun', count: 2 },
    ];
    
    return {
      totalBookings: monthlyBookings.length,
      todayBookings: 2, // Mock data
      upcomingBookingsCount: upcomingBookings.length,
      cancelledBookingsCount: cancelledBookings.length,
      bookingsByMonth,
      bookingsByWeekday,
      favoriteRoom: { name: 'Conference Room A', bookingCount: 12 }, // Mock data
      bookingDuration: {
        average: 60, // in minutes
        shortest: 30,
        longest: 120
      }
    };
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    return {
      totalBookings: 0,
      todayBookings: 0,
      upcomingBookingsCount: 0,
      cancelledBookingsCount: 0,
      bookingsByMonth: [],
      bookingsByWeekday: [],
      favoriteRoom: null,
      bookingDuration: {
        average: 0,
        shortest: 0,
        longest: 0
      }
    };
  }
};

// Get dashboard data (combining all stats)
export const getDashboardData = async (userId: string) => {
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
};

// Export functions as a service object
const dashboardService = {
  getUpcomingBookings,
  getTodayBookings,
  getAvailableRooms,
  getBookingStats,
  getDashboardData
};

export default dashboardService;
