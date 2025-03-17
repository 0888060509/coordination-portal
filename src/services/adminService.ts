
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

export interface AdminStats {
  totalRooms: number;
  totalUsers: number;
  totalBookings: number;
  bookingsToday: number;
  mostBookedRoom: {
    id: string;
    name: string;
    bookingCount: number;
  } | null;
  recentBookings: any[];
  bookingsByRoom: {
    roomName: string;
    bookingCount: number;
  }[];
  roomUtilization: {
    roomName: string;
    utilizationPercent: number;
  }[];
}

export const adminService = {
  async getAdminStats(): Promise<AdminStats> {
    try {
      // Fetch total rooms
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, name');
      
      if (roomsError) throw roomsError;
      
      // Fetch total users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');
      
      if (usersError) throw usersError;
      
      // Fetch total bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, room_id, start_time, end_time, status');
      
      if (bookingsError) throw bookingsError;
      
      // Calculate bookings today
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      
      const bookingsToday = bookings.filter(booking => {
        const bookingDate = parseISO(booking.start_time);
        return bookingDate >= startOfToday && bookingDate <= endOfToday;
      }).length;
      
      // Calculate most booked room
      const roomBookingCounts: Record<string, number> = {};
      bookings.forEach(booking => {
        roomBookingCounts[booking.room_id] = (roomBookingCounts[booking.room_id] || 0) + 1;
      });
      
      let mostBookedRoomId = '';
      let maxBookings = 0;
      
      Object.entries(roomBookingCounts).forEach(([roomId, count]) => {
        if (count > maxBookings) {
          mostBookedRoomId = roomId;
          maxBookings = count;
        }
      });
      
      const mostBookedRoom = rooms.find(room => room.id === mostBookedRoomId);
      
      // Fetch recent bookings with details
      const { data: recentBookingsData, error: recentBookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          title,
          start_time,
          end_time,
          status,
          rooms (name),
          profiles (first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentBookingsError) throw recentBookingsError;
      
      // Calculate bookings by room
      const bookingsByRoom = rooms.map(room => {
        const bookingCount = bookings.filter(booking => booking.room_id === room.id).length;
        return {
          roomName: room.name,
          bookingCount
        };
      }).sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 10);
      
      // Calculate room utilization (simplified)
      const roomUtilization = rooms.map(room => {
        const roomBookings = bookings.filter(booking => booking.room_id === room.id);
        const utilizationPercent = Math.min(100, Math.round((roomBookings.length / Math.max(1, bookings.length)) * 100));
        return {
          roomName: room.name,
          utilizationPercent
        };
      }).sort((a, b) => b.utilizationPercent - a.utilizationPercent).slice(0, 10);
      
      return {
        totalRooms: rooms.length,
        totalUsers: users.length,
        totalBookings: bookings.length,
        bookingsToday,
        mostBookedRoom: mostBookedRoom ? {
          id: mostBookedRoom.id,
          name: mostBookedRoom.name,
          bookingCount: maxBookings
        } : null,
        recentBookings: recentBookingsData,
        bookingsByRoom,
        roomUtilization
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }
};

export default adminService;
