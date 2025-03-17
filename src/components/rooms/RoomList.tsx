
import React from 'react';
import { Room, RoomWithAmenities } from '@/types/room';
import RoomCard from './RoomCard';

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

  return (
    <div>
      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      ) : (
        <p>No rooms available.</p>
      )}
    </div>
  );
};

export default RoomList;
