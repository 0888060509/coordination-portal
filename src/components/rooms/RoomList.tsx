import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Search,
  Filter,
  CalendarIcon,
  Clock,
  MapPin,
} from 'lucide-react';
import { roomService, RoomFilterOptions } from '@/services/roomService';
import { RoomWithAmenities, Amenity } from '@/types/room';
import RoomCard from './RoomCard';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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

interface RoomListProps {
  showBookingPrompt?: boolean;
}

const RoomList = ({ showBookingPrompt = false }: RoomListProps) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomWithAmenities[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomWithAmenities[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [capacity, setCapacity] = useState<number | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const amenitiesData = await roomService.getAmenities();
        setAmenities(amenitiesData);
        
        const locationsData = await roomService.getLocations();
        setLocations(locationsData);
        
        const filters: RoomFilterOptions = {
          date: selectedDate || undefined,
          startTime,
          endTime
        };
        
        const roomsData = await roomService.getRooms(filters);
        setRooms(roomsData);
        setFilteredRooms(roomsData);
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load rooms');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedDate, startTime, endTime]);

  const applyFilters = async () => {
    try {
      setLoading(true);
      
      const filters: RoomFilterOptions = {
        capacity: capacity,
        location: selectedLocation || undefined,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        searchQuery: searchQuery || undefined,
        date: selectedDate || undefined,
        startTime,
        endTime
      };
      
      const filteredRoomsData = await roomService.getRooms(filters);
      setFilteredRooms(filteredRoomsData);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to filter rooms');
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedAmenities([]);
    setSelectedLocation('');
    setCapacity(undefined);
    setSelectedDate(new Date());
    setStartTime('09:00');
    setEndTime('10:00');
    setIsCalendarOpen(false);
    
    const fetchRooms = async () => {
      try {
        setLoading(true);
        
        const filters: RoomFilterOptions = {
          date: selectedDate || undefined,
          startTime,
          endTime
        };
        
        const roomsData = await roomService.getRooms(filters);
        setFilteredRooms(roomsData);
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to reset filters');
        setLoading(false);
      }
    };
    
    fetchRooms();
  };

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev => {
      if (prev.includes(amenityId)) {
        return prev.filter(id => id !== amenityId);
      } else {
        return [...prev, amenityId];
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meeting Rooms</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and book available meeting spaces
          </p>
        </div>
        
        <div className="flex gap-2 lg:hidden w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search rooms..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Filter Rooms</DrawerTitle>
                <DrawerDescription>
                  Find the perfect room for your meeting
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 py-2 space-y-4">
                <div className="space-y-2">
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
                    <PopoverContent className="w-auto p-0">
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
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Time</label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
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
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time</label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
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
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="all-locations" value="_all">All locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Minimum Capacity</label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Enter minimum capacity"
                    value={capacity || ''}
                    onChange={(e) => setCapacity(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amenities</label>
                  <div className="space-y-2">
                    {amenities.map((amenity) => (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`amenity-${amenity.id}`}
                          checked={selectedAmenities.includes(amenity.id)}
                          onCheckedChange={() => toggleAmenity(amenity.id)}
                        />
                        <label 
                          htmlFor={`amenity-${amenity.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {amenity.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DrawerFooter>
                <Button onClick={() => {
                  applyFilters();
                }}>
                  Apply Filters
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <div className="hidden lg:grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
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
            <PopoverContent className="w-auto p-0">
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
        
        <div className="space-y-1">
          <label className="text-sm font-medium">Time</label>
          <div className="flex gap-2 items-center">
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger>
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
              <SelectTrigger>
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
        
        <div className="space-y-1">
          <label className="text-sm font-medium">Location</label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger>
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all-locations-desktop" value="_all">All locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={`desktop-${location}`} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
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
        
        <div className="space-y-1">
          <label className="text-sm font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search rooms..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
        </div>
        
        <div className="col-span-full flex justify-end gap-2">
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
          <Button onClick={applyFilters}>
            Apply Filters
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                Amenities
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Filter by Amenities</h4>
                  <p className="text-sm text-muted-foreground">
                    Select the amenities you need for your meeting
                  </p>
                </div>
                <div className="grid gap-2">
                  {amenities.map((amenity) => (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`desktop-amenity-${amenity.id}`}
                        checked={selectedAmenities.includes(amenity.id)}
                        onCheckedChange={() => toggleAmenity(amenity.id)}
                      />
                      <label 
                        htmlFor={`desktop-amenity-${amenity.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {amenity.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <p>Loading rooms...</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'} available
              {selectedDate && ` on ${format(selectedDate, 'MMMM d, yyyy')}`}
              {startTime && endTime && ` from ${startTime} to ${endTime}`}
            </p>
          </div>
          
          {filteredRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room) => (
                <RoomCard 
                  key={room.id} 
                  room={room} 
                  date={selectedDate}
                  startTime={startTime}
                  endTime={endTime}
                  showBookingPrompt={showBookingPrompt}
                />
              ))}
            </div>
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No rooms found</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search or filters
              </p>
              <Button className="mt-4" variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RoomList;
