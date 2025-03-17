
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addWeeks, 
  subWeeks,
  startOfDay,
  endOfDay,
  addHours,
  isBefore,
  isAfter,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import roomService from '@/services/roomService';
import { cn } from '@/lib/utils';

interface RoomAvailabilityCalendarProps {
  roomId: string;
  onDateSelect?: (date: Date) => void;
}

// Business hours
const BUSINESS_START_HOUR = 8; // 8 AM
const BUSINESS_END_HOUR = 18; // 6 PM

const RoomAvailabilityCalendar = ({
  roomId,
  onDateSelect
}: RoomAvailabilityCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');
  const [weekStartDate, setWeekStartDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Calculate the start and end dates for the current view
  const startDate = view === 'day' 
    ? startOfDay(selectedDate) 
    : startOfDay(weekStartDate);
  
  const endDate = view === 'day' 
    ? endOfDay(selectedDate) 
    : endOfDay(endOfWeek(weekStartDate, { weekStartsOn: 1 }));

  // Fetch availability data
  const { data: availabilityData, isLoading, error } = useQuery({
    queryKey: ['roomAvailability', roomId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () => roomService.getRoomAvailability(roomId, startDate, endDate),
  });

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      if (onDateSelect) {
        onDateSelect(date);
      }
    }
  };

  // Navigate to previous/next week
  const goToPreviousWeek = () => {
    setWeekStartDate(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setWeekStartDate(prev => addWeeks(prev, 1));
  };

  // Generate time slots for the day view
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = BUSINESS_START_HOUR; hour <= BUSINESS_END_HOUR; hour++) {
      const date = new Date(selectedDate);
      date.setHours(hour, 0, 0, 0);
      slots.push(date);
    }
    return slots;
  };

  // Generate days for the week view
  const generateWeekDays = () => {
    return eachDayOfInterval({
      start: weekStartDate,
      end: endOfWeek(weekStartDate, { weekStartsOn: 1 })
    });
  };

  // Check if a time slot is available
  const isTimeSlotAvailable = (date: Date) => {
    if (!availabilityData || !availabilityData.bookings) return true;
    
    // Convert the date to a timestamp for comparison
    const slotStart = date.getTime();
    const slotEnd = addHours(date, 1).getTime();
    
    // Check if there are any overlapping bookings
    return !availabilityData.bookings.some(booking => {
      const bookingStart = typeof booking.start_time === 'string' 
        ? parseISO(booking.start_time).getTime()
        : booking.start_time.getTime();
        
      const bookingEnd = typeof booking.end_time === 'string'
        ? parseISO(booking.end_time).getTime()
        : booking.end_time.getTime();
      
      return (
        (slotStart >= bookingStart && slotStart < bookingEnd) || // Slot starts during booking
        (slotEnd > bookingStart && slotEnd <= bookingEnd) || // Slot ends during booking
        (slotStart <= bookingStart && slotEnd >= bookingEnd) // Booking is within slot
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Room Availability</h2>
        <Tabs value={view} onValueChange={(v) => setView(v as 'day' | 'week')}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendar for date selection */}
        <div className="md:w-auto">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="rounded-md border pointer-events-auto"
          />
        </div>

        {/* Availability display */}
        <div className="flex-1">
          <Tabs value={view}>
            <TabsContent value="day" className="mt-0">
              <div className="rounded-md border">
                <div className="bg-muted p-3 text-center font-medium">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="p-4">
                  {isLoading ? (
                    <div className="flex justify-center p-8">
                      <LoadingSpinner size="md" showText text="Loading availability..." />
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center text-center p-8 text-red-500">
                      <AlertCircle className="h-8 w-8 mb-2" />
                      <p>Error loading availability data</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {generateTimeSlots().map((timeSlot, index) => {
                        const isAvailable = isTimeSlotAvailable(timeSlot);
                        return (
                          <div 
                            key={index}
                            className={cn(
                              "flex items-center p-3 rounded-md",
                              isAvailable 
                                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900" 
                                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900"
                            )}
                          >
                            <Clock className={cn(
                              "h-5 w-5 mr-3",
                              isAvailable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            )} />
                            <span className="font-medium">
                              {format(timeSlot, 'h:mm a')} - {format(addHours(timeSlot, 1), 'h:mm a')}
                            </span>
                            <span className={cn(
                              "ml-auto text-sm font-medium",
                              isAvailable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            )}>
                              {isAvailable ? 'Available' : 'Booked'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="week" className="mt-0">
              <div className="rounded-md border">
                <div className="bg-muted p-3 flex justify-between items-center">
                  <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium">
                    {format(weekStartDate, 'MMM d')} - {format(endOfWeek(weekStartDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                  </span>
                  <Button variant="ghost" size="sm" onClick={goToNextWeek}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <LoadingSpinner size="md" showText text="Loading availability..." />
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center text-center p-8 text-red-500">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>Error loading availability data</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 text-center">
                    {/* Week days header */}
                    {generateWeekDays().map((day, index) => (
                      <div key={index} className="p-2 font-medium border-b">
                        <div>{format(day, 'EEE')}</div>
                        <div className="text-sm">{format(day, 'd')}</div>
                      </div>
                    ))}
                    
                    {/* Week availability overview */}
                    {generateWeekDays().map((day, dayIndex) => {
                      // Create Date objects for the time slots
                      const morningDate = new Date(day);
                      morningDate.setHours(9, 0, 0, 0);
                      
                      const afternoonDate = new Date(day);
                      afternoonDate.setHours(13, 0, 0, 0);
                      
                      const eveningDate = new Date(day);
                      eveningDate.setHours(17, 0, 0, 0);
                      
                      const dayAvailability = {
                        morning: isTimeSlotAvailable(morningDate),
                        afternoon: isTimeSlotAvailable(afternoonDate),
                        evening: isTimeSlotAvailable(eveningDate)
                      };
                      
                      return (
                        <div 
                          key={dayIndex} 
                          className={cn(
                            "p-2 h-24 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20",
                            isSameDay(day, selectedDate) && "bg-blue-50 dark:bg-blue-900/20"
                          )}
                          onClick={() => handleDateSelect(day)}
                        >
                          <div className={cn(
                            "text-xs mb-1 p-1 rounded-sm",
                            dayAvailability.morning 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            AM: {dayAvailability.morning ? 'Free' : 'Busy'}
                          </div>
                          <div className={cn(
                            "text-xs mb-1 p-1 rounded-sm",
                            dayAvailability.afternoon 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            PM: {dayAvailability.afternoon ? 'Free' : 'Busy'}
                          </div>
                          <div className={cn(
                            "text-xs p-1 rounded-sm",
                            dayAvailability.evening 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            EVE: {dayAvailability.evening ? 'Free' : 'Busy'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default RoomAvailabilityCalendar;
