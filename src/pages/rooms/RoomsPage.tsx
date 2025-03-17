
import React, { useState, useEffect } from 'react';
import { getRooms } from '@/services/roomService';
import RoomList from '@/components/rooms/RoomList';
import RoomFilters from '@/components/rooms/RoomFilters';
import RoomSearch from '@/components/rooms/RoomSearch';
import { useQuery } from '@tanstack/react-query';
import { Amenity } from '@/types/room';
import { RoomProvider } from '@/context/RoomContext';

const RoomsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterParams, setFilterParams] = useState({
    capacity: 0,
    location: '_all',
    amenities: [] as string[],
    date: null,
    timeRange: { start: '', end: '' },
  });
  const [locations, setLocations] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  // Fetch room data with filtering
  const { data: rooms = [], isLoading, error } = useQuery({
    queryKey: ['rooms', filterParams],
    queryFn: () => getRooms({ 
      capacity: filterParams.capacity > 0 ? filterParams.capacity : undefined,
      location: filterParams.location !== '_all' ? filterParams.location : undefined,
      amenities: filterParams.amenities.length > 0 ? filterParams.amenities : undefined,
      date: filterParams.date,
      startTime: filterParams.timeRange.start || undefined,
      endTime: filterParams.timeRange.end || undefined
    }),
  });

  // Extract unique locations and amenities for filters
  useEffect(() => {
    if (rooms.length > 0) {
      const uniqueLocations = [...new Set(rooms.map(r => r.location))];
      setLocations(uniqueLocations);
      
      const allAmenities: Amenity[] = [];
      rooms.forEach(room => {
        if (room.amenities) {
          room.amenities.forEach(amenity => {
            if (!allAmenities.some(a => a.id === amenity.id)) {
              allAmenities.push(amenity);
            }
          });
        }
      });
      setAmenities(allAmenities);
    }
  }, [rooms]);

  // Filter rooms based on search query
  const filteredRooms = React.useMemo(() => {
    if (!searchQuery) return rooms;
    
    return rooms.filter(room => 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [rooms, searchQuery]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilterParams(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const handleToggleAmenity = (amenityId: string) => {
    setFilterParams(prev => {
      const amenities = [...prev.amenities];
      const index = amenities.indexOf(amenityId);
      
      if (index >= 0) {
        amenities.splice(index, 1);
      } else {
        amenities.push(amenityId);
      }
      
      return {
        ...prev,
        amenities
      };
    });
  };

  const handleResetFilters = () => {
    setFilterParams({
      capacity: 0,
      location: '_all',
      amenities: [],
      date: null,
      timeRange: { start: '', end: '' },
    });
  };

  const handleViewTypeChange = (type: 'grid' | 'list') => {
    setViewType(type);
  };

  return (
    <RoomProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between mb-8">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">Meeting Rooms</h1>
          <RoomSearch onSearchChange={handleSearchChange} />
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/4">
            <RoomFilters />
          </div>
          
          <div className="lg:w-3/4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 p-4 bg-red-50 rounded-md">
                Error loading rooms: {(error as Error).message}
              </div>
            ) : (
              <RoomList rooms={filteredRooms} isLoading={isLoading} />
            )}
          </div>
        </div>
      </div>
    </RoomProvider>
  );
};

export default RoomsPage;
