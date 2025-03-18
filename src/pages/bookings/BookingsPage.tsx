
import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BookingsList from "@/components/bookings/BookingsList";
import { Button } from "@/components/ui/button";
import { LoadingContent } from "@/components/ui/loading-spinner";
import BookingSheetModal from "@/components/bookings/BookingSheetModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const BookingsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate loading time for initial render
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleBookRoom = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to book a room",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    // Open the booking modal directly instead of navigating
    setIsBookModalOpen(true);
  };

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            handleBookRoom();
          }} 
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Book a Room
        </Button>
      </div>
      
      {isLoading ? (
        <LoadingContent />
      ) : (
        <div className="space-y-6">
          <BookingsList onBookRoom={handleBookRoom} />
        </div>
      )}

      {/* Room Booking Modal */}
      <BookingSheetModal 
        isOpen={isBookModalOpen} 
        onClose={() => setIsBookModalOpen(false)} 
      />
    </div>
  );
};

export default BookingsPage;
