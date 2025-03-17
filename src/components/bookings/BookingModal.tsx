
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoomWithAmenities } from "@/types/room";
import BookingForm from "./BookingForm";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomWithAmenities;
  initialDate: Date;
  initialStartTime: string;
  initialEndTime: string;
}

const BookingModal = ({
  isOpen,
  onClose,
  room,
  initialDate,
  initialStartTime,
  initialEndTime
}: BookingModalProps) => {
  const navigate = useNavigate();
  
  const handleBookingSuccess = () => {
    onClose();
    navigate('/bookings');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {room.name}</DialogTitle>
        </DialogHeader>

        <BookingForm
          room={room}
          initialDate={initialDate}
          initialStartTime={initialStartTime}
          initialEndTime={initialEndTime}
          onSuccess={handleBookingSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
