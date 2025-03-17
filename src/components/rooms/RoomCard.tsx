
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Users, MapPin, Monitor, Wifi, Video } from "lucide-react";
import { RoomWithAmenities } from '@/types';

interface RoomCardProps {
  room: RoomWithAmenities;
  isAvailable?: boolean;
  showBookButton?: boolean;
  onBookNow?: (roomId: string) => void;
}

const RoomCard = ({
  room,
  isAvailable = true,
  showBookButton = true,
  onBookNow,
}: RoomCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/rooms/${room.id}`);
  };
  
  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookNow) {
      onBookNow(room.id);
    } else {
      navigate(`/rooms/${room.id}/book`);
    }
  };
  
  // Helper function to check if an amenity exists
  const hasAmenity = (amenityName: string) => {
    return room.amenities?.some(amenity => 
      amenity.name.toLowerCase().includes(amenityName.toLowerCase())
    );
  };
  
  // Render amenity icons
  const renderAmenityIcons = () => {
    const icons = [];
    
    if (hasAmenity('projector')) {
      icons.push(
        <TooltipProvider key="projector">
          <Tooltip>
            <TooltipTrigger>
              <Monitor className="h-4 w-4 mr-2" />
            </TooltipTrigger>
            <TooltipContent>Projector</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    if (hasAmenity('wifi')) {
      icons.push(
        <TooltipProvider key="wifi">
          <Tooltip>
            <TooltipTrigger>
              <Wifi className="h-4 w-4 mr-2" />
            </TooltipTrigger>
            <TooltipContent>WiFi</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    if (hasAmenity('video')) {
      icons.push(
        <TooltipProvider key="video">
          <Tooltip>
            <TooltipTrigger>
              <Video className="h-4 w-4 mr-2" />
            </TooltipTrigger>
            <TooltipContent>Video Conference</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return icons;
  };
  
  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer transition-all hover:translate-y-[-4px] hover:shadow-md",
        !isAvailable && "opacity-70"
      )}
      onClick={handleClick}
    >
      <div className="h-[200px] overflow-hidden">
        <img 
          src={room.image_url || 'https://via.placeholder.com/300x200?text=Room+Image'} 
          alt={room.name} 
          className="w-full h-full object-cover"
        />
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-xl truncate flex-1">{room.name}</h3>
          <Badge variant={isAvailable ? "default" : "destructive"} className="ml-2">
            {isAvailable ? 'Available' : 'Unavailable'}
          </Badge>
        </div>
        
        <div className="flex items-center mt-2">
          <Users className="h-4 w-4 mr-2" />
          <span className="text-sm">Capacity: {room.capacity}</span>
        </div>
        
        <div className="flex items-center mt-1">
          <MapPin className="h-4 w-4 mr-2" />
          <span className="text-sm truncate">{room.location}</span>
        </div>
        
        <div className="flex mt-3 items-center">
          {renderAmenityIcons()}
        </div>
      </CardContent>
      
      {showBookButton && (
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full" 
            onClick={handleBookNow}
            disabled={!isAvailable}
          >
            {isAvailable ? 'Book Now' : 'Unavailable'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default RoomCard;
