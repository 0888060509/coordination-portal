
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import RoomList from "@/components/rooms/RoomList";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const RoomsPage = () => {
  const [searchParams] = useSearchParams();
  const booking = searchParams.get('booking');
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [showBookingToast, setShowBookingToast] = useState(false);

  useEffect(() => {
    // Handle the "booking=new" query parameter
    if (booking === 'new') {
      if (!isAuthenticated) {
        toast({
          title: "Authentication required",
          description: "Please log in to book a room",
          variant: "destructive"
        });
      } else {
        setShowBookingToast(true);
        toast({
          title: "Book a Room",
          description: "Select a room below and click 'Book' to make a reservation",
        });
      }
    }
  }, [booking, isAuthenticated, toast]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rooms</h1>
      </div>
      <div className="space-y-6">
        <RoomList showBookingPrompt={showBookingToast} />
      </div>
    </div>
  );
};

export default RoomsPage;
