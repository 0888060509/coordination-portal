
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Search } from 'lucide-react';
import { RoomFilterOptions } from '@/types/index';

// Generate time options for select inputs (8 AM to 9 PM)
const timeOptions = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 8;
  const formattedHour = hour.toString().padStart(2, '0');
  const displayHour = hour > 12 ? hour - 12 : hour;
  const period = hour >= 12 ? 'PM' : 'AM';
  return {
    value: `${formattedHour}:00`,
    label: `${displayHour}:00 ${period}`
  };
});

interface RoomSearchProps {
  onSearch: (filters: RoomFilterOptions) => void;
  isLoading: boolean;
}

const RoomSearch = ({ onSearch, isLoading }: RoomSearchProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [capacity, setCapacity] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSearch = () => {
    const filters: RoomFilterOptions = {
      capacity,
      searchQuery: searchQuery || undefined,
      date: selectedDate || undefined,
      startTime,
      endTime
    };
    onSearch(filters);
  };

  const handleReset = () => {
    setSelectedDate(new Date());
    setStartTime('09:00');
    setEndTime('10:00');
    setCapacity(undefined);
    setSearchQuery('');
    
    // Trigger search with reset values
    onSearch({
      date: new Date(),
      startTime: '09:00',
      endTime: '10:00'
    });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 mb-6">
      <h2 className="text-lg font-medium mb-4">Find Available Rooms</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Date picker */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Date</label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto">
              <Calendar
                mode="single"
                selected={selectedDate!}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setIsCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Time range */}
        <div className="md:col-span-2 space-y-1">
          <label className="text-sm font-medium">Time Range</label>
          <div className="flex gap-2 items-center">
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Start" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>-</span>
            <Select value={endTime} onValueChange={setEndTime}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="End" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Capacity */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Capacity</label>
          <Input
            type="number"
            min={1}
            placeholder="Min capacity"
            value={capacity || ''}
            onChange={(e) => setCapacity(e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>
        
        {/* Search query */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search rooms..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-4 gap-2">
        <Button variant="outline" onClick={handleReset} disabled={isLoading}>
          Reset
        </Button>
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search Rooms'}
        </Button>
      </div>
    </div>
  );
};

export default RoomSearch;
