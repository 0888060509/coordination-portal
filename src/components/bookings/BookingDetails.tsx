
import React from "react";
import { format } from "date-fns";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  UserCircle,
  Building,
  Mail,
  Clipboard,
  Check,
  X
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface BookingDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingWithDetails;
  onEdit: () => void;
  onCancel: () => void;
}

const BookingDetails = ({
  isOpen,
  onClose,
  booking,
  onEdit,
  onCancel,
}: BookingDetailsProps) => {
  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  const isPastBooking = new Date() > endTime;
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{booking.title}</DialogTitle>
          <DialogDescription>
            Booking details for {booking.room.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
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
          
          {/* Room image if available */}
          {booking.room.image_url && (
            <div className="w-full">
              <AspectRatio ratio={16 / 9}>
                <img 
                  src={booking.room.image_url} 
                  alt={booking.room.name} 
                  className="rounded-md object-cover w-full h-full" 
                />
              </AspectRatio>
            </div>
          )}
          
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
            
            {/* Organizer details */}
            <div className="flex items-center">
              <UserCircle className="h-5 w-5 mr-3 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Booked by</p>
                <p>{booking.user.first_name} {booking.user.last_name}</p>
              </div>
            </div>
            
            {/* Attendees */}
            {booking.attendees && booking.attendees.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Attendees</p>
                <div className="flex flex-wrap gap-2">
                  {booking.attendees.map((attendee, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{attendee.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Resources/Equipment */}
            {booking.equipment_needed && booking.equipment_needed.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Resources</p>
                <div className="flex flex-wrap gap-2">
                  {booking.equipment_needed.map((equipment, index) => (
                    <Badge key={index} variant="outline" className="bg-muted">
                      <Check className="h-3 w-3 mr-1" /> {equipment}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Meeting details */}
            {booking.description && (
              <div className="mt-4">
                <div className="flex items-start">
                  <Clipboard className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm whitespace-pre-line">{booking.description}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Special requests */}
            {booking.special_requests && (
              <div className="mt-4">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Special Requests</p>
                    <p className="text-sm whitespace-pre-line">{booking.special_requests}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          
          {!isPastBooking && booking.status !== "cancelled" && (
            <>
              <Button variant="default" onClick={onEdit}>
                Edit Booking
              </Button>
              <Button variant="destructive" onClick={onCancel}>
                Cancel Booking
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetails;
