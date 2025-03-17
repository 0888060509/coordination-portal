import React from 'react';
import { Room } from '@/types/room';
import RoomCard from './RoomCard';
import { Grid } from '@/components/ui/grid';
import { getRooms } from '@/services/roomService';

interface RoomListProps {
  rooms: Room[];
}

const RoomList: React.FC<RoomListProps> = ({ rooms }) => {
  return (
    <div>
      {rooms.length > 0 ? (
        <Grid>
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </Grid>
      ) : (
        <p>No rooms available.</p>
      )}
    </div>
  );
};

export default RoomList;
