import { supabase } from '@/integrations/supabase/client';
import { BookingWithDetails } from '@/types/booking';
import * as bookingService from './bookingService';
import * as roomService from './roomService';

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
export const getAvailableRooms = async (limit: number = 5): Promise<any[]> => {
  try {
    const rooms = await roomService.getRooms({ status: 'available' });
    return rooms.slice(0, limit);
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return [];
  }
};

// Get booking statistics for dashboard
export const getBookingStats = async (userId: string): Promise<any> => {
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
    
    return {
      totalBookings: monthlyBookings.length,
      upcomingBookingsCount: upcomingBookings.length,
      cancelledBookingsCount: cancelledBookings.length,
    };
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    return {
      totalBookings: 0,
      upcomingBookingsCount: 0,
      cancelledBookingsCount: 0,
    };
  }
};

// Additional dashboard functions can be added here

// Export functions as a service object
const dashboardService = {
  getUpcomingBookings,
  getTodayBookings,
  getAvailableRooms,
  getBookingStats
};

export default dashboardService;
