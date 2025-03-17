
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Building } from 'lucide-react';
import { RoomWithAmenities } from '@/types/room';

interface RoomCardProps {
  room: RoomWithAmenities;
  date: Date | null;
  startTime: string;
  endTime: string;
}

const RoomCard = ({ room, date, startTime, endTime }: RoomCardProps) => {
  const navigate = useNavigate();
  
  // Default placeholder image if none provided
  const imageUrl = room.image_url || 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
  
  const handleBooking = () => {
    // Navigate to booking page with room details
    navigate(`/bookings?roomId=${room.id}&date=${date?.toISOString()}&startTime=${startTime}&endTime=${endTime}`);
  };

  const handleViewDetails = () => {
    // Navigate to room details page
    navigate(`/rooms/${room.id}`);
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={room.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{room.name}</CardTitle>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Available
          </Badge>
        </div>
        <CardDescription>{room.location}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Users className="h-4 w-4" />
          <span>Capacity: {room.capacity} people</span>
        </div>
        {room.description && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
            {room.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {room.amenities.slice(0, 3).map((amenity) => (
            <Badge
              key={amenity.id}
              variant="outline"
              className="flex items-center gap-1 text-xs"
            >
              {amenity.name}
            </Badge>
          ))}
          {room.amenities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{room.amenities.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleViewDetails}
          >
            Details
          </Button>
          <Button
            className="flex-1"
            onClick={handleBooking}
          >
            Book
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RoomCard;
