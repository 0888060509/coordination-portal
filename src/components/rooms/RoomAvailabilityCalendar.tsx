
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, startOfDay, addDays, isToday, isSameDay } from 'date-fns';
import { getRoomAvailability } from '@/services/roomService';
import { AvailabilityCheckResult } from '@/types/room.service';
import LoadingSpinner from '@/components/ui/loading-spinner';
import AvailabilityIndicator from './AvailabilityIndicator';

interface RoomAvailabilityCalendarProps {
  roomId: string;
  onDateSelect?: (date: Date) => void;
}

const RoomAvailabilityCalendar: React.FC<RoomAvailabilityCalendarProps> = ({ 
  roomId,
  onDateSelect 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityCheckResult | null>(null);
  const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);

  // Load availability data for the selected date
  useEffect(() => {
    const fetchAvailability = async () => {
      setIsLoading(true);
      try {
        const startDate = startOfDay(selectedDate);
        const endDate = view === 'day' ? addDays(startDate, 1) : addDays(startDate, 7);
        
        const data = await getRoomAvailability(roomId, startDate, endDate);
        setAvailabilityData(data);
        
        // Generate time slots from 8 AM to 6 PM
        generateTimeSlots(data);
      } catch (error) {
        console.error('Error fetching room availability:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAvailability();
  }, [roomId, selectedDate, view]);

  // Generate time slots for the selected date
  const generateTimeSlots = (availabilityData: AvailabilityCheckResult | null) => {
    if (!availabilityData) return;

    const slots: { time: string; available: boolean }[] = [];
    const startHour = 8; // 8 AM
    const endHour = 18; // 6 PM
    const interval = 30; // 30 minutes
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotAvailable = isTimeSlotAvailable(hour, minute, availabilityData);
        slots.push({ time: timeStr, available: slotAvailable });
      }
    }
    
    setTimeSlots(slots);
  };

  // Check if a specific time slot is available
  const isTimeSlotAvailable = (hour: number, minute: number, availabilityData: AvailabilityCheckResult): boolean => {
    if (!availabilityData.is_available || !availabilityData.conflicting_bookings) {
      return availabilityData.is_available;
    }
    
    // Create date objects for the slot start and end
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hour, minute, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);
    
    // Check against each conflicting booking
    return !availabilityData.conflicting_bookings.some(booking => {
      const bookingStart = typeof booking.start_time === 'string' 
        ? parseISO(booking.start_time).getTime()
        : new Date(booking.start_time).getTime();
        
      const bookingEnd = typeof booking.end_time === 'string'
        ? parseISO(booking.end_time).getTime()
        : new Date(booking.end_time).getTime();
      
      // Convert dates to milliseconds for comparison
      const slotStartMs = slotStart.getTime();
      const slotEndMs = slotEnd.getTime();
      
      return (
        (slotStartMs >= bookingStart && slotStartMs < bookingEnd) || // Slot starts during booking
        (slotEndMs > bookingStart && slotEndMs <= bookingEnd) || // Slot ends during booking
        (slotStartMs <= bookingStart && slotEndMs >= bookingEnd) // Slot contains booking
      );
    });
  };

  // Calculate the date display string based on the view
  const getDateDisplayString = () => {
    if (view === 'day') {
      return format(selectedDate, 'MMMM d, yyyy');
    } else {
      const endDate = addDays(selectedDate, 6);
      return `${format(selectedDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="day" onValueChange={(value) => setView(value as 'day' | 'week')}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
            <span className="text-sm font-medium">{getDateDisplayString()}</span>
          </div>
          
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && handleDayClick(date)}
                className="border rounded-md"
                disabled={date => date < startOfDay(new Date())}
                modifiersClassNames={{
                  today: "bg-primary text-primary-foreground",
                  selected: "bg-primary text-primary-foreground",
                }}
              />
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Today's Status</h3>
                {isLoading ? <LoadingSpinner /> : (
                  <AvailabilityIndicator 
                    roomId={roomId} 
                    date={isToday(selectedDate) ? selectedDate : new Date()} 
                  />
                )}
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <TabsContent value="day" className="mt-0">
                <div className="space-y-2">
                  <h3 className="font-medium">Time Slots</h3>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                      {timeSlots.map((slot, index) => (
                        <div 
                          key={index}
                          className={`p-2 text-center rounded border ${
                            slot.available 
                              ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900'
                              : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900'
                          }`}
                        >
                          <span className="text-sm">{slot.time}</span>
                          <Badge 
                            variant={slot.available ? "outline" : "destructive"}
                            className="text-xs w-full mt-1"
                          >
                            {slot.available ? 'Available' : 'Booked'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="week" className="mt-0">
                <div className="space-y-4">
                  {/* We could implement a week view here with a daily summary */}
                  <h3 className="font-medium">Week Overview</h3>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                        const date = addDays(selectedDate, dayOffset);
                        return (
                          <div key={dayOffset} className="flex items-center p-2 border rounded">
                            <div className="flex-1">
                              <div className="font-medium">{format(date, 'EEEE')}</div>
                              <div className="text-sm text-muted-foreground">{format(date, 'MMM d')}</div>
                            </div>
                            {isSameDay(date, selectedDate) && availabilityData ? (
                              <Badge variant={availabilityData.is_available ? "outline" : "destructive"}>
                                {availabilityData.is_available ? 'Available' : 'Partially Booked'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Select to view</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RoomAvailabilityCalendar;
