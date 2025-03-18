
import { useRef, useState } from "react";
import { BookingWithDetails } from "@/types/booking";
import { RoomWithAmenities } from "@/types/room";
import { parseISO, format } from "date-fns";
import { cn } from "@/lib/utils";
import BookingDetailsModal from "./BookingDetailsModal";

interface TimelineRoomRowProps {
  room: RoomWithAmenities;
  timeSlots: number[];
  bookings: BookingWithDetails[];
}

const TimelineRoomRow = ({ room, timeSlots, bookings }: TimelineRoomRowProps) => {
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const getBookingPosition = (booking: BookingWithDetails) => {
    const startTime = parseISO(booking.start_time);
    const endTime = parseISO(booking.end_time);
    
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    
    // Calculate position and width based on time
    // Each hour is 96px wide, and the timeline starts at 8 AM
    const left = Math.max(0, (startHour - 8) * 96);
    const width = Math.max(30, (endHour - startHour) * 96);
    
    return { left, width };
  };

  const handleBookingClick = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setIsDetailsModalOpen(true);
  };

  return (
    <>
      <div 
        ref={rowRef}
        className="flex border-b min-h-[72px] hover:bg-gray-50 dark:hover:bg-gray-900/5"
      >
        {/* Room info cell */}
        <div className="w-64 min-w-64 p-3 border-r flex flex-col justify-center">
          <div className="font-medium">{room.name}</div>
          <div className="text-xs text-muted-foreground">
            {room.floor && `${room.floor} Floor, `}
            {room.location || 'Building A'}
          </div>
        </div>
        
        {/* Timeline grid */}
        <div className="flex-1 flex relative">
          {/* Time slot columns */}
          {timeSlots.map(hour => (
            <div key={hour} className="w-24 min-w-24 border-r h-full"></div>
          ))}
          
          {/* Booking blocks */}
          {bookings.map(booking => {
            const { left, width } = getBookingPosition(booking);
            return (
              <div
                key={booking.id}
                className="absolute top-2 bottom-2 rounded-md bg-blue-500 text-white p-2 cursor-pointer hover:bg-blue-600 transition-colors text-sm overflow-hidden"
                style={{ left: `${left}px`, width: `${width}px` }}
                onClick={() => handleBookingClick(booking)}
              >
                <div className="font-medium truncate">{booking.title}</div>
                <div className="text-xs truncate">{booking.user.first_name} {booking.user.last_name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking details modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onUpdate={() => {
            // This would update the bookings
            setIsDetailsModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default TimelineRoomRow;
