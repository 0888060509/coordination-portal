
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { roomService } from "@/services/roomService";
import { RoomWithAmenities } from "@/types/room";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { LoadingContent } from "@/components/ui/loading-spinner";
import RoomCard from "@/components/rooms/RoomCard";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingSheetModal = ({ isOpen, onClose }: BookingModalProps) => {
  const [rooms, setRooms] = useState<RoomWithAmenities[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (isOpen) {
      loadRooms();
    }
  }, [isOpen]);
  
  const loadRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rooms = await roomService.getRooms();
      setRooms(rooms);
    } catch (error: any) {
      console.error("Failed to load rooms:", error);
      setError(error.message || "Failed to load rooms");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load available rooms. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCardClick = (room: RoomWithAmenities) => {
    onClose();
    navigate(`/rooms/${room.id}`);
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Book a Room</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {isLoading ? (
            <LoadingContent />
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-500">{error}</p>
              <Button 
                variant="outline" 
                className="mt-2" 
                onClick={loadRooms}
              >
                Try Again
              </Button>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center p-4">
              <p className="mb-2">No available rooms found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rooms.map((room) => (
                <div key={room.id} onClick={() => handleCardClick(room)}>
                  <RoomCard
                    room={room}
                    date={new Date()}
                    startTime={`${new Date().getHours().toString().padStart(2, '0')}:00`}
                    endTime={`${(new Date().getHours() + 1).toString().padStart(2, '0')}:00`}
                    showBookingPrompt={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookingSheetModal;
