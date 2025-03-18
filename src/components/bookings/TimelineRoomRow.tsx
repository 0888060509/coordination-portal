
import { useRef, useState } from "react";
import { BookingWithDetails } from "@/types/booking";
import { RoomWithAmenities } from "@/types/room";
import { parseISO, format, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import BookingDetailsModal from "./BookingDetailsModal";
import BookingModal from "./BookingModal";

interface TimelineRoomRowProps {
  room: RoomWithAmenities;
  timeSlots: number[];
  bookings: BookingWithDetails[];
  selectedDate: Date;
  onTimeBlockClick?: (room: RoomWithAmenities, startTime: Date, endTime: Date) => void;
}

const TimelineRoomRow = ({ 
  room, 
  timeSlots, 
  bookings, 
  selectedDate,
  onTimeBlockClick 
}: TimelineRoomRowProps) => {
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);

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

  const handleCancelBooking = () => {
    // This would handle the booking cancellation
    setIsDetailsModalOpen(false);
  };

  const handleTimeBlockClick = (hourIndex: number) => {
    // Convert hour index to date
    const startTime = new Date(selectedDate);
    startTime.setHours(timeSlots[hourIndex]);
    startTime.setMinutes(0);
    startTime.setSeconds(0);
    
    // End time is 30 minutes later (minimum duration)
    const endTime = addMinutes(startTime, 30);
    
    // Check if the time block is available (no booking overlaps)
    const isOverlapping = bookings.some(booking => {
      const bookingStart = parseISO(booking.start_time);
      const bookingEnd = parseISO(booking.end_time);
      
      return (
        (startTime >= bookingStart && startTime < bookingEnd) || 
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (startTime <= bookingStart && endTime >= bookingEnd)
      );
    });
    
    if (!isOverlapping) {
      setSelectedStartTime(startTime);
      setSelectedEndTime(endTime);
      setIsBookingModalOpen(true);
    }
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedStartTime(null);
    setSelectedEndTime(null);
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
          {timeSlots.map((hour, index) => (
            <div 
              key={hour} 
              className="w-24 min-w-24 border-r h-full cursor-pointer hover:bg-blue-50"
              onClick={() => handleTimeBlockClick(index)}
            ></div>
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
          onCancelBooking={handleCancelBooking}
        />
      )}

      {/* New booking modal */}
      {selectedStartTime && selectedEndTime && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={closeBookingModal}
          room={room}
          initialDate={selectedDate}
          initialStartTime={format(selectedStartTime, 'HH:mm')}
          initialEndTime={format(selectedEndTime, 'HH:mm')}
        />
      )}
    </>
  );
};

export default TimelineRoomRow;
