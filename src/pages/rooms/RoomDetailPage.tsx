
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  MapPin,
  Monitor,
  Wifi,
  Coffee,
  Video,
  CalendarClock,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { roomService } from "@/services/roomService";
import { bookingService } from "@/services/bookingService";
import BookingModal from "@/components/bookings/BookingModal";
import { RoomWithAmenities } from "@/types/room";
import { Booking } from "@/types/booking";
import { useAuth } from "@/context/AuthContext";

// Feature icon mapping
const featureIcons: Record<string, JSX.Element> = {
  "Video Conferencing": <Video className="h-4 w-4" />,
  "Whiteboard": <Monitor className="h-4 w-4" />,
  "Coffee Machine": <Coffee className="h-4 w-4" />,
  "Wifi": <Wifi className="h-4 w-4" />,
  "Interactive Display": <Monitor className="h-4 w-4" />,
  "Catering Available": <Coffee className="h-4 w-4" />,
  "Comfortable Seating": <Users className="h-4 w-4" />,
  "Natural Lighting": <Monitor className="h-4 w-4" />,
  "Sound Insulation": <Monitor className="h-4 w-4" />,
  "Modular Furniture": <Monitor className="h-4 w-4" />,
  "Projector": <Monitor className="h-4 w-4" />,
};

// Status badge colors
const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  booked: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  maintenance: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

const RoomDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Query for room details
  const { data: room, isLoading: isLoadingRoom } = useQuery({
    queryKey: ["room", id],
    queryFn: () => id ? roomService.getRoomById(id) : Promise.reject("No room ID provided"),
    enabled: !!id
  });

  // Query for upcoming bookings for this room
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["roomBookings", id],
    queryFn: () => {
      if (!id) return Promise.reject("No room ID provided");
      // Get bookings for next 7 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      return bookingService.getRoomBookings(id, startDate, endDate);
    },
    enabled: !!id
  });

  const handleBookRoom = () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book a room",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    setIsBookingModalOpen(true);
  };

  if (isLoadingRoom) {
    return (
      <div className="flex justify-center py-12">
        <p>Loading room details...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
        <p className="text-gray-600 mb-6">The room you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate("/rooms")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rooms
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Button
        variant="ghost"
        onClick={() => navigate("/rooms")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Rooms
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={room.image_url || "https://images.unsplash.com/photo-1517502884422-41eaead166d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"}
                alt={room.name}
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader>
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <CardTitle className="text-2xl">{room.name}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {room.location}
                  </CardDescription>
                </div>
                <Badge className={statusColors['available']}>
                  Available
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {room.description || "No description available"}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Features & Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {room.amenities && room.amenities.map((amenity) => (
                    <Badge
                      key={amenity.id}
                      variant="secondary"
                      className="flex items-center gap-1 py-1.5"
                    >
                      {featureIcons[amenity.name] || <Monitor className="h-4 w-4" />}
                      {amenity.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-meeting-secondary hover:bg-teal-600"
                onClick={handleBookRoom}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Book This Room
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
              <CardDescription>
                View all scheduled meetings for this room
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBookings ? (
                <div className="text-center py-4">Loading bookings...</div>
              ) : bookings && bookings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meeting</TableHead>
                      <TableHead>Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                      >
                        <TableCell className="font-medium">
                          {booking.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-gray-500" />
                            {format(new Date(booking.start_time), "MMM d, h:mm a")}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No upcoming bookings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Users className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="font-medium">{room.capacity} people</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pb-2 border-b">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{room.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pb-2 border-b">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Current Status</p>
                  <p className="font-medium capitalize">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/bookings")}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                View All Bookings
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/rooms")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Rooms List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {isBookingModalOpen && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          room={room}
          initialDate={new Date()}
          initialStartTime=""
          initialEndTime=""
        />
      )}
    </div>
  );
};

export default RoomDetailPage;
