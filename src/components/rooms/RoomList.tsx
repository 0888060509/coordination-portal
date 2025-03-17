
import React from 'react';
import { Room, RoomWithAmenities } from '@/types/room';
import RoomCard from './RoomCard';
import { Grid } from '@/components/ui/grid';

interface RoomListProps {
  rooms: Room[];
}

const RoomList: React.FC<RoomListProps> = ({ rooms }) => {
  // Map Room to RoomWithAmenities to ensure all required props are present
  const processedRooms: RoomWithAmenities[] = rooms.map(room => ({
    ...room,
    status: room.is_active ? 'available' : 'inactive',
    amenities: room.amenities || []
  })) as RoomWithAmenities[];

  // Default values for date and time props that are required by RoomCard
  const today = new Date();
  const defaultStartTime = "09:00";
  const defaultEndTime = "17:00";

  return (
    <div>
      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedRooms.map((room) => (
            <RoomCard 
              key={room.id} 
              room={room} 
              date={today}
              startTime={defaultStartTime}
              endTime={defaultEndTime}
            />
          ))}
        </div>
      ) : (
        <p>No rooms available.</p>
      )}
    </div>
  );
};

export default RoomList;
