
import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BookingsList from "@/components/bookings/BookingsList";
import { Button } from "@/components/ui/button";
import { LoadingContent } from "@/components/ui/loading-spinner";

const BookingsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading time for initial render
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <Button 
          onClick={() => navigate("/rooms?booking=new")} 
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
          <BookingsList />
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
