
import React from 'react';
import { format } from 'date-fns';
import { BookingWithDetails } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Calendar, ExternalLink, Edit, XCircle } from 'lucide-react';

interface BookingsListProps {
  bookings: BookingWithDetails[];
  onViewDetails: (booking: BookingWithDetails) => void;
  onEdit?: (booking: BookingWithDetails) => void;
  onCancel?: (booking: BookingWithDetails) => void;
}

const BookingsList: React.FC<BookingsListProps> = ({
  bookings,
  onViewDetails,
  onEdit,
  onCancel,
}) => {
  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            No bookings found.
          </CardContent>
        </Card>
      ) : (
        bookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {booking.title}
              </CardTitle>
              <Badge variant={booking.status === 'cancelled' ? 'destructive' : 'secondary'}>
                {booking.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-1.5 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>{format(new Date(booking.start_time), 'PPP')}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>{format(new Date(booking.start_time), 'p')} - {format(new Date(booking.end_time), 'p')}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>{booking.room?.name || 'Unknown Room'}, {booking.room?.location || 'Unknown Location'}</span>
                </div>
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground">
                {booking.description || 'No description provided'}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => onViewDetails(booking)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Details
              </Button>
              <div className="flex gap-2">
                {onEdit && new Date(booking.start_time) > new Date() && booking.status !== 'cancelled' && (
                  <Button onClick={() => onEdit(booking)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {onCancel && new Date(booking.start_time) > new Date() && booking.status !== 'cancelled' && (
                  <Button variant="destructive" onClick={() => onCancel(booking)}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
};

export default BookingsList;
