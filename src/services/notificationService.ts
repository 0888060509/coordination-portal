
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BookingWithDetails, Notification, NotificationType } from '@/types/booking';
import bookingService from './bookingService';

export interface CreateNotificationData {
  user_id: string;
  booking_id: string;
  type: NotificationType;
  message: string;
}

const notificationService = {
  // Create a notification in the database
  async createNotification(data: CreateNotificationData): Promise<string> {
    try {
      const { data: notificationData, error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          booking_id: data.booking_id,
          type: data.type,
          message: data.message,
          is_read: false
        })
        .select('id')
        .single();

      if (error) throw error;
      return notificationData.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Get all notifications for the current user
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Get unread notifications count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
  },

  // Mark a notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Email notification helper function
  async sendBookingEmail(booking: BookingWithDetails, type: NotificationType): Promise<void> {
    try {
      // Call edge function for email notification
      const { data, error } = await supabase.functions.invoke('send-booking-email', {
        body: {
          booking_id: booking.id,
          user_email: booking.user.email,
          user_name: `${booking.user.first_name} ${booking.user.last_name}`,
          room_name: booking.room.name,
          booking_title: booking.title,
          start_time: booking.start_time,
          end_time: booking.end_time,
          type: type
        }
      });

      if (error) {
        console.error(`Error calling send-booking-email function:`, error);
      } else {
        console.log(`Email notification sent:`, data);
      }
    } catch (error) {
      console.error(`Error sending ${type} email:`, error);
    }
  },

  // Notification Type Handlers
  async sendBookingConfirmation(bookingId: string): Promise<void> {
    try {
      const booking = await bookingService.getBookingById(bookingId);
      if (!booking) throw new Error('Booking not found');

      // Create in-app notification
      await this.createNotification({
        user_id: booking.user_id,
        booking_id: bookingId,
        type: 'confirmation',
        message: `Your booking for ${booking.title} has been confirmed.`
      });

      // Send email notification
      await this.sendBookingEmail(booking, 'confirmation');

      // Show toast notification if the user is online
      toast({
        title: "Booking Confirmed",
        description: `Your booking for ${booking.title} has been confirmed.`,
      });
    } catch (error) {
      console.error('Error sending booking confirmation:', error);
      throw error;
    }
  },

  async sendBookingReminder(bookingId: string): Promise<void> {
    try {
      const booking = await bookingService.getBookingById(bookingId);
      if (!booking) throw new Error('Booking not found');

      // Create in-app notification
      await this.createNotification({
        user_id: booking.user_id,
        booking_id: bookingId,
        type: 'reminder',
        message: `Reminder: Your booking for ${booking.title} is coming up soon.`
      });

      // Send email notification
      await this.sendBookingEmail(booking, 'reminder');
    } catch (error) {
      console.error('Error sending booking reminder:', error);
      throw error;
    }
  },

  async sendBookingUpdate(bookingId: string): Promise<void> {
    try {
      const booking = await bookingService.getBookingById(bookingId);
      if (!booking) throw new Error('Booking not found');

      // Create in-app notification
      await this.createNotification({
        user_id: booking.user_id,
        booking_id: bookingId,
        type: 'update',
        message: `Your booking for ${booking.title} has been updated.`
      });

      // Send email notification
      await this.sendBookingEmail(booking, 'update');

      // Show toast notification if the user is online
      toast({
        title: "Booking Updated",
        description: `Your booking for ${booking.title} has been updated.`,
      });
    } catch (error) {
      console.error('Error sending booking update:', error);
      throw error;
    }
  },

  async sendBookingCancellation(bookingId: string): Promise<void> {
    try {
      const booking = await bookingService.getBookingById(bookingId);
      if (!booking) throw new Error('Booking not found');

      // Create in-app notification
      await this.createNotification({
        user_id: booking.user_id,
        booking_id: bookingId,
        type: 'cancellation',
        message: `Your booking for ${booking.title} has been cancelled.`
      });

      // Send email notification
      await this.sendBookingEmail(booking, 'cancellation');

      // Show toast notification if the user is online
      toast({
        title: "Booking Cancelled",
        description: `Your booking for ${booking.title} has been cancelled.`,
      });
    } catch (error) {
      console.error('Error sending booking cancellation:', error);
      throw error;
    }
  },

  // Subscribe to notifications changes
  subscribeToNotifications(
    userId: string,
    callback: (payload: any) => void
  ): { unsubscribe: () => void } {
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }
};

export default notificationService;
