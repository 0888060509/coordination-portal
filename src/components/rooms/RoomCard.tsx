
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Users, MapPin } from 'lucide-react';
import { RoomWithAmenities } from '@/types/room';
import BookingModal from '@/components/bookings/BookingModal';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RoomCardProps {
  room: RoomWithAmenities;
  date: Date | null;
  startTime: string;
  endTime: string;
  showBookingPrompt?: boolean;
}

const RoomCard = ({ room, date, startTime, endTime, showBookingPrompt = false }: RoomCardProps) => {
  const navigate = useNavigate();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Default placeholder image if none provided
  const imageUrl = room.image_url || 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
  
  // If showBookingPrompt is true, highlight this card with a subtle animation
  React.useEffect(() => {
    if (showBookingPrompt) {
      const timer = setTimeout(() => {
        setIsBookingModalOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showBookingPrompt]);
  
  const handleViewDetails = () => {
    // Navigate to room details page
    navigate(`/rooms/${room.id}`);
  };
  
  const handleBookRoom = () => {
    console.log("Book room clicked", { isAuthenticated, user });
    
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book a room",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    // Use current date and time if not provided
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    const nextHour = (currentHour + 1) % 24;
    
    const bookingDate = date || currentDate;
    const bookingStartTime = startTime || `${currentHour.toString().padStart(2, '0')}:00`;
    const bookingEndTime = endTime || `${nextHour.toString().padStart(2, '0')}:00`;
    
    setIsBookingModalOpen(true);
  };
  
  return (
    <>
      <Card className={`overflow-hidden hover:shadow-lg transition-shadow duration-300 ${showBookingPrompt ? 'ring-2 ring-primary animate-pulse' : ''}`}>
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
            {Array.isArray(room.amenities) && room.amenities.length > 0 ? (
              <>
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
              </>
            ) : (
              <Badge variant="outline" className="text-xs">No amenities</Badge>
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
              onClick={handleBookRoom}
            >
              Book
            </Button>
          </div>
        </CardFooter>
      </Card>

      {isBookingModalOpen && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          room={room}
          initialDate={date || new Date()}
          initialStartTime={startTime || `${new Date().getHours().toString().padStart(2, '0')}:00`}
          initialEndTime={endTime || `${(new Date().getHours() + 1).toString().padStart(2, '0')}:00`}
        />
      )}
    </>
  );
};

export default RoomCard;
