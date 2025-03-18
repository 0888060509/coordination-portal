
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingContent } from "@/components/ui/loading-spinner";
import { FilterIcon } from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { roomService } from "@/services/roomService";
import { BookingWithDetails } from "@/types/booking";
import { RoomWithAmenities } from "@/types/room";
import { format, parseISO, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import TimelineRoomRow from "./TimelineRoomRow";

interface TimelineViewProps {
  selectedDate: Date;
}

const TimelineView = ({ selectedDate }: TimelineViewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomWithAmenities[]>([]);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Time slots from 8 AM to 8 PM
  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load rooms - using getRooms() instead of getAllRooms()
      const roomsData = await roomService.getRooms();
      setRooms(roomsData);
      
      // Initialize selected rooms with all room IDs if empty
      if (selectedRooms.length === 0) {
        setSelectedRooms(roomsData.map(room => room.id));
      }

      // Load bookings for the selected date
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      // Get all bookings for all rooms on the selected date
      const allBookings: BookingWithDetails[] = [];
      
      for (const room of roomsData) {
        try {
          const roomBookings = await bookingService.getRoomBookings(room.id, startDate, endDate);
          
          // Get full booking details for each booking
          for (const booking of roomBookings) {
            try {
              const bookingDetail = await bookingService.getBookingById(booking.id);
              if (bookingDetail) {
                allBookings.push(bookingDetail);
              }
            } catch (error) {
              console.error(`Failed to get details for booking ${booking.id}:`, error);
            }
          }
        } catch (error) {
          console.error(`Failed to get bookings for room ${room.id}:`, error);
        }
      }
      
      setBookings(allBookings);
    } catch (error: any) {
      console.error("Failed to load timeline data:", error);
      setError(error.message || "Failed to load timeline data");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const filteredRooms = rooms
    .filter(room => selectedRooms.includes(room.id))
    .filter(room => 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.location && room.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  // Get booking status for each room
  const getRoomStatus = (roomId: string) => {
    const roomBookings = bookings.filter(booking => booking.room_id === roomId);
    if (roomBookings.length === 0) return "available";
    
    // If there are more than 5 bookings, consider it fully booked
    // This is a simple heuristic and could be made more sophisticated
    if (roomBookings.length > 5) return "fully-booked";
    
    return "partially-booked";
  };

  const currentTime = new Date();
  const isToday = isSameDay(selectedDate, currentTime);
  const currentHour = currentTime.getHours();

  if (isLoading) {
    return <LoadingContent timeout={30000} />;
  }

  if (error) {
    return (
      <div className="p-4 border rounded-md bg-red-50 text-red-800">
        <p>{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2" 
          onClick={loadData}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col border rounded-md">
      {/* Sidebar and Timeline container */}
      <div className="flex h-[600px]">
        {/* Room sidebar */}
        <div className="w-64 min-w-64 flex flex-col border-r">
          <div className="p-4 border-b font-medium sticky top-0 bg-background z-10">
            <h3 className="mb-2">Meeting Rooms</h3>
            <div className="mb-2">
              <Input
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">{filteredRooms.length} Rooms</span>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <FilterIcon className="h-3 w-3" />
                Filter
              </Button>
            </div>
          </div>
          
          <div className="overflow-y-auto">
            {rooms.map(room => (
              <div 
                key={room.id} 
                className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-900/10"
              >
                <Checkbox 
                  id={`room-${room.id}`}
                  checked={selectedRooms.includes(room.id)}
                  onCheckedChange={() => toggleRoomSelection(room.id)}
                  className="mr-2"
                />
                <label 
                  htmlFor={`room-${room.id}`}
                  className="flex flex-col cursor-pointer flex-grow"
                >
                  <span className="font-medium">{room.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {room.floor && `${room.floor} Floor, `}
                    {room.location || 'Building A'}
                  </span>
                </label>
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  getRoomStatus(room.id) === "available" ? "bg-green-500" : 
                  getRoomStatus(room.id) === "partially-booked" ? "bg-orange-400" : 
                  "bg-red-500"
                )} />
              </div>
            ))}
          </div>
        </div>
        
        {/* Timeline */}
        <div className="flex-1 overflow-x-auto">
          {/* Timeline header */}
          <div className="sticky top-0 bg-background z-10">
            <div className="h-16 border-b flex">
              <div className="w-64 min-w-64 p-4 border-r font-medium">
                Rooms
              </div>
              <div className="flex-1 flex">
                {timeSlots.map(hour => (
                  <div 
                    key={hour} 
                    className="w-24 min-w-24 border-r flex items-center justify-center text-sm"
                  >
                    {hour % 12 || 12} {hour < 12 ? 'AM' : 'PM'}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Timeline body */}
          <div className="relative">
            {filteredRooms.map(room => (
              <TimelineRoomRow 
                key={room.id}
                room={room}
                timeSlots={timeSlots}
                bookings={bookings.filter(b => b.room_id === room.id && isSameDay(parseISO(b.start_time), selectedDate))}
              />
            ))}
            
            {/* Current time indicator (red line) - only show if viewing today */}
            {isToday && currentHour >= 8 && currentHour <= 19 && (
              <div 
                className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                style={{ 
                  left: `${64 * 4 + (currentHour - 8 + currentTime.getMinutes() / 60) * 96}px`
                }}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Room status legend */}
      <div className="p-3 border-t flex items-center gap-6 text-sm">
        <span className="font-medium">Room Status:</span>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-orange-400" />
          <span>Partially Booked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>Fully Booked</span>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
