
import * as React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { format, setHours, setMinutes } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { bookingService } from "@/services/bookingService";
import { RoomWithAmenities } from "@/types/room";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomWithAmenities;
  initialDate: Date;
  initialStartTime: string;
  initialEndTime: string;
}

// Parse time string (HH:MM) to Date object
const parseTimeString = (timeString: string, baseDate: Date): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return setMinutes(setHours(new Date(baseDate), hours), minutes);
};

// Create validation schema
const bookingSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().optional(),
  date: z.date().min(new Date(new Date().setHours(0, 0, 0, 0)), { 
    message: 'Date cannot be in the past' 
  }),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Invalid time format'
  }),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Invalid time format'
  }),
}).refine((data) => {
  const startDateTime = parseTimeString(data.startTime, data.date);
  const endDateTime = parseTimeString(data.endTime, data.date);
  return startDateTime < endDateTime;
}, {
  message: "End time must be after start time",
  path: ['endTime'],
}).refine((data) => {
  const now = new Date();
  const startDateTime = parseTimeString(data.startTime, data.date);
  return startDateTime > now || data.date.getDate() !== now.getDate();
}, {
  message: "Start time cannot be in the past",
  path: ['startTime'],
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  room,
  initialDate,
  initialStartTime,
  initialEndTime
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      title: '',
      description: '',
      date: initialDate,
      startTime: initialStartTime,
      endTime: initialEndTime
    }
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      form.reset({
        title: '',
        description: '',
        date: initialDate,
        startTime: initialStartTime,
        endTime: initialEndTime
      });
    }
  }, [isOpen, form, initialDate, initialStartTime, initialEndTime]);

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

      // Create booking
      await bookingService.createBooking({
        room_id: room.id,
        user_id: user.id,
        title: data.title,
        description: data.description,
        start_time: startDateTime,
        end_time: endDateTime
      });

      toast({
        title: "Room booked",
        description: `You have successfully booked ${room.name}`,
      });

      onClose();
      navigate('/bookings');
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

  // Watch date and time values for summary display
  const watchDate = form.watch('date');
  const watchStartTime = form.watch('startTime');
  const watchEndTime = form.watch('endTime');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Book {room.name}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Room details summary */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
              <p className="font-bold">{room.name}</p>
              <div className="mt-1">
                <span className="mr-2">Capacity:</span>
                <span>{room.capacity} people</span>
              </div>
              <div className="mt-1">
                <span className="mr-2">Location:</span>
                <span>{room.location}{room.floor ? `, Floor ${room.floor}` : ''}</span>
              </div>
            </div>

            {/* Booking title */}
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

            {/* Booking description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
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

            {/* Date picker */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
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
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Time summary */}
            {watchDate && watchStartTime && watchEndTime && (
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                <p className="text-sm">
                  {format(watchDate, 'EEEE, MMMM d, yyyy')} from {watchStartTime} to {watchEndTime}
                </p>
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Booking..." : "Book Room"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
