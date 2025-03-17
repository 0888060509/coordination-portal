
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Check, ArrowRight, Clock, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookingWithDetails } from '@/types/booking';
import CalendarIntegration from './CalendarIntegration';

interface BookingConfirmationProps {
  booking: BookingWithDetails;
  onClose?: () => void;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ booking, onClose }) => {
  const navigate = useNavigate();
  
  const handleViewBooking = () => {
    navigate(`/bookings/${booking.id}`);
    if (onClose) onClose();
  };
  
  const handleBackToDashboard = () => {
    navigate('/dashboard');
    if (onClose) onClose();
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-0">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
        <p className="text-muted-foreground mt-2">
          Your booking reference: <span className="font-mono font-medium">{booking.id.substring(0, 8)}</span>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{booking.title}</h3>
          {booking.description && (
            <p className="text-muted-foreground text-sm">{booking.description}</p>
          )}
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {format(new Date(booking.start_time), 'PPPP')} at {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
            </span>
          </div>
          
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {booking.room.name}, {booking.room.location}
              {booking.room.floor && `, Floor ${booking.room.floor}`}
            </span>
          </div>
          
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Capacity: {booking.room.capacity} people</span>
          </div>
        </div>
        
        <Separator />
        
        <CalendarIntegration booking={booking} />
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          className="w-full sm:w-1/2"
          onClick={handleBackToDashboard}
        >
          Back to Dashboard
        </Button>
        <Button 
          className="w-full sm:w-1/2"
          onClick={handleViewBooking}
        >
          View Booking <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BookingConfirmation;
