
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Set CORS headers for browser compatibility
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define the booking notification types
type NotificationType = "confirmation" | "reminder" | "update" | "cancellation";

// Define the expected request body
interface BookingEmailRequest {
  booking_id: string;
  user_email: string;
  user_name: string;
  room_name: string;
  booking_title: string;
  start_time: string;
  end_time: string;
  type: NotificationType;
}

// Handle email requests
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { 
      booking_id, 
      user_email, 
      user_name, 
      room_name, 
      booking_title, 
      start_time, 
      end_time, 
      type 
    }: BookingEmailRequest = await req.json();

    // Validate inputs
    if (!booking_id || !user_email || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log(`Sending ${type} email for booking ${booking_id} to ${user_email}`);

    // In a real implementation, this would connect to an email service like SendGrid, Resend, Mailgun, etc.
    // For now, we'll just log the email details
    
    // Format dates for display
    const formatDateTime = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Generate subject and message based on notification type
    let subject = "";
    let message = "";

    switch (type) {
      case "confirmation":
        subject = `Booking Confirmed: ${booking_title}`;
        message = `
          <h1>Booking Confirmed</h1>
          <p>Hello ${user_name},</p>
          <p>Your booking for <strong>${booking_title}</strong> has been confirmed.</p>
          <p><strong>Room:</strong> ${room_name}</p>
          <p><strong>Date & Time:</strong> ${formatDateTime(start_time)} - ${formatDateTime(end_time)}</p>
          <p><strong>Booking ID:</strong> ${booking_id}</p>
          <p>Thank you for using our booking system.</p>
        `;
        break;
      case "reminder":
        subject = `Reminder: Upcoming Booking - ${booking_title}`;
        message = `
          <h1>Booking Reminder</h1>
          <p>Hello ${user_name},</p>
          <p>This is a reminder for your upcoming booking:</p>
          <p><strong>Meeting:</strong> ${booking_title}</p>
          <p><strong>Room:</strong> ${room_name}</p>
          <p><strong>Date & Time:</strong> ${formatDateTime(start_time)} - ${formatDateTime(end_time)}</p>
          <p>We look forward to seeing you soon.</p>
        `;
        break;
      case "update":
        subject = `Booking Updated: ${booking_title}`;
        message = `
          <h1>Booking Updated</h1>
          <p>Hello ${user_name},</p>
          <p>Your booking for <strong>${booking_title}</strong> has been updated.</p>
          <p><strong>Room:</strong> ${room_name}</p>
          <p><strong>New Date & Time:</strong> ${formatDateTime(start_time)} - ${formatDateTime(end_time)}</p>
          <p>If you did not make this change, please contact support.</p>
        `;
        break;
      case "cancellation":
        subject = `Booking Cancelled: ${booking_title}`;
        message = `
          <h1>Booking Cancelled</h1>
          <p>Hello ${user_name},</p>
          <p>Your booking for <strong>${booking_title}</strong> has been cancelled.</p>
          <p><strong>Room:</strong> ${room_name}</p>
          <p><strong>Date & Time:</strong> ${formatDateTime(start_time)} - ${formatDateTime(end_time)}</p>
          <p>If you did not cancel this booking, please contact support.</p>
        `;
        break;
      default:
        subject = `Booking Notification: ${booking_title}`;
        message = `
          <h1>Booking Notification</h1>
          <p>Hello ${user_name},</p>
          <p>This is a notification regarding your booking for <strong>${booking_title}</strong>.</p>
          <p><strong>Room:</strong> ${room_name}</p>
          <p><strong>Date & Time:</strong> ${formatDateTime(start_time)} - ${formatDateTime(end_time)}</p>
        `;
    }

    // Here, you would call an email service with these details
    console.log(`Email Subject: ${subject}`);
    console.log(`Email Message: ${message}`);
    console.log(`Recipient: ${user_email}`);

    // For the MVP, we'll just return success without actually sending emails
    // In a production environment, integrate with an email service here

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email notification (${type}) would be sent to ${user_email}` 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error("Error in send-booking-email function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

// Start the Deno server
serve(handler);
