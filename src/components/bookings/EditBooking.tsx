
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { format, addHours, parse } from "date-fns";
import { toast } from "sonner";
import { Building, Users, Clock, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { getBookingById, updateBooking } from "@/services/bookingService";
import { getRoomById } from "@/services/roomService";
import { BookingWithDetails } from "@/types/booking";
import { Room } from "@/types/room";
import { useAuth } from "@/context/AuthContext";

const EditBooking: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [tab, setTab] = useState("details");

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm({
    defaultValues: {
      title: "",
      description: "",
      attendees: [],
      equipment_needed: [],
      special_requests: "",
      meeting_type: "general",
    }
  });

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) return;
      
      try {
        setIsLoading(true);
        const fetchedBooking = await getBookingById(bookingId);
        
        if (!fetchedBooking) {
          toast.error("Booking not found");
          navigate("/bookings");
          return;
        }
        
        // Check if the current user is the booking owner
        if (user && fetchedBooking.user_id !== user.id && !user.role === "admin") {
          toast.error("You don't have permission to edit this booking");
          navigate("/bookings");
          return;
        }
        
        setBooking(fetchedBooking);
        
        // Fetch room details
        const fetchedRoom = await getRoomById(fetchedBooking.room_id);
        setRoom(fetchedRoom);
        
        // Setup form values
        reset({
          title: fetchedBooking.title,
          description: fetchedBooking.description || "",
          attendees: fetchedBooking.attendees || [],
          equipment_needed: fetchedBooking.equipment_needed || [],
          special_requests: fetchedBooking.special_requests || "",
          meeting_type: fetchedBooking.meeting_type || "general",
        });
        
        // Setup date and time
        const bookingDate = new Date(fetchedBooking.start_time);
        setDate(bookingDate);
        setStartTime(format(bookingDate, "HH:mm"));
        setEndTime(format(new Date(fetchedBooking.end_time), "HH:mm"));
        
      } catch (error) {
        console.error("Error fetching booking details:", error);
        toast.error("Failed to load booking details");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [bookingId, navigate, user, reset]);

  const onSubmit = async (data: any) => {
    if (!booking || !date || !startTime || !endTime) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare date objects
      const startDateTime = parse(`${format(date, "yyyy-MM-dd")} ${startTime}`, "yyyy-MM-dd HH:mm", new Date());
      const endDateTime = parse(`${format(date, "yyyy-MM-dd")} ${endTime}`, "yyyy-MM-dd HH:mm", new Date());
      
      // Check if end time is after start time
      if (endDateTime <= startDateTime) {
        toast.error("End time must be after start time");
        setIsSubmitting(false);
        return;
      }
      
      const updateData = {
        ...data,
        start_time: startDateTime,
        end_time: endDateTime,
      };

      const success = await updateBooking(booking.id, updateData);
      
      if (success) {
        toast.success("Booking updated successfully");
        navigate("/bookings");
      } else {
        toast.error("Failed to update booking");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("An error occurred while updating the booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking || !room) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-6">
              <h3 className="text-lg font-medium">Booking not found</h3>
              <p className="text-muted-foreground mt-2">
                The booking you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button onClick={() => navigate("/bookings")} className="mt-4">
                Back to Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Edit Booking</h1>
          <p className="text-muted-foreground">
            Update your booking details for {room.name}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/bookings")}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">Meeting Details</TabsTrigger>
              <TabsTrigger value="time">Date & Time</TabsTrigger>
              <TabsTrigger value="attendees">Attendees & Resources</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <TabsContent value="details">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Meeting Title</Label>
                    <Input
                      id="title"
                      {...register("title", { required: "Title is required" })}
                      placeholder="Enter meeting title"
                      className="mt-1"
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive mt-1">{errors.title.message as string}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Enter meeting description"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="meeting_type">Meeting Type</Label>
                    <Select
                      value={booking.meeting_type || "general"}
                      onValueChange={(value) => setValue("meeting_type", value)}
                    >
                      <SelectTrigger id="meeting_type" className="mt-1">
                        <SelectValue placeholder="Select meeting type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Meeting</SelectItem>
                        <SelectItem value="client">Client Meeting</SelectItem>
                        <SelectItem value="team">Team Meeting</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="special_requests">Special Requests</Label>
                    <Textarea
                      id="special_requests"
                      {...register("special_requests")}
                      placeholder="Any special requests or setup requirements"
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="time">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <Label>Date</Label>
                      <div className="border rounded-md mt-1 p-0.5">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal mt-1"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP") : "Select a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={date}
                              onSelect={setDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="rounded-md bg-muted p-4 mt-4">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Room Availability</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          When you change the time, we'll automatically check if the room is still available.
                          If there's a conflict with another booking, you'll be notified before saving.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="attendees">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="attendees">Attendees (email addresses)</Label>
                    <Textarea
                      id="attendees"
                      {...register("attendees")}
                      placeholder="Enter email addresses, separated by commas"
                      rows={3}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter email addresses separated by commas. Attendees will receive updated booking notifications.
                    </p>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <Label htmlFor="equipment_needed">Equipment Needed</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="projector"
                          value="projector"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="projector" className="font-normal">Projector</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="videoconference"
                          value="videoconference"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="videoconference" className="font-normal">Video Conference System</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="whiteboard"
                          value="whiteboard"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="whiteboard" className="font-normal">Whiteboard</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="catering"
                          value="catering"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="catering" className="font-normal">Catering Service</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/bookings")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Booking"}
                </Button>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditBooking;
