
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
import { useMediaQuery } from "@/hooks/use-media-query";

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
  const isMobile = useMediaQuery("(max-width: 640px)");
  
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
  
  const handleCardClick = (e: React.MouseEvent, room: RoomWithAmenities) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
    navigate(`/rooms/${room.id}`);
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side={isMobile ? "bottom" : "right"}
        className={`${isMobile ? 'h-[80vh] rounded-t-xl' : 'w-full sm:max-w-lg md:max-w-xl'} p-4 overflow-y-auto`} 
        onClick={(e) => e.stopPropagation()}
      >
        <SheetHeader className="mb-4 sticky top-0 z-10 bg-background pt-1">
          <SheetTitle>Book a Room</SheetTitle>
        </SheetHeader>
        
        <div className="mt-2 space-y-4 pb-16">
          {isLoading ? (
            <LoadingContent />
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-500">{error}</p>
              <Button 
                variant="outline" 
                className="mt-2" 
                onClick={(e) => {
                  e.stopPropagation();
                  loadRooms();
                }}
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
                <div 
                  key={room.id} 
                  onClick={(e) => handleCardClick(e, room)}
                  className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
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
