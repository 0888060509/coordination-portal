import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { getRoomAvailability } from '@/services/roomService';

interface AvailabilityIndicatorProps {
  roomId: string;
  startDate: Date;
  endDate: Date;
}

const AvailabilityIndicator: React.FC<AvailabilityIndicatorProps> = ({
  roomId,
  startDate,
  endDate,
}) => {
  const [availability, setAvailability] = useState<{ available: boolean; conflictingBookings?: any[] }>({ available: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAvailability = async () => {
      setIsLoading(true);
      try {
        const result = await getRoomAvailability(roomId, startDate, endDate);
        setAvailability(result);
      } catch (error) {
        console.error('Error checking room availability:', error);
        setAvailability({ available: false });
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailability();
  }, [roomId, startDate, endDate]);

  if (isLoading) {
    return <Badge variant="secondary">Checking...</Badge>;
  }

  if (availability.available) {
    return (
      <Badge className="bg-green-500">
        <CheckCircle className="mr-2 h-4 w-4" />
        Available
      </Badge>
    );
  } else {
    const startTime = availability.conflictingBookings && availability.conflictingBookings.length > 0
      ? format(new Date(availability.conflictingBookings[0].start_time), 'h:mm a')
      : 'N/A';
    const endTime = availability.conflictingBookings && availability.conflictingBookings.length > 0
      ? format(new Date(availability.conflictingBookings[0].end_time), 'h:mm a')
      : 'N/A';

    return (
      <Badge variant="destructive">
        <XCircle className="mr-2 h-4 w-4" />
        Booked {startTime} - {endTime}
      </Badge>
    );
  }
};

export default AvailabilityIndicator;
