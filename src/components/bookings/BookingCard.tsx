
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { BookingWithDetails } from "@/types/booking";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface BookingCardProps {
  booking: BookingWithDetails;
  onUpdate: () => void;
}

const BookingCard = ({ booking, onUpdate }: BookingCardProps) => {
  const navigate = useNavigate();
  
  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  
  const handleViewDetails = () => {
    navigate(`/bookings/${booking.id}`);
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base line-clamp-1">{booking.title}</CardTitle>
          <StatusBadge status={booking.status} />
        </div>
      </CardHeader>
      <CardContent className="pb-2 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">{booking.room.name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>{format(startTime, "MMMM d, yyyy")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>{format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Users className="h-4 w-4 flex-shrink-0" />
          <span>Capacity: {booking.room.capacity}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={handleViewDetails}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "confirmed":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Confirmed
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Cancelled
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          Completed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
  }
};

export default BookingCard;
