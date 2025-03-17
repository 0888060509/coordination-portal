
import { BookingWithDetails } from "@/types/booking";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Calendar } from "lucide-react";
import { format, parseISO, isPast, isFuture } from "date-fns";
import { useNavigate } from "react-router-dom";
import { formatTimeRange } from "@/utils/formatUtils";

interface TodayBookingsProps {
  bookings: BookingWithDetails[];
  title?: string;
  description?: string;
}

export function TodayBookings({ 
  bookings,
  title = "Today's Meetings",
  description = "Your scheduled meetings for today"
}: TodayBookingsProps) {
  const navigate = useNavigate();
  const now = new Date();
  
  // Sort bookings by start time
  const sortedBookings = [...bookings].sort((a, b) => 
    parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
  );
  
  // Determine booking status
  const getBookingStatus = (booking: BookingWithDetails) => {
    const startTime = parseISO(booking.start_time);
    const endTime = parseISO(booking.end_time);
    
    if (isPast(endTime)) {
      return { 
        label: 'Completed', 
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' 
      };
    } else if (isPast(startTime) && isFuture(endTime)) {
      return { 
        label: 'In Progress', 
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
      };
    } else {
      return { 
        label: 'Upcoming', 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
      };
    }
  };

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
            <p className="text-gray-500 mb-4">No meetings scheduled for today</p>
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
          {sortedBookings.map((booking) => {
            const status = getBookingStatus(booking);
            
            return (
              <div
                key={booking.id}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                onClick={() => navigate(`/bookings/${booking.id}`)}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-gray-900 dark:text-white line-clamp-1">
                    {booking.title}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {booking.room.name}
                </div>
                
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatTimeRange(booking.start_time, booking.end_time)}</span>
                  </div>
                  
                  {booking.room.location && (
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{booking.room.location}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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

export default TodayBookings;
