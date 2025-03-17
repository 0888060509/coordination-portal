
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { 
  AlertCircle,
  Calendar,
  Clock,
  MapPin
} from "lucide-react";

import { bookingService } from "@/services/bookingService";
import { BookingWithDetails, CreateBookingData } from "@/types/booking";
import { parseTimeString } from "@/utils/formatUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// Define the form schema
const editBookingSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  date: z.date(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format" }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format" }),
  attendees: z.array(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    isExternal: z.boolean().default(false)
  })).optional(),
  equipment: z.array(z.string()).optional(),
  specialRequests: z.string().optional(),
});

type EditBookingFormValues = z.infer<typeof editBookingSchema>;

const EditBooking: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  
  const form = useForm<EditBookingFormValues>({
    resolver: zodResolver(editBookingSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      attendees: [],
      equipment: [],
      specialRequests: "",
    },
  });
  
  // Fetch booking data
  useEffect(() => {
    if (bookingId) {
      const fetchBooking = async () => {
        try {
          setLoading(true);
          const data = await bookingService.getBookingById(bookingId);
          
          if (!data) {
            throw new Error("Booking not found");
          }
          
          setBooking(data);
          
          // Set form default values
          const startTime = new Date(data.start_time);
          const endTime = new Date(data.end_time);
          
          form.reset({
            title: data.title,
            description: data.description || "",
            date: startTime,
            startTime: format(startTime, "HH:mm"),
            endTime: format(endTime, "HH:mm"),
            attendees: data.attendees || [],
            equipment: data.equipment_needed || [],
            specialRequests: data.special_requests || "",
          });
          
          setLoading(false);
        } catch (err: any) {
          setError(err.message || "Failed to load booking");
          setLoading(false);
        }
      };
      
      fetchBooking();
    }
  }, [bookingId, form]);
  
  // Check availability when form fields change
  const checkAvailability = async (formData: EditBookingFormValues) => {
    if (!booking) return;
    
    try {
      const startDateTime = parseTimeString(formData.startTime, formData.date);
      const endDateTime = parseTimeString(formData.endTime, formData.date);
      
      // Check if the time has actually changed
      const originalStart = new Date(booking.start_time).getTime();
      const originalEnd = new Date(booking.end_time).getTime();
      
      if (startDateTime.getTime() === originalStart && endDateTime.getTime() === originalEnd) {
        setIsAvailable(true);
        setAvailabilityChecked(true);
        return true;
      }
      
      const available = await bookingService.isRoomAvailable(
        booking.room_id,
        startDateTime,
        endDateTime,
        booking.id // Exclude current booking
      );
      
      setIsAvailable(available);
      setAvailabilityChecked(true);
      return available;
    } catch (err) {
      console.error("Error checking availability:", err);
      setIsAvailable(false);
      setAvailabilityChecked(true);
      return false;
    }
  };
  
  // Handle form submission
  const onSubmit = async (data: EditBookingFormValues) => {
    if (!booking) return;
    
    try {
      setIsSubmitting(true);
      
      // Check availability first
      const available = await checkAvailability(data);
      
      if (!available) {
        toast({
          variant: "destructive",
          title: "Room not available",
          description: "The room is not available during the selected time period.",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Create start and end date objects
      const startDateTime = parseTimeString(data.startTime, data.date);
      const endDateTime = parseTimeString(data.endTime, data.date);
      
      // Prepare booking data
      const bookingData: Partial<CreateBookingData> = {
        title: data.title,
        description: data.description,
        start_time: startDateTime,
        end_time: endDateTime,
        attendees: data.attendees?.map(a => a.id),
        equipment_needed: data.equipment,
        special_requests: data.specialRequests
      };
      
      // Update booking
      await bookingService.updateBooking(booking.id, bookingData);
      
      toast({
        title: "Booking updated",
        description: "Your booking has been updated successfully.",
      });
      
      // Redirect to bookings list
      navigate("/bookings");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update booking",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If loading, show skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full rounded-md" />
      </div>
    );
  }
  
  // If error, show error message
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // If booking not found, show error
  if (!booking) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Booking Not Found</AlertTitle>
        <AlertDescription>The booking you're trying to edit doesn't exist.</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Booking</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/40 p-4 rounded-md mb-6">
            <div className="flex items-center mb-2">
              <Building className="h-4 w-4 mr-2 text-muted-foreground" />
              <p className="font-semibold">{booking.room.name}</p>
            </div>
            <div className="flex items-center mb-2">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <p className="text-sm">
                {booking.room.location}
                {booking.room.floor ? `, Floor ${booking.room.floor}` : ""}
                {booking.room.room_number ? `, Room ${booking.room.room_number}` : ""}
              </p>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <p className="text-sm">Capacity: {booking.room.capacity} people</p>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter meeting title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter meeting description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <p>{format(field.value, "MMMM d, yyyy")}</p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setAvailabilityChecked(false);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setAvailabilityChecked(false);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {availabilityChecked && !isAvailable && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Room Not Available</AlertTitle>
                  <AlertDescription>
                    The room is not available during the selected time period.
                  </AlertDescription>
                </Alert>
              )}
              
              <Separator />
              
              <FormField
                control={form.control}
                name="specialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Requests</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special requirements for this booking?"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/bookings")}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={async () => {
                    const formData = form.getValues();
                    await checkAvailability(formData);
                  }}
                >
                  Check Availability
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Booking"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditBooking;
