
import { BookingWithDetails } from "@/types/booking";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

interface UpcomingBookingsProps {
  bookings: BookingWithDetails[];
  title?: string;
  description?: string;
}

export function UpcomingBookings({ 
  bookings,
  title = "Upcoming Meetings",
  description = "Your scheduled meetings"
}: UpcomingBookingsProps) {
  const navigate = useNavigate();

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-500 mb-4">No upcoming meetings scheduled</p>
            <Button 
              onClick={() => navigate("/bookings")}
              className="bg-meeting-secondary hover:bg-teal-600"
            >
              Book a Room
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
              onClick={() => navigate(`/bookings/${booking.id}`)}
            >
              <div className="w-10 h-10 rounded-full bg-meeting-primary flex items-center justify-center text-white font-medium mr-3 flex-shrink-0">
                {booking.title.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {booking.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {booking.room.name} • {format(parseISO(booking.start_time), 'MMM d, h:mm a')} - {format(parseISO(booking.end_time), 'h:mm a')}
                </p>
                <div className="flex items-center mt-1">
                  <Users className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    Organized by {booking.user.first_name} {booking.user.last_name}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => navigate("/bookings")}
          >
            View All Meetings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
