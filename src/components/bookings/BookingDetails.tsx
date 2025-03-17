
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { BookingWithDetails } from '@/types/booking';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Clock, Calendar, Users, MapPin, FileText, CheckCircle, XCircle, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAvailableUsers } from '@/services/bookingService';

interface BookingDetailsProps {
  booking: BookingWithDetails;
  onEdit?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  showActions?: boolean;
}

const BookingDetails: React.FC<BookingDetailsProps> = ({
  booking,
  onEdit,
  onCancel,
  onClose,
  showActions = true,
}) => {
  const [attendeeDetails, setAttendeeDetails] = useState<any[]>([]);
  
  // Fetch all users to get attendee details
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => getAvailableUsers(),
    enabled: Boolean(booking?.attendees?.length),
  });
  
  // When users are loaded, match attendee IDs to get names and details
  useEffect(() => {
    if (users && booking.attendees) {
      const details = booking.attendees.map(attendeeId => {
        const user = users.find(u => u.id === attendeeId);
        return user || { id: attendeeId, first_name: 'Unknown', last_name: 'User' };
      });
      setAttendeeDetails(details);
    }
  }, [users, booking.attendees]);
  
  // Format the booking dates
  const formattedStartDate = booking.start_time 
    ? format(new Date(booking.start_time), 'PP')
    : 'N/A';
    
  const formattedStartTime = booking.start_time 
    ? format(new Date(booking.start_time), 'p')
    : 'N/A';
    
  const formattedEndTime = booking.end_time 
    ? format(new Date(booking.end_time), 'p')
    : 'N/A';
  
  // Determine the booking status badge
  const getStatusBadge = () => {
    switch (booking.status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">{booking.title}</CardTitle>
            <div className="mt-1 text-sm text-muted-foreground">
              Booked by {booking.user.first_name} {booking.user.last_name}
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Date and Time */}
        <div className="flex flex-col space-y-1.5">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-sm">{formattedStartDate}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-sm">{formattedStartTime} - {formattedEndTime}</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Room Information */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-medium">Room</h3>
          <div className="p-3 bg-secondary/50 rounded-md">
            <div className="flex">
              {booking.room.image_url && (
                <div className="shrink-0 mr-3">
                  <img 
                    src={booking.room.image_url} 
                    alt={booking.room.name} 
                    className="w-16 h-16 object-cover rounded-md"
                  />
                </div>
              )}
              <div>
                <div className="font-medium">{booking.room.name}</div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  {booking.room.location}
                  {booking.room.floor && <>, Floor {booking.room.floor}</>}
                </div>
                <div className="text-sm text-muted-foreground">
                  <Users className="w-3.5 h-3.5 inline-block mr-1" />
                  Capacity: {booking.room.capacity} people
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Description */}
        {booking.description && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-medium">Description</h3>
            <div className="flex items-start">
              <FileText className="w-4 h-4 mr-2 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground">{booking.description}</p>
            </div>
          </div>
        )}
        
        {/* Attendees */}
        {attendeeDetails && attendeeDetails.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-medium">Attendees</h3>
            <div className="flex flex-wrap gap-2">
              {attendeeDetails.map((attendee) => (
                <div key={attendee.id} className="flex items-center bg-secondary/50 px-2.5 py-1.5 rounded-full">
                  <Avatar className="h-5 w-5 mr-1.5">
                    <AvatarImage src={attendee.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {attendee.first_name ? attendee.first_name[0] : ''}
                      {attendee.last_name ? attendee.last_name[0] : ''}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{attendee.first_name} {attendee.last_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Equipment */}
        {booking.equipment_needed && booking.equipment_needed.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-medium">Equipment</h3>
            <div className="flex flex-wrap gap-2">
              {booking.equipment_needed.map((equipment, index) => (
                <Badge key={index} variant="outline" className="flex items-center">
                  <Package className="w-3 h-3 mr-1" />
                  {equipment}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Special Requests */}
        {booking.special_requests && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-medium">Special Requests</h3>
            <p className="text-sm text-muted-foreground">{booking.special_requests}</p>
          </div>
        )}
      </CardContent>
      
      {showActions && (
        <CardFooter className="flex justify-between gap-2">
          {onClose && (
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          )}
          
          <div className="flex gap-2 flex-1">
            {booking.status === 'confirmed' && onCancel && (
              <Button variant="destructive" onClick={onCancel} className="flex-1">
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
            
            {booking.status === 'confirmed' && onEdit && (
              <Button onClick={onEdit} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default BookingDetails;
