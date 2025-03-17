
import { supabase } from '@/integrations/supabase/client';
import { bookingService } from './bookingService';
import { roomService } from './roomService';
import { BookingWithDetails } from '@/types/booking';
import { RoomWithAmenities } from '@/types/room';
import { startOfDay, endOfDay, addDays, format, parseISO, isSameDay } from 'date-fns';

export interface DashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  todayBookings: number;
  favoriteRoom: {
    id: string;
    name: string;
    bookingCount: number;
  } | null;
  bookingsByMonth: {
    month: string;
    count: number;
  }[];
  bookingsByWeekday: {
    day: string;
    count: number;
  }[];
  bookingDuration: {
    average: number; // in minutes
    shortest: number; // in minutes
    longest: number; // in minutes
  };
}

export interface DashboardData {
  todayBookings: BookingWithDetails[];
  upcomingBookings: BookingWithDetails[];
  availableRooms: RoomWithAmenities[];
  stats: DashboardStats;
}

export const dashboardService = {
  // Get all dashboard data
  async getDashboardData(): Promise<DashboardData> {
    try {
      // Get current user bookings
      const allBookings = await bookingService.getUserBookings();
      
      // Filter bookings
      const now = new Date();
      const today = startOfDay(now);
      const tomorrow = endOfDay(addDays(today, 1));
      
      const todayBookings = allBookings.filter(booking => 
        booking.status === 'confirmed' && 
        isSameDay(parseISO(booking.start_time), now)
      );
      
      const upcomingBookings = allBookings.filter(booking => 
        booking.status === 'confirmed' && 
        parseISO(booking.start_time) > now &&
        !isSameDay(parseISO(booking.start_time), now)
      ).slice(0, 5); // Limit to 5 upcoming bookings
      
      // Get available rooms for today
      const availableRooms = await roomService.getRooms({
        date: now,
        startTime: format(now, 'HH:mm'),
        endTime: '18:00' // Assuming end of business day
      });
      
      // Calculate statistics
      const stats = await this.calculateUserStats(allBookings);
      
      return {
        todayBookings,
        upcomingBookings,
        availableRooms: availableRooms.slice(0, 3), // Limit to 3 available rooms
        stats
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },
  
  // Calculate user statistics
  async calculateUserStats(bookings: BookingWithDetails[]): Promise<DashboardStats> {
    try {
      // Filter only confirmed and completed bookings
      const validBookings = bookings.filter(booking => 
        booking.status === 'confirmed' || booking.status === 'completed'
      );
      
      const now = new Date();
      const today = startOfDay(now);
      
      // Count bookings
      const totalBookings = validBookings.length;
      
      const upcomingBookings = validBookings.filter(booking => 
        parseISO(booking.start_time) > now
      ).length;
      
      const todayBookings = validBookings.filter(booking => 
        isSameDay(parseISO(booking.start_time), now)
      ).length;
      
      // Find favorite room
      const roomCounts = validBookings.reduce((acc, booking) => {
        const roomId = booking.room.id;
        acc[roomId] = (acc[roomId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      let favoriteRoom = null;
      let maxCount = 0;
      
      for (const [roomId, count] of Object.entries(roomCounts)) {
        if (count > maxCount) {
          maxCount = count;
          const room = validBookings.find(b => b.room.id === roomId)?.room;
          if (room) {
            favoriteRoom = {
              id: roomId,
              name: room.name,
              bookingCount: count
            };
          }
        }
      }
      
      // Calculate bookings by month
      const monthCounts = validBookings.reduce((acc, booking) => {
        const month = format(parseISO(booking.start_time), 'MMM');
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const bookingsByMonth = Object.entries(monthCounts)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return months.indexOf(a.month) - months.indexOf(b.month);
        });
      
      // Calculate bookings by weekday
      const weekdayCounts = validBookings.reduce((acc, booking) => {
        const day = format(parseISO(booking.start_time), 'EEE');
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const bookingsByWeekday = Object.entries(weekdayCounts)
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => {
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          return days.indexOf(a.day) - days.indexOf(b.day);
        });
      
      // Calculate booking duration statistics
      let totalDuration = 0;
      let shortestDuration = Infinity;
      let longestDuration = 0;
      
      validBookings.forEach(booking => {
        const startTime = parseISO(booking.start_time);
        const endTime = parseISO(booking.end_time);
        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        
        totalDuration += durationMinutes;
        shortestDuration = Math.min(shortestDuration, durationMinutes);
        longestDuration = Math.max(longestDuration, durationMinutes);
      });
      
      const averageDuration = validBookings.length > 0 
        ? Math.round(totalDuration / validBookings.length) 
        : 0;
      
      return {
        totalBookings,
        upcomingBookings,
        todayBookings,
        favoriteRoom,
        bookingsByMonth,
        bookingsByWeekday,
        bookingDuration: {
          average: averageDuration,
          shortest: shortestDuration === Infinity ? 0 : shortestDuration,
          longest: longestDuration
        }
      };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      throw error;
    }
  }
};

export default dashboardService;
