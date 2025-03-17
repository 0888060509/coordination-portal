
import { useState, useEffect } from 'react';
import { RoomWithAmenities, RoomFilterOptions } from '@/types';

// Mock data for development purposes
const mockRooms: RoomWithAmenities[] = [
  {
    id: '1',
    name: 'Conference Room A',
    capacity: 20,
    location: 'Floor 1, Building A',
    description: 'Large conference room with video conferencing equipment',
    image_url: 'https://picsum.photos/id/239/300/200',
    status: 'available',
    amenities: [
      { id: '1', name: 'Projector', icon: 'projector' },
      { id: '2', name: 'Video Conference', icon: 'video' },
      { id: '3', name: 'Whiteboard', icon: 'whiteboard' },
    ],
  },
  {
    id: '2',
    name: 'Meeting Room B',
    capacity: 8,
    location: 'Floor 2, Building A',
    description: 'Medium-sized meeting room with whiteboard',
    image_url: 'https://picsum.photos/id/240/300/200',
    status: 'available',
    amenities: [
      { id: '2', name: 'Video Conference', icon: 'video' },
      { id: '3', name: 'Whiteboard', icon: 'whiteboard' },
    ],
  },
  {
    id: '3',
    name: 'Huddle Space C',
    capacity: 4,
    location: 'Floor 3, Building B',
    description: 'Small huddle space for quick meetings',
    image_url: 'https://picsum.photos/id/241/300/200',
    status: 'maintenance',
    amenities: [
      { id: '3', name: 'Whiteboard', icon: 'whiteboard' },
    ],
  },
];

export function useRooms() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<RoomWithAmenities[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        // In a real app, this would be a fetch call to an API
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setData(mockRooms);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, []);

  return { data, isLoading, error };
}

export function useAvailableRooms(startTime: Date, endTime: Date, filters?: RoomFilterOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<RoomWithAmenities[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      try {
        // In a real app, this would be a fetch call to an API with the time parameters
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Filter rooms based on capacity if specified
        let filteredRooms = [...mockRooms].filter(room => room.status === 'available');
        
        if (filters?.capacity) {
          filteredRooms = filteredRooms.filter(room => room.capacity >= (filters.capacity || 0));
        }
        
        setData(filteredRooms);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableRooms();
  }, [startTime, endTime, filters?.capacity]);

  return { data, isLoading, error };
}
