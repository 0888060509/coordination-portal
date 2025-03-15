
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Monitor,
  Wifi,
  Coffee,
  Search,
  Video,
  CalendarClock,
} from "lucide-react";

// Mock room data
const roomsData = [
  {
    id: "1",
    name: "Imagination Room",
    capacity: 12,
    location: "Floor 3, West Wing",
    features: ["Video Conferencing", "Whiteboard", "Coffee Machine"],
    description: "A spacious room with panoramic city views, perfect for creative brainstorming sessions.",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "2",
    name: "Innovation Lab",
    capacity: 8,
    location: "Floor 2, North Wing",
    features: ["Video Conferencing", "Whiteboard", "Projector"],
    description: "A technology-focused room equipped with the latest presentation tools.",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "3",
    name: "Strategy Room",
    capacity: 16,
    location: "Floor 5, Executive Suite",
    features: ["Video Conferencing", "Interactive Display", "Coffee Machine", "Catering Available"],
    description: "Our largest conference room with executive amenities for important meetings.",
    status: "booked",
    imageUrl: "https://images.unsplash.com/photo-1573167507387-6b4b98cb7c13?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "4",
    name: "Creativity Room",
    capacity: 6,
    location: "Floor 1, East Wing",
    features: ["Whiteboard", "Comfortable Seating", "Natural Lighting"],
    description: "A cozy, informal space designed to inspire creative thinking.",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "5",
    name: "Focus Pod",
    capacity: 4,
    location: "Floor 4, Quiet Zone",
    features: ["Sound Insulation", "Video Conferencing", "Whiteboard"],
    description: "A small meeting room designed for focused discussions with minimal distractions.",
    status: "maintenance",
    imageUrl: "https://images.unsplash.com/photo-1416339442236-8ceb164046f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "6",
    name: "Collaboration Space",
    capacity: 10,
    location: "Floor 2, Central Area",
    features: ["Modular Furniture", "Interactive Display", "Whiteboard"],
    description: "An adaptable space that can be configured for various meeting styles.",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
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

const RoomsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Filter rooms based on search and filters
  const filteredRooms = roomsData.filter((room) => {
    const matchesSearch = searchTerm === "" || 
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCapacity = capacityFilter === "" || 
      (capacityFilter === "small" && room.capacity <= 6) ||
      (capacityFilter === "medium" && room.capacity > 6 && room.capacity <= 12) ||
      (capacityFilter === "large" && room.capacity > 12);
    
    const matchesStatus = statusFilter === "" || room.status === statusFilter;
    
    return matchesSearch && matchesCapacity && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meeting Rooms</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and book available meeting spaces
          </p>
        </div>
        <Button
          onClick={() => navigate("/bookings")}
          className="bg-meeting-primary hover:bg-blue-600"
        >
          <CalendarClock className="h-4 w-4 mr-2" />
          Book a Room
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search rooms..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={capacityFilter} onValueChange={setCapacityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Capacity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Capacity</SelectItem>
            <SelectItem value="small">Small (1-6 people)</SelectItem>
            <SelectItem value="medium">Medium (7-12 people)</SelectItem>
            <SelectItem value="large">Large (13+ people)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Room Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <Card
              key={room.id}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={room.imageUrl}
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{room.name}</CardTitle>
                  <Badge className={statusColors[room.status]}>
                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription>{room.location}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <Users className="h-4 w-4" />
                  <span>Capacity: {room.capacity} people</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {room.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {room.features.slice(0, 3).map((feature, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="flex items-center gap-1 text-xs"
                    >
                      {featureIcons[feature] || <Monitor className="h-3 w-3" />}
                      {feature}
                    </Badge>
                  ))}
                  {room.features.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{room.features.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/rooms/${room.id}`)}
                  >
                    Details
                  </Button>
                  <Button
                    className="flex-1 bg-meeting-secondary hover:bg-teal-600"
                    disabled={room.status !== "available"}
                    onClick={() =>
                      room.status === "available"
                        ? navigate(`/bookings?roomId=${room.id}`)
                        : null
                    }
                  >
                    {room.status === "available" ? "Book" : "Unavailable"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No rooms found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsPage;
