
import * as React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { format, setHours, setMinutes } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Users, Video, Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { bookingService } from "@/services/bookingService";
import { RoomWithAmenities } from "@/types/room";
import { useMediaQuery } from "@/hooks/use-media-query";

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

// Meeting types
const meetingTypes = [
  "Team Meeting",
  "Client Meeting", 
  "Interview",
  "Training",
  "Presentation",
  "Workshop",
  "Brainstorming",
  "Other"
];

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
  meetingType: z.string().optional(),
  specialRequests: z.string().optional(),
  requiresVideoConferencing: z.boolean().default(false),
  requiresRefreshments: z.boolean().default(false),
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
  const isMobile = useMediaQuery("(max-width: 640px)");

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      title: '',
      description: '',
      date: initialDate,
      startTime: initialStartTime,
      endTime: initialEndTime,
      meetingType: '',
      specialRequests: '',
      requiresVideoConferencing: false,
      requiresRefreshments: false
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
        endTime: initialEndTime,
        meetingType: '',
        specialRequests: '',
        requiresVideoConferencing: false,
        requiresRefreshments: false
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

      // Prepare special requests
      let specialRequests = data.specialRequests || '';
      if (data.requiresVideoConferencing) {
        specialRequests += '\nVideo conferencing required.';
      }
      if (data.requiresRefreshments) {
        specialRequests += '\nRefreshments required.';
      }

      // Create booking
      await bookingService.createBooking({
        room_id: room.id,
        user_id: user.id,
        title: data.title,
        description: data.description,
        meeting_type: data.meetingType,
        special_requests: specialRequests.trim(),
        start_time: startDateTime,
        end_time: endDateTime
      });

      toast({
        title: "Room booked successfully",
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
      <DialogContent 
        className={`${isMobile ? 'w-[95%] max-h-[85vh]' : 'sm:max-w-[600px] max-h-[90vh]'} p-4 sm:p-6 overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader className="sticky top-0 bg-background z-10 pb-2">
          <DialogTitle>Book {room.name}</DialogTitle>
          <DialogDescription className="sr-only">Book this room by filling out the form</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {/* Room details summary */}
            <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
              <p className="font-bold">{room.name}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-sm">{room.capacity} people</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-sm">
                    {watchDate && watchStartTime && watchEndTime ? 
                      `${format(watchDate, 'EEE, MMM d')} · ${watchStartTime} - ${watchEndTime}` : 
                      'Select date and time'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {room.amenities.map((amenity) => (
                  <Badge
                    key={amenity.id}
                    variant="outline"
                    className="flex items-center gap-1 text-xs"
                  >
                    {amenity.name}
                  </Badge>
                ))}
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

            {/* Meeting type */}
            <FormField
              control={form.control}
              name="meetingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meeting type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position={isMobile ? "popper" : "item-aligned"}>
                      {meetingTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-4'}`}>
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
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-auto p-0" 
                        align="start"
                        side={isMobile ? "bottom" : "bottom"}
                        sideOffset={5}
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time range */}
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

            {/* Special Requirements */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-medium">Special Requirements</h3>
              
              <div className="flex flex-col space-y-2">
                <FormField
                  control={form.control}
                  name="requiresVideoConferencing"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 sm:p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center">
                          <Video className="h-4 w-4 mr-2" />
                          Video Conferencing
                        </FormLabel>
                        <FormDescription>
                          Request video conferencing setup
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiresRefreshments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 sm:p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center">
                          <Coffee className="h-4 w-4 mr-2" />
                          Refreshments
                        </FormLabel>
                        <FormDescription>
                          Request refreshments for attendees
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="specialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Requests</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any other special requirements or notes"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="sticky bottom-0 pt-4 mt-6 sm:mt-4 bg-background gap-2">
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
