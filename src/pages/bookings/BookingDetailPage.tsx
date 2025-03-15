
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  Clock, 
  Users, 
  DoorClosed, 
  MapPin, 
  Check,
  ArrowLeft,
  Trash,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data for bookings
const mockBookings = [
  {
    id: "1",
    title: "Team Weekly Sync",
    roomName: "Conference Room A",
    roomId: "room-1",
    date: new Date("2023-09-15T10:00:00"),
    endTime: new Date("2023-09-15T11:00:00"),
    description: "Weekly team sync to discuss project progress and roadblocks.",
    location: "Floor 3, East Wing",
    attendees: [
      { id: "user-1", name: "John Doe", email: "john@example.com", avatarUrl: "" },
      { id: "user-2", name: "Jane Smith", email: "jane@example.com", avatarUrl: "" },
      { id: "user-3", name: "Robert Johnson", email: "robert@example.com", avatarUrl: "" }
    ],
    createdBy: { id: "user-1", name: "John Doe", email: "john@example.com", avatarUrl: "" },
    status: "upcoming"
  },
  {
    id: "2",
    title: "Product Demo",
    roomName: "Meeting Room 101",
    roomId: "room-2",
    date: new Date("2023-09-16T14:00:00"),
    endTime: new Date("2023-09-16T15:30:00"),
    description: "Demonstration of the new product features to the client.",
    location: "Floor 2, West Wing",
    attendees: [
      { id: "user-1", name: "John Doe", email: "john@example.com", avatarUrl: "" },
      { id: "user-4", name: "Client X", email: "client@example.com", avatarUrl: "" },
      { id: "user-5", name: "Marketing Team", email: "marketing@example.com", avatarUrl: "" }
    ],
    createdBy: { id: "user-1", name: "John Doe", email: "john@example.com", avatarUrl: "" },
    status: "upcoming"
  }
];

const BookingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // Mock query for booking details
  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const foundBooking = mockBookings.find(b => b.id === id);
      if (!foundBooking) throw new Error("Booking not found");
      return foundBooking;
    }
  });

  const handleCancelBooking = () => {
    // Simulate cancellation
    console.log("Cancelling booking:", id);
    setCancelDialogOpen(false);
    navigate("/bookings");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <p>Loading booking details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
        <p className="text-muted-foreground mb-6">The booking you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate("/bookings")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Button>
      </div>
    );
  }

  const isPast = booking.date < new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/bookings")}
          className="w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Button>
        {!isPast && (
          <div className="flex space-x-2">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Cancel Booking
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Booking</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel this booking? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                    Keep Booking
                  </Button>
                  <Button variant="destructive" onClick={handleCancelBooking}>
                    Yes, Cancel Booking
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{booking.title}</CardTitle>
                  <CardDescription>
                    Created by {booking.createdBy.name}
                  </CardDescription>
                </div>
                {booking.status === "upcoming" ? (
                  <Badge>Upcoming</Badge>
                ) : (
                  <Badge variant="outline">Completed</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.description && (
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">{booking.description}</p>
                </div>
              )}
              
              <Separator />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Date</span>
                  </div>
                  <p className="font-medium">{format(booking.date, "PPP")}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Time</span>
                  </div>
                  <p className="font-medium">
                    {format(booking.date, "h:mm a")} - {format(booking.endTime, "h:mm a")}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <DoorClosed className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Room</span>
                  </div>
                  <p className="font-medium">{booking.roomName}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Location</span>
                  </div>
                  <p className="font-medium">{booking.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Attendees ({booking.attendees.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {booking.attendees.map((attendee) => (
                    <div key={attendee.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={attendee.avatarUrl} alt={attendee.name} />
                          <AvatarFallback>
                            {attendee.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{attendee.name}</p>
                          <p className="text-sm text-muted-foreground">{attendee.email}</p>
                        </div>
                      </div>
                      {attendee.id === booking.createdBy.id && (
                        <Badge variant="outline">Organizer</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted rounded-md overflow-hidden">
                {/* Room Image Placeholder */}
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Room Image
                </div>
              </div>
              
              <div>
                <h3 className="font-medium">{booking.roomName}</h3>
                <p className="text-sm text-muted-foreground">{booking.location}</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Video conferencing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Whiteboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Capacity: 8 people</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate(`/rooms/${booking.roomId}`)}
              >
                View Room Details
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailPage;
