
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { getRoomAvailability } from '@/services/roomService';
import { AvailabilityCheckResult } from '@/types/room.service';

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
  const [availability, setAvailability] = useState<AvailabilityCheckResult>({ 
    is_available: false,
    conflicting_bookings: [] 
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAvailability = async () => {
      setIsLoading(true);
      try {
        const result = await getRoomAvailability(roomId, startDate, endDate);
        setAvailability(result);
      } catch (error) {
        console.error('Error checking room availability:', error);
        setAvailability({ is_available: false, conflicting_bookings: [] });
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailability();
  }, [roomId, startDate, endDate]);

  if (isLoading) {
    return <Badge variant="secondary">Checking...</Badge>;
  }

  if (availability.is_available) {
    return (
      <Badge className="bg-green-500">
        <CheckCircle className="mr-2 h-4 w-4" />
        Available
      </Badge>
    );
  } else {
    const startTime = availability.conflicting_bookings && availability.conflicting_bookings.length > 0
      ? format(new Date(availability.conflicting_bookings[0].start_time), 'h:mm a')
      : 'N/A';
    const endTime = availability.conflicting_bookings && availability.conflicting_bookings.length > 0
      ? format(new Date(availability.conflicting_bookings[0].end_time), 'h:mm a')
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
