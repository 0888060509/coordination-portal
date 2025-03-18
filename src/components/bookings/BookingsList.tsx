
import { useState, useEffect } from "react";
import { Calendar, PlusCircle } from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { BookingWithDetails } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { LoadingContent } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import BookingCard from "./BookingCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface BookingsListProps {
  onBookRoom: () => void;
}

const BookingsList = ({ onBookRoom }: BookingsListProps) => {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Log to debug the user state
      console.info("Loading bookings for user:", user?.id);
      
      const bookings = await bookingService.getUserBookings();
      console.info("Bookings loaded:", bookings);
      
      setBookings(bookings);
    } catch (error: any) {
      console.error("Failed to load bookings:", error);
      setError(error.message || "Failed to load bookings");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your bookings. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Group bookings by date
  const groupBookingsByDate = () => {
    const grouped: Record<string, BookingWithDetails[]> = {};
    
    bookings.forEach(booking => {
      const dateKey = format(new Date(booking.start_time), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(booking);
    });
    
    return grouped;
  };

  const groupedBookings = groupBookingsByDate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const hasBookingsToday = groupedBookings[today] && groupedBookings[today].length > 0;

  if (isLoading) return <LoadingContent timeout={30000} />;

  if (error) {
    return (
      <div className="p-4 border rounded-md bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300">
        <p>{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2" 
          onClick={loadBookings}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-gray-50 dark:bg-gray-900/20">
        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">You have no bookings</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Book a room to manage your meetings and events
        </p>
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            onBookRoom();
          }} 
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Book a Room
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hasBookingsToday && (
        <div className="p-4 text-center border rounded-md bg-blue-50 dark:bg-blue-900/20 mb-4">
          <p className="mb-2">You have no bookings for today.</p>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onBookRoom();
            }} 
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Book a Room
          </Button>
        </div>
      )}

      {Object.entries(groupedBookings)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, dateBookings]) => (
          <div key={date} className="space-y-2">
            <h3 className="font-semibold text-md">
              {format(new Date(date), "EEEE, MMMM d, yyyy")}
              {date === today && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {dateBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} onUpdate={loadBookings} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};

export default BookingsList;
