
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  Users, 
  DoorClosed,
  ChevronRight 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

// Mock data for bookings
const mockBookings = [
  {
    id: "1",
    title: "Team Weekly Sync",
    roomName: "Conference Room A",
    date: new Date("2023-09-15T10:00:00"),
    endTime: new Date("2023-09-15T11:00:00"),
    attendees: ["John Doe", "Jane Smith", "Robert Johnson"],
    status: "upcoming"
  },
  {
    id: "2",
    title: "Product Demo",
    roomName: "Meeting Room 101",
    date: new Date("2023-09-16T14:00:00"),
    endTime: new Date("2023-09-16T15:30:00"),
    attendees: ["John Doe", "Client X", "Marketing Team"],
    status: "upcoming"
  },
  {
    id: "3",
    title: "Interview: Senior Developer",
    roomName: "Small Room B",
    date: new Date("2023-09-14T11:00:00"),
    endTime: new Date("2023-09-14T12:00:00"),
    attendees: ["HR Manager", "Tech Lead", "Department Head"],
    status: "completed"
  },
  {
    id: "4",
    title: "Quarterly Planning",
    roomName: "Conference Room A",
    date: new Date("2023-09-20T09:00:00"),
    endTime: new Date("2023-09-20T16:00:00"),
    attendees: ["Executive Team", "Department Heads", "Project Managers"],
    status: "upcoming"
  },
  {
    id: "5",
    title: "Client Meeting: Project Kickoff",
    roomName: "Meeting Room 102",
    date: new Date("2023-09-18T13:00:00"),
    endTime: new Date("2023-09-18T14:00:00"),
    attendees: ["Project Manager", "Designer", "Developer", "Client"],
    status: "upcoming"
  }
];

const BookingsPage = () => {
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");
  
  // Mock query for bookings
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockBookings;
    }
  });

  const filteredBookings = bookings?.filter(booking => 
    filter === "all" || booking.status === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">
            Manage your room bookings and appointments
          </p>
        </div>
        <Button asChild>
          <Link to="/rooms">
            Book a Room
          </Link>
        </Button>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button 
          variant={filter === "upcoming" ? "default" : "outline"}
          onClick={() => setFilter("upcoming")}
        >
          Upcoming
        </Button>
        <Button 
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
        >
          Past
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Bookings</CardTitle>
          <CardDescription>
            {filter === "all" 
              ? "All your bookings" 
              : filter === "upcoming" 
                ? "Your upcoming bookings" 
                : "Your past bookings"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <p>Loading bookings...</p>
            </div>
          ) : filteredBookings?.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No bookings found</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {filteredBookings?.map((booking) => (
                  <div key={booking.id} className="group">
                    <Link to={`/bookings/${booking.id}`}>
                      <div className="rounded-lg border p-3 group-hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col md:flex-row justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{booking.title}</h3>
                              {booking.status === "upcoming" ? (
                                <Badge>Upcoming</Badge>
                              ) : (
                                <Badge variant="outline">Completed</Badge>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{format(booking.date, "PPP")}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {format(booking.date, "h:mm a")} - {format(booking.endTime, "h:mm a")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DoorClosed className="h-4 w-4" />
                                <span>{booking.roomName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{booking.attendees.length} attendees</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center mt-2 md:mt-0">
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </Link>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingsPage;
