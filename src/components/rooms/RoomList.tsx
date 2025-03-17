
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import roomService from '@/services/roomService';
import { RoomWithAmenities, Amenity, RoomFilterOptions } from '@/types/index';
import RoomSearch from './RoomSearch';
import RoomFilters from './RoomFilters';
import RoomCard from './RoomCard';
import LoadingSpinner from '@/components/ui/loading-spinner';

const RoomList = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomWithAmenities[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomWithAmenities[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  
  // Filter states
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('_all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  // Load rooms and filter options
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all amenities for filter
        const amenitiesData = await roomService.getAmenities();
        setAmenities(amenitiesData);
        
        // Fetch all locations for filter
        const locationsData = await roomService.getLocations();
        setLocations(locationsData);
        
        // Fetch rooms with initial filters
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
  }, []);

  // Handle search form submission
  const handleSearch = async (filters: RoomFilterOptions) => {
    try {
      setLoading(true);
      setSelectedDate(filters.date || null);
      setStartTime(filters.startTime || '09:00');
      setEndTime(filters.endTime || '10:00');
      
      const roomsData = await roomService.getRooms(filters);
      setRooms(roomsData);
      setFilteredRooms(roomsData);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to search rooms');
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = async (filters: Partial<RoomFilterOptions>) => {
    try {
      const newFilters: RoomFilterOptions = {
        date: selectedDate || undefined,
        startTime,
        endTime,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        location: selectedLocation !== '_all' ? selectedLocation : undefined,
        ...filters
      };
      
      // If we're just doing client-side filtering/sorting
      if (filters.sortBy) {
        let sortedRooms = [...filteredRooms];
        
        if (filters.sortBy === 'name') {
          sortedRooms.sort((a, b) => a.name.localeCompare(b.name));
        } else if (filters.sortBy === 'capacity') {
          sortedRooms.sort((a, b) => b.capacity - a.capacity);
        } else if (filters.sortBy === 'capacity_asc') {
          sortedRooms.sort((a, b) => a.capacity - b.capacity);
        }
        
        setFilteredRooms(sortedRooms);
        return;
      }
      
      // For location or amenity filtering
      if (filters.location !== undefined || filters.amenities !== undefined) {
        setLoading(true);
        
        if (filters.location !== undefined) {
          setSelectedLocation(filters.location || '_all');
        }
        
        if (filters.amenities !== undefined) {
          setSelectedAmenities(filters.amenities || []);
        }
        
        const roomsData = await roomService.getRooms(newFilters);
        setFilteredRooms(roomsData);
        
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to filter rooms');
      setLoading(false);
    }
  };

  // Toggle amenity selection
  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev => {
      if (prev.includes(amenityId)) {
        return prev.filter(id => id !== amenityId);
      } else {
        return [...prev, amenityId];
      }
    });
    
    // Update filters after state update
    setTimeout(() => {
      const updatedAmenities = selectedAmenities.includes(amenityId)
        ? selectedAmenities.filter(id => id !== amenityId)
        : [...selectedAmenities, amenityId];
        
      handleFilterChange({ amenities: updatedAmenities });
    }, 0);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedAmenities([]);
    setSelectedLocation('_all');
    
    // Re-fetch rooms with just date/time filters
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Meeting Rooms</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and book available meeting spaces
          </p>
        </div>
      </div>

      {/* Room search form */}
      <RoomSearch onSearch={handleSearch} isLoading={loading} />
      
      {/* Error message */}
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}
      
      {/* Room filters */}
      <RoomFilters 
        amenities={amenities}
        locations={locations}
        selectedAmenities={selectedAmenities}
        selectedLocation={selectedLocation}
        onFilterChange={handleFilterChange}
        onToggleAmenity={toggleAmenity}
        onResetFilters={resetFilters}
        viewType={viewType}
        onViewTypeChange={setViewType}
      />
      
      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <LoadingSpinner size="md" showText />
        </div>
      ) : (
        <>
          {/* Room count */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'} available
            </p>
          </div>
          
          {/* Room grid/list */}
          {filteredRooms.length > 0 ? (
            <div className={viewType === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
            }>
              {filteredRooms.map((room) => (
                <RoomCard 
                  key={room.id} 
                  room={room} 
                  date={selectedDate} 
                  startTime={startTime} 
                  endTime={endTime} 
                  viewType={viewType}
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
