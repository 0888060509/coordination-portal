
import { useState, useEffect } from "react";
import { PlusCircle, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoadingContent } from "@/components/ui/loading-spinner";
import BookingSheetModal from "@/components/bookings/BookingSheetModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import TimelineView from "@/components/bookings/TimelineView";
import { format, addDays, subDays } from "date-fns";

type ViewMode = "timeline" | "day" | "week" | "month";

const BookingsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Ensure authentication is initialized before rendering
    if (user || !isAuthenticated) {
      // Either user is loaded or we know they're not authenticated
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user, isAuthenticated]);

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

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const goToPreviousDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, 1));
  };

  const formatDateHeader = () => {
    return `Timeline View - ${format(selectedDate, "MMMM d, yyyy")}`;
  };

  // Navigation buttons for timeline
  const DateNavigationControls = () => (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="px-3 font-medium"
        onClick={goToToday}
      >
        Today
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={goToPreviousDay}
        aria-label="Previous day"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={goToNextDay}
        aria-label="Next day"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      <h1 className="text-xl font-bold">{formatDateHeader()}</h1>
    </div>
  );

  // View mode selection
  const ViewModeControls = () => (
    <div className="flex items-center gap-1">
      <Button 
        variant={viewMode === "month" ? "default" : "ghost"} 
        size="sm" 
        onClick={() => setViewMode("month")}
        className="flex items-center gap-1"
      >
        <Calendar className="h-4 w-4" />
        Month
      </Button>
      <Button 
        variant={viewMode === "week" ? "default" : "ghost"} 
        size="sm" 
        onClick={() => setViewMode("week")}
        className="flex items-center gap-1"
      >
        <Calendar className="h-4 w-4" />
        Week
      </Button>
      <Button 
        variant={viewMode === "day" ? "default" : "ghost"} 
        size="sm" 
        onClick={() => setViewMode("day")}
        className="flex items-center gap-1"
      >
        <Calendar className="h-4 w-4" />
        Day
      </Button>
      <Button 
        variant={viewMode === "timeline" ? "default" : "ghost"} 
        size="sm" 
        onClick={() => setViewMode("timeline")}
        className="flex items-center gap-1"
      >
        <Calendar className="h-4 w-4" />
        Timeline
      </Button>
    </div>
  );

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-6">
        <DateNavigationControls />
        <div className="flex items-center gap-4">
          <ViewModeControls />
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
      </div>
      
      {isLoading ? (
        <LoadingContent timeout={15000} />
      ) : (
        <div className="space-y-6">
          <TimelineView selectedDate={selectedDate} />
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
