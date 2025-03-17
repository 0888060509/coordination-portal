
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getRoomAvailability } from '@/services/roomService';
import { AvailabilityCheckResult } from '@/types/room.service';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AvailabilityIndicatorProps {
  roomId: string;
  date: Date;
  startTime?: string;
  endTime?: string;
}

const AvailabilityIndicator: React.FC<AvailabilityIndicatorProps> = ({
  roomId,
  date,
  startTime = '08:00',
  endTime = '18:00'
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [availability, setAvailability] = useState<{ available: boolean; conflictingBookings?: any[] }>({
    available: false
  });

  useEffect(() => {
    if (!roomId) return;

    const checkAvailability = async () => {
      setIsLoading(true);
      try {
        // Create date objects for the start and end of the day
        const start = new Date(date);
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        start.setHours(startHours, startMinutes, 0, 0);
        
        const end = new Date(date);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        end.setHours(endHours, endMinutes, 0, 0);
        
        // Get availability for the specified time range
        const availabilityData: AvailabilityCheckResult = await getRoomAvailability(roomId, start, end);
        
        setAvailability({
          available: availabilityData.is_available,
          conflictingBookings: availabilityData.conflicting_bookings
        });
      } catch (error) {
        console.error('Error checking room availability:', error);
        setAvailability({ available: false });
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailability();
  }, [roomId, date, startTime, endTime]);

  if (isLoading) {
    return <LoadingSpinner size="sm" />;
  }

  return (
    <div className="flex items-center">
      {availability.available ? (
        <>
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span>Available</span>
        </>
      ) : (
        <>
          <XCircle className="h-5 w-5 text-red-500 mr-2" />
          <span>
            {availability.conflictingBookings && availability.conflictingBookings.length > 0 
              ? `Booked (${availability.conflictingBookings.length} ${
                  availability.conflictingBookings.length === 1 ? 'booking' : 'bookings'
                })`
              : 'Unavailable'
            }
          </span>
        </>
      )}
    </div>
  );
};

export default AvailabilityIndicator;
