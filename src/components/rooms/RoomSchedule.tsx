
import React from 'react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatTime } from '@/utils/dateUtils';

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  booking_id?: string;
}

interface RoomScheduleProps {
  timeSlots: TimeSlot[];
  date: Date;
  onSlotClick?: (slot: TimeSlot) => void;
}

const RoomSchedule = ({
  timeSlots,
  date,
  onSlotClick,
}: RoomScheduleProps) => {
  // Group time slots by hour for better display
  const groupedSlots: { [hour: string]: TimeSlot[] } = {};
  
  timeSlots.forEach((slot) => {
    const startTime = new Date(slot.start_time);
    const hour = startTime.getHours();
    const hourKey = `${hour}`;
    
    if (!groupedSlots[hourKey]) {
      groupedSlots[hourKey] = [];
    }
    
    groupedSlots[hourKey].push(slot);
  });
  
  const handleSlotClick = (slot: TimeSlot) => {
    if (onSlotClick && slot.is_available) {
      onSlotClick(slot);
    }
  };
  
  return (
    <div className="space-y-2 w-full">
      <div className="p-2 bg-muted rounded-md font-semibold text-center">
        Schedule for {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>
      
      {Object.entries(groupedSlots).map(([hour, slots]) => (
        <div key={hour} className="mb-2">
          <div className="font-medium mb-1">
            {new Date(slots[0].start_time).toLocaleTimeString('en-US', {
              hour: 'numeric',
              hour12: true,
            })}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <div
                key={slot.start_time}
                className={cn(
                  "p-2 rounded-md border w-[80px] text-center cursor-pointer transition-all",
                  slot.is_available 
                    ? "bg-primary/10 border-primary/20 hover:scale-105 hover:shadow-sm" 
                    : "bg-destructive/10 border-destructive/20 cursor-not-allowed"
                )}
                onClick={() => handleSlotClick(slot)}
                title={slot.is_available ? 'Available' : 'Booked'}
              >
                <div className="text-sm font-medium">
                  {formatTime(slot.start_time)}
                </div>
                <Badge
                  variant={slot.is_available ? "default" : "destructive"}
                  className="text-xs"
                >
                  {slot.is_available ? 'Free' : 'Taken'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {Object.keys(groupedSlots).length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          No time slots available for this date.
        </div>
      )}
    </div>
  );
};

export default RoomSchedule;
