
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Building2, Users, Info, CalendarRange, AlertCircle, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Room, RoomWithAmenities } from '@/types/room';
import { getRoomById } from '@/services/roomService';
import RoomGallery from './RoomGallery';
import RoomAmenities from './RoomAmenities';
import RoomAvailabilityCalendar from './RoomAvailabilityCalendar';
import BookingModal from '@/components/bookings/BookingModal';

const RoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: room, isLoading, error } = useQuery({
    queryKey: ['room', id],
    queryFn: () => id ? getRoomById(id) : null,
    enabled: !!id,
  });

  // Map room to RoomWithAmenities format
  const processedRoom: RoomWithAmenities | null = room ? {
    ...room,
    status: room.is_active ? 'available' : 'inactive',
    amenities: room.amenities || []
  } as RoomWithAmenities : null;

  const handleBookRoom = () => {
    setIsBookingModalOpen(true);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  if (isLoading) {
    return <div className="min-h-[400px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (error || !processedRoom) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Room Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The room you're looking for doesn't exist or there was an error loading it.
        </p>
        <Button variant="default" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const statusColor = {
    available: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    maintenance: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    inactive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  }[processedRoom.status || 'available'];

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold">{processedRoom.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className={statusColor}>
              {processedRoom.status?.charAt(0).toUpperCase() + processedRoom.status?.slice(1)}
            </Badge>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4 mr-1" />
              {processedRoom.location}
              {processedRoom.floor && `, Floor ${processedRoom.floor}`}
              {processedRoom.room_number && `, Room ${processedRoom.room_number}`}
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4 mr-1" />
              {processedRoom.capacity} {processedRoom.capacity === 1 ? 'Person' : 'People'}
            </div>
          </div>
        </div>
        <Button 
          size="lg" 
          disabled={processedRoom.status !== 'available'}
          onClick={handleBookRoom}
        >
          Book This Room
        </Button>
      </div>

      <RoomGallery 
        imageUrl={processedRoom.image_url} 
        roomName={processedRoom.name} 
      />

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="py-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Room Description</h3>
              <p className="text-gray-700 dark:text-gray-300">
                {processedRoom.description || 'No description available for this room.'}
              </p>
              
              <Separator className="my-6" />
              
              <h3 className="text-xl font-semibold mb-4">Location Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium">Building:</span>
                    <span className="ml-2">{processedRoom.location}</span>
                  </div>
                  {processedRoom.floor && (
                    <div className="flex items-center">
                      <span className="font-medium ml-7">Floor:</span>
                      <span className="ml-2">{processedRoom.floor}</span>
                    </div>
                  )}
                  {processedRoom.room_number && (
                    <div className="flex items-center">
                      <span className="font-medium ml-7">Room Number:</span>
                      <span className="ml-2">{processedRoom.room_number}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 dark:bg-gray-900/50 py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
              Last updated: {processedRoom.updated_at ? format(new Date(processedRoom.updated_at), 'PPP') : 'N/A'}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="amenities" className="py-4">
          <Card>
            <CardContent className="p-6">
              <RoomAmenities amenities={processedRoom.amenities || []} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="availability" className="py-4">
          <Card>
            <CardContent className="p-6">
              <RoomAvailabilityCalendar 
                roomId={processedRoom.id} 
                onDateSelect={handleDateSelect}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        room={processedRoom}
        initialDate={selectedDate}
        initialStartTime="09:00"
        initialEndTime="10:00"
      />
    </div>
  );
};

export default RoomDetail;
