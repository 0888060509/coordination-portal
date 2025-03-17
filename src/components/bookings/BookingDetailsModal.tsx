
import { format } from "date-fns";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  UserCircle,
  Building
} from "lucide-react";
import { BookingWithDetails } from "@/types/booking";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingWithDetails | null;
  onCancelBooking: () => void;
}

const BookingDetailsModal = ({
  isOpen,
  onClose,
  booking,
  onCancelBooking,
}: BookingDetailsModalProps) => {
  // Add null check before accessing booking properties
  if (!booking) {
    return (
      <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Unable to load booking details
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  const isPastBooking = new Date() > endTime;
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{booking.title}</DialogTitle>
          <DialogDescription>
            Booking details for {booking.room.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Status badge */}
          <div className="mb-4">
            <Badge 
              variant={booking.status === "cancelled" ? "destructive" : isPastBooking ? "outline" : "default"}
              className={isPastBooking && booking.status !== "cancelled" ? "border-gray-400 text-gray-600" : ""}
            >
              {booking.status === "cancelled" ? "Cancelled" : 
               isPastBooking ? "Completed" : "Upcoming"}
            </Badge>
          </div>
          
          {/* Booking info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p>{format(startTime, "EEEE, MMMM d, yyyy")}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Time</p>
                <p>{format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}</p>
              </div>
            </div>

            <Separator />
            
            {/* Room info */}
            <div className="flex items-center">
              <Building className="h-5 w-5 mr-3 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Room</p>
                <p>{booking.room.name}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p>
                  {booking.room.location}
                  {booking.room.floor ? `, Floor ${booking.room.floor}` : ""}
                  {booking.room.room_number ? `, Room ${booking.room.room_number}` : ""}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-3 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Capacity</p>
                <p>{booking.room.capacity} people</p>
              </div>
            </div>

            <Separator />
            
            {/* Booking details */}
            <div className="flex items-center">
              <UserCircle className="h-5 w-5 mr-3 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Booked by</p>
                <p>{booking.user.first_name} {booking.user.last_name}</p>
              </div>
            </div>
            
            {booking.description && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm">{booking.description}</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {!isPastBooking && booking.status !== "cancelled" && (
            <Button variant="destructive" onClick={onCancelBooking}>
              Cancel Booking
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailsModal;
