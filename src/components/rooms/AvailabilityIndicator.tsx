
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addMinutes, differenceInMinutes } from 'date-fns';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import bookingService from '@/services/bookingService';

interface AvailabilityIndicatorProps {
  roomId: string;
  startTime?: Date;
  endTime?: Date;
  showNextAvailable?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const AvailabilityIndicator: React.FC<AvailabilityIndicatorProps> = ({
  roomId,
  startTime,
  endTime,
  showNextAvailable = false,
  className,
  size = 'md'
}) => {
  const [realTimeStatus, setRealTimeStatus] = useState<'available' | 'unavailable' | 'checking'>('checking');
  const [subscription, setSubscription] = useState<{ unsubscribe: () => void } | null>(null);

  // Default to current time if not provided
  const effectiveStartTime = startTime || new Date();
  const effectiveEndTime = endTime || addMinutes(effectiveStartTime, 60);

  // Query for availability check
  const { data: isAvailable, isLoading, error, refetch } = useQuery({
    queryKey: ['roomAvailability', roomId, effectiveStartTime.toISOString(), effectiveEndTime.toISOString()],
    queryFn: () => bookingService.isRoomAvailable(roomId, effectiveStartTime, effectiveEndTime),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query for next available slots if needed
  const { data: availableSlots } = useQuery({
    queryKey: ['roomAvailableSlots', roomId, effectiveStartTime.toISOString()],
    queryFn: () => bookingService.findAvailableTimeSlots(
      roomId, 
      effectiveStartTime, 
      8, // business start hour
      18, // business end hour
      30 // 30-minute slots
    ),
    enabled: showNextAvailable && isAvailable === false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Find the next available slot
  const nextAvailableSlot = React.useMemo(() => {
    if (!availableSlots || availableSlots.length === 0) return null;
    return availableSlots.find(slot => slot.isAvailable);
  }, [availableSlots]);

  // Update realTimeStatus based on query result
  useEffect(() => {
    if (isLoading) {
      setRealTimeStatus('checking');
    } else if (error) {
      setRealTimeStatus('unavailable');
    } else {
      setRealTimeStatus(isAvailable ? 'available' : 'unavailable');
    }
  }, [isAvailable, isLoading, error]);

  // Set up real-time subscription
  useEffect(() => {
    if (!roomId) return;

    // Subscribe to booking changes
    const sub = bookingService.subscribeToBookingChanges(roomId, () => {
      // When a booking changes, refetch the availability
      refetch();
    });

    setSubscription(sub);

    // Cleanup subscription on unmount
    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [roomId, refetch]);

  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Icon sizes
  const iconSizes = {
    sm: { width: 14, height: 14 },
    md: { width: 16, height: 16 },
    lg: { width: 18, height: 18 },
  };

  // Status badge
  const renderStatusBadge = () => {
    if (realTimeStatus === 'checking') {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
          <Clock className={`mr-1 animate-pulse`} width={iconSizes[size].width} height={iconSizes[size].height} />
          Checking...
        </Badge>
      );
    }

    if (realTimeStatus === 'available') {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="mr-1" width={iconSizes[size].width} height={iconSizes[size].height} />
          Available
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
        <XCircle className="mr-1" width={iconSizes[size].width} height={iconSizes[size].height} />
        Unavailable
      </Badge>
    );
  };

  // Next available slot
  const renderNextAvailable = () => {
    if (!showNextAvailable || realTimeStatus !== 'unavailable' || !nextAvailableSlot) {
      return null;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mt-2 text-xs cursor-help border-t pt-1 border-dashed border-gray-200 dark:border-gray-700">
              <span className="flex items-center text-blue-600 dark:text-blue-400">
                <Clock className="mr-1" width={iconSizes.sm.width} height={iconSizes.sm.height} />
                Next available: {format(nextAvailableSlot.startTime, 'h:mm a')}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Available from {format(nextAvailableSlot.startTime, 'h:mm a')} to {format(nextAvailableSlot.endTime, 'h:mm a')}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Duration info
  const renderDuration = () => {
    if (!startTime || !endTime) return null;
    
    const duration = differenceInMinutes(endTime, startTime);
    
    return (
      <div className={`text-gray-500 dark:text-gray-400 ${sizeClasses[size]}`}>
        Duration: {duration} min
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center">
        {renderStatusBadge()}
        {startTime && endTime && (
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
          </span>
        )}
      </div>
      {renderDuration()}
      {renderNextAvailable()}
    </div>
  );
};

export default AvailabilityIndicator;
