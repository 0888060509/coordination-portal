
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { RoomWithAmenities } from "@/types/room";
import { BookingWithDetails, CreateBookingData } from "@/types/booking";
import bookingService from "@/services/bookingService";
import notificationService from "@/services/notificationService";
import MeetingDetailsForm from "./MeetingDetailsForm";
import AttendeesForm from "./AttendeesForm";
import BookingReview from "./BookingReview";
import BookingConfirmation from "./BookingConfirmation";
import { parseTimeString } from "@/utils/formatUtils";

interface BookingFormProps {
  room: RoomWithAmenities;
  initialDate: Date;
  initialStartTime: string;
  initialEndTime: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Define the form schema for all steps collectively
const bookingFormSchema = z.object({
  // Step 1: Date and Time (pre-filled)
  date: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  
  // Step 2: Meeting Details
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  meetingType: z.string().optional(),
  
  // Step 3: Attendees and Resources
  attendees: z.array(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    isExternal: z.boolean().default(false)
  })).optional(),
  externalAttendees: z.array(z.string().email()).optional(),
  equipment: z.array(z.string()).optional(),
  specialRequests: z.string().optional(),
  
  // Step 4: Review
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const BookingForm: React.FC<BookingFormProps> = ({
  room,
  initialDate,
  initialStartTime,
  initialEndTime,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<BookingWithDetails | null>(null);
  
  // Initialize the form with react-hook-form and zod resolver
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      date: initialDate,
      startTime: initialStartTime,
      endTime: initialEndTime,
      title: "",
      description: "",
      meetingType: "regular",
      attendees: [],
      externalAttendees: [],
      equipment: [],
      specialRequests: "",
      termsAccepted: false
    }
  });
  
  const totalSteps = 4;
  
  const nextStep = () => {
    const fieldsToValidate = currentStep === 1 
      ? ["date", "startTime", "endTime"]
      : currentStep === 2 
        ? ["title", "description", "meetingType"] 
        : currentStep === 3
          ? ["attendees", "equipment", "specialRequests"]
          : ["termsAccepted"];
    
    form.trigger(fieldsToValidate as any).then((isValid) => {
      if (isValid) {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      }
    });
  };
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const onSubmit = async (data: BookingFormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to book a room",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create start and end date objects
      const startDateTime = parseTimeString(data.startTime, data.date);
      const endDateTime = parseTimeString(data.endTime, data.date);
      
      // Prepare booking data
      const bookingData: CreateBookingData = {
        room_id: room.id,
        user_id: user.id,
        title: data.title,
        description: data.description,
        start_time: startDateTime,
        end_time: endDateTime,
        attendees: data.attendees?.map(a => a.id),
        meeting_type: data.meetingType,
        equipment_needed: data.equipment,
        special_requests: data.specialRequests
      };
      
      // Create booking
      const bookingId = await bookingService.createBooking(bookingData);
      
      // Fetch the created booking with details
      const bookingDetails = await bookingService.getBookingById(bookingId);
      
      if (bookingDetails) {
        // Send booking confirmation notification
        await notificationService.sendBookingConfirmation(bookingId);
        
        // Set created booking and mark as complete
        setCreatedBooking(bookingDetails);
        setBookingComplete(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Booking failed",
        description: error.message || "Failed to book the room",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render the confirmation screen if booking is complete
  if (bookingComplete && createdBooking) {
    return (
      <BookingConfirmation 
        booking={createdBooking} 
        onClose={onSuccess}
      />
    );
  }
  
  // Render current step form
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Step 1: Confirm Date and Time</h2>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
              <div className="font-semibold">Selected Room: {room.name}</div>
              <div>Location: {room.location}{room.floor ? `, Floor ${room.floor}` : ''}</div>
              <div>Capacity: {room.capacity} people</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <div className="p-2 border rounded-md">
                  {format(form.getValues('date'), 'PPPP')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  className="w-full p-2 border rounded-md"
                  {...form.register('startTime')}
                />
                {form.formState.errors.startTime && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.startTime.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input
                  type="time"
                  className="w-full p-2 border rounded-md"
                  {...form.register('endTime')}
                />
                {form.formState.errors.endTime && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.endTime.message}</p>
                )}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <MeetingDetailsForm 
            form={form} 
            formErrors={form.formState.errors}
          />
        );
      case 3:
        return (
          <AttendeesForm 
            form={form} 
            formErrors={form.formState.errors}
          />
        );
      case 4:
        return (
          <BookingReview 
            form={form} 
            room={room}
            formErrors={form.formState.errors}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Book {room.name}</CardTitle>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 mt-4 rounded-full">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </CardHeader>
      <CardContent>
        <form id="booking-form" onSubmit={form.handleSubmit(onSubmit)}>
          {renderStep()}
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        {currentStep > 1 ? (
          <Button 
            type="button" 
            variant="outline" 
            onClick={prevStep}
            disabled={isSubmitting}
          >
            Previous
          </Button>
        ) : (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        
        {currentStep < totalSteps ? (
          <Button 
            type="button" 
            onClick={nextStep}
            disabled={isSubmitting}
          >
            Next
          </Button>
        ) : (
          <Button 
            type="submit"
            form="booking-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Booking..." : "Confirm Booking"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default BookingForm;
