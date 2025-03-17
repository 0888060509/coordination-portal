
import React, { useState, useEffect } from 'react';
import { getRooms } from '@/services/roomService';
import RoomList from '@/components/rooms/RoomList';
import RoomFilters from '@/components/rooms/RoomFilters';
import RoomSearch from '@/components/rooms/RoomSearch';
import { useQuery } from '@tanstack/react-query';

const RoomsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    capacity: 0,
    location: '',
    amenities: [],
    date: null,
    timeRange: { start: '', end: '' },
  });

  const { data: rooms = [], isLoading, error } = useQuery({
    queryKey: ['rooms', filters],
    queryFn: () => getRooms({ filterOptions: filters }),
  });

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
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Meeting Rooms</h1>
        <RoomSearch onSearchChange={handleSearchChange} />
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/4">
          <RoomFilters 
            filters={filters} 
            onFilterChange={handleFilterChange} 
          />
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
            <RoomList rooms={filteredRooms} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomsPage;
