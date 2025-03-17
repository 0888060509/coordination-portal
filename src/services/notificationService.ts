
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Notification, NotificationType, BookingWithDetails } from "@/types/booking";

// Get notifications for the current user
export const fetchNotifications = async (userId: string) => {
  if (!userId) {
    console.log("No user ID provided for fetchNotifications");
    return [];
  }

  try {
    console.log(`Fetching notifications for user: ${userId}`);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
    
    return data as Notification[];
  } catch (error) {
    console.error("Unexpected error fetching notifications:", error);
    return [];
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Unexpected error marking notification:", error);
    return false;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
    
    if (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Unexpected error marking notifications:", error);
    return false;
  }
};

// Create a notification in the database
export const createNotification = async (
  userId: string,
  bookingId: string,
  type: NotificationType,
  message: string
) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        booking_id: bookingId,
        type,
        message,
        is_read: false
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating notification:", error);
      return null;
    }
    
    return data as Notification;
  } catch (error) {
    console.error("Unexpected error creating notification:", error);
    return null;
  }
};

// Send booking confirmation notification
export const sendBookingConfirmation = async (bookingId: string) => {
  try {
    // Fetch the booking details first
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        room:rooms(*),
        user:profiles(*)
      `)
      .eq('id', bookingId)
      .single();
      
    if (bookingError || !booking) {
      console.error("Error fetching booking for confirmation:", bookingError);
      return false;
    }
    
    // Create in-app notification
    await createNotification(
      booking.user_id,
      booking.id,
      'confirmation',
      `Your booking for "${booking.title}" has been confirmed.`
    );

    // Send email notification via Edge Function
    const response = await supabase.functions.invoke('send-booking-email', {
      body: {
        booking_id: booking.id,
        user_email: booking.user.email,
        user_name: `${booking.user.first_name} ${booking.user.last_name}`,
        room_name: booking.room.name,
        booking_title: booking.title,
        start_time: booking.start_time,
        end_time: booking.end_time,
        type: 'confirmation'
      }
    });

    if (response.error) {
      console.error("Error sending confirmation email:", response.error);
    }

    return true;
  } catch (error) {
    console.error("Error in sendBookingConfirmation:", error);
    return false;
  }
};

// Send booking reminder notification
export const sendBookingReminder = async (bookingId: string) => {
  try {
    // Fetch the booking details first
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        room:rooms(*),
        user:profiles(*)
      `)
      .eq('id', bookingId)
      .single();
      
    if (bookingError || !booking) {
      console.error("Error fetching booking for reminder:", bookingError);
      return false;
    }
    
    // Create in-app notification
    await createNotification(
      booking.user_id,
      booking.id,
      'reminder',
      `Reminder: Your booking "${booking.title}" is coming up soon.`
    );

    // Send email notification via Edge Function
    const response = await supabase.functions.invoke('send-booking-email', {
      body: {
        booking_id: booking.id,
        user_email: booking.user.email,
        user_name: `${booking.user.first_name} ${booking.user.last_name}`,
        room_name: booking.room.name,
        booking_title: booking.title,
        start_time: booking.start_time,
        end_time: booking.end_time,
        type: 'reminder'
      }
    });

    if (response.error) {
      console.error("Error sending reminder email:", response.error);
    }

    return true;
  } catch (error) {
    console.error("Error in sendBookingReminder:", error);
    return false;
  }
};

// Send booking update notification
export const sendBookingUpdate = async (bookingId: string) => {
  try {
    // Fetch the booking details first
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        room:rooms(*),
        user:profiles(*)
      `)
      .eq('id', bookingId)
      .single();
      
    if (bookingError || !booking) {
      console.error("Error fetching booking for update:", bookingError);
      return false;
    }
    
    // Create in-app notification
    await createNotification(
      booking.user_id,
      booking.id,
      'update',
      `Your booking "${booking.title}" has been updated.`
    );

    // Send email notification via Edge Function
    const response = await supabase.functions.invoke('send-booking-email', {
      body: {
        booking_id: booking.id,
        user_email: booking.user.email,
        user_name: `${booking.user.first_name} ${booking.user.last_name}`,
        room_name: booking.room.name,
        booking_title: booking.title,
        start_time: booking.start_time,
        end_time: booking.end_time,
        type: 'update'
      }
    });

    if (response.error) {
      console.error("Error sending update email:", response.error);
    }

    return true;
  } catch (error) {
    console.error("Error in sendBookingUpdate:", error);
    return false;
  }
};

// Send booking cancellation notification
export const sendBookingCancellation = async (bookingId: string) => {
  try {
    // Fetch the booking details first
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        room:rooms(*),
        user:profiles(*)
      `)
      .eq('id', bookingId)
      .single();
      
    if (bookingError || !booking) {
      console.error("Error fetching booking for cancellation:", bookingError);
      return false;
    }
    
    // Create in-app notification
    await createNotification(
      booking.user_id,
      booking.id,
      'cancellation',
      `Your booking "${booking.title}" has been cancelled.`
    );

    // Send email notification via Edge Function
    const response = await supabase.functions.invoke('send-booking-email', {
      body: {
        booking_id: booking.id,
        user_email: booking.user.email,
        user_name: `${booking.user.first_name} ${booking.user.last_name}`,
        room_name: booking.room.name,
        booking_title: booking.title,
        start_time: booking.start_time,
        end_time: booking.end_time,
        type: 'cancellation'
      }
    });

    if (response.error) {
      console.error("Error sending cancellation email:", response.error);
    }

    return true;
  } catch (error) {
    console.error("Error in sendBookingCancellation:", error);
    return false;
  }
};

// Subscribe to real-time notifications for a user
export const subscribeToNotifications = (
  userId: string, 
  onNotification: (notification: Notification) => void
) => {
  if (!userId) {
    console.error("No user ID provided for notification subscription");
    return {
      unsubscribe: () => {}
    };
  }

  console.log(`Subscribing to notifications for user: ${userId}`);
  return supabase
    .channel(`notifications-channel-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log("New notification received:", payload);
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();
};

// Export default for module
export default {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  sendBookingConfirmation,
  sendBookingReminder,
  sendBookingUpdate,
  sendBookingCancellation,
  subscribeToNotifications
};
