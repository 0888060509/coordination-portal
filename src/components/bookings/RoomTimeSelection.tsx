
import React, { useState, useEffect } from 'react';
import { useBookingContext } from '@/context/BookingContext';
import { useRooms, useAvailableRooms } from '@/hooks/useRooms';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getTimeSlots } from '@/utils/dateUtils';

const RoomTimeSelection = () => {
  const { state, updateFormData, setSelectedRoom, validateStep, nextStep } = useBookingContext();
  const { formData, validationErrors } = state;
  
  const [startDate, setStartDate] = useState<Date | null>(
    formData.start_time ? new Date(formData.start_time) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | null>(
    formData.end_time ? new Date(formData.end_time) : new Date()
  );
  const [startTime, setStartTime] = useState<string>(
    startDate ? format(startDate, 'HH:mm') : '09:00'
  );
  const [endTime, setEndTime] = useState<string>(
    endDate ? format(endDate, 'HH:mm') : '10:00'
  );
  
  // Query for all rooms (for dropdown)
  const { data: allRooms, isLoading: isLoadingRooms } = useRooms();
  
  // Generate time slots for selector
  const timeSlots = getTimeSlots(8, 18, 30);
  
  // Query for available rooms based on selected time
  const { data: availableRooms, isLoading: isCheckingAvailability } = useAvailableRooms(
    startDate || new Date(),
    endDate || new Date(),
    { capacity: 1 } // Minimum capacity filter
  );
  
  // Update date & time combinations in form
  useEffect(() => {
    if (startDate && startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const dateObj = new Date(startDate);
      dateObj.setHours(hours, minutes, 0, 0);
      updateFormData({ start_time: dateObj.toISOString() });
    }
    
    if (endDate && endTime) {
      const [hours, minutes] = endTime.split(':').map(Number);
      const dateObj = new Date(endDate);
      dateObj.setHours(hours, minutes, 0, 0);
      updateFormData({ end_time: dateObj.toISOString() });
    }
  }, [startDate, startTime, endDate, endTime, updateFormData]);
  
  const handleRoomChange = (value: string) => {
    updateFormData({ room_id: value });
    
    // Find the selected room object and update context
    if (allRooms) {
      const selectedRoom = allRooms.find((room) => room.id === value);
      if (selectedRoom) {
        setSelectedRoom(selectedRoom);
      }
    }
  };
  
  const handleNext = () => {
    if (validateStep(0)) {
      nextStep();
    }
  };
  
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                      validationErrors.start_time && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate || undefined}
                    onSelect={(date) => setStartDate(date)}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              
              <div className="pt-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Select
                  value={startTime}
                  onValueChange={setStartTime}
                >
                  <SelectTrigger 
                    id="start-time"
                    className={cn(
                      validationErrors.start_time && "border-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(slot => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {validationErrors.start_time && (
                <p className="text-sm text-destructive mt-1">{validationErrors.start_time}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground",
                      validationErrors.end_time && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate || undefined}
                    onSelect={(date) => setEndDate(date)}
                    initialFocus
                    disabled={(date) => date < (startDate || new Date())}
                  />
                </PopoverContent>
              </Popover>
              
              <div className="pt-2">
                <Label htmlFor="end-time">End Time</Label>
                <Select
                  value={endTime}
                  onValueChange={setEndTime}
                >
                  <SelectTrigger 
                    id="end-time"
                    className={cn(
                      validationErrors.end_time && "border-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(slot => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {validationErrors.end_time && (
                <p className="text-sm text-destructive mt-1">{validationErrors.end_time}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="room">Select Room</Label>
            <Select
              value={formData.room_id || ''}
              onValueChange={handleRoomChange}
              disabled={isLoadingRooms || !startDate || !endDate}
            >
              <SelectTrigger 
                id="room"
                className={cn(
                  validationErrors.room_id && "border-destructive"
                )}
              >
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name} (Capacity: {room.capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {validationErrors.room_id && (
              <p className="text-sm text-destructive mt-1">{validationErrors.room_id}</p>
            )}
            
            {isCheckingAvailability && startDate && endDate && (
              <p className="text-sm text-primary mt-1">
                Checking room availability...
              </p>
            )}
            
            {availableRooms && availableRooms.length === 0 && startDate && endDate && (
              <p className="text-sm text-destructive mt-1">
                No rooms available for the selected time. Please choose a different time.
              </p>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              disabled={isLoadingRooms || isCheckingAvailability}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomTimeSelection;
