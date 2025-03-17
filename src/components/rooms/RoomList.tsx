
import React from 'react';
import { RoomWithAmenities } from '@/types';
import { Search } from "lucide-react";
import RoomCard from './RoomCard';
import EmptyState from '../common/EmptyState';

interface RoomListProps {
  rooms: RoomWithAmenities[];
  isLoading: boolean;
  onBookNow?: (roomId: string) => void;
  emptyStateMessage?: string;
}

const RoomList = ({
  rooms,
  isLoading,
  onBookNow,
  emptyStateMessage = 'No rooms found matching your criteria',
}: RoomListProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div 
            key={i}
            className="h-[360px] rounded-lg bg-muted/50 animate-pulse"
          />
        ))}
      </div>
    );
  }
  
  if (!rooms.length) {
    return (
      <EmptyState
        title="No Rooms Found"
        description={emptyStateMessage}
        icon={<Search className="h-6 w-6" />}
      />
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} onBookNow={onBookNow} />
      ))}
    </div>
  );
};

export default RoomList;
