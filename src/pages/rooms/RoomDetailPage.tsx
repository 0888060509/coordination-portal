
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

// Mock room data - This would typically come from an API
const roomsData = [
  {
    id: "1",
    name: "Imagination Room",
    capacity: 12,
    location: "Floor 3, West Wing",
    features: ["Video Conferencing", "Whiteboard", "Coffee Machine", "Wifi", "Natural Lighting"],
    description: "A spacious room with panoramic city views, perfect for creative brainstorming sessions. The room is equipped with all the necessary technology for productive meetings, including a high-definition video conferencing system and digital whiteboard. The comfortable seating arrangement can be reconfigured for various meeting styles.",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
    upcomingBookings: [
      {
        id: "b1",
        title: "Product Design Workshop",
        organizer: "Sarah Johnson",
        start: new Date(new Date().setHours(14, 0)),
        end: new Date(new Date().setHours(16, 0)),
      },
      {
        id: "b2",
        title: "Q4 Planning",
        organizer: "Michael Roberts",
        start: new Date(new Date().setDate(new Date().getDate() + 1)),
        end: new Date(new Date().setDate(new Date().getDate() + 1)),
      },
    ],
  },
];

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

  // Find room by id
  const room = roomsData.find((r) => r.id === id);

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
                src={room.imageUrl}
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
                <Badge className={statusColors[room.status]}>
                  {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {room.description}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Features & Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {room.features.map((feature, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 py-1.5"
                    >
                      {featureIcons[feature] || <Monitor className="h-4 w-4" />}
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-meeting-secondary hover:bg-teal-600"
                disabled={room.status !== "available"}
                onClick={() =>
                  room.status === "available"
                    ? navigate(`/bookings?roomId=${room.id}`)
                    : null
                }
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                {room.status === "available" ? "Book This Room" : "Unavailable"}
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
              {room.upcomingBookings && room.upcomingBookings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meeting</TableHead>
                      <TableHead>Organizer</TableHead>
                      <TableHead>Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {room.upcomingBookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                      >
                        <TableCell className="font-medium">
                          {booking.title}
                        </TableCell>
                        <TableCell>{booking.organizer}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-gray-500" />
                            {format(booking.start, "MMM d, h:mm a")}
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
                <div
                  className={`h-3 w-3 rounded-full ${
                    room.status === "available"
                      ? "bg-green-500"
                      : room.status === "booked"
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                />
                <div>
                  <p className="text-sm text-gray-500">Current Status</p>
                  <p className="font-medium capitalize">{room.status}</p>
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
    </div>
  );
};

export default RoomDetailPage;
