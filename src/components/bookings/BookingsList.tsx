
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  MoreVertical, 
  AlertCircle
} from "lucide-react";
import { format, isPast, isFuture, isToday } from "date-fns";

import { bookingService } from "@/services/bookingService";
import { BookingWithDetails } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import BookingDetailsModal from "./BookingDetailsModal";
import CancelBookingModal from "./CancelBookingModal";

const BookingsList = () => {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Load bookings
  const loadBookings = async () => {
    try {
      setLoading(true);
      const bookingsData = await bookingService.getUserBookings();
      setBookings(bookingsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadBookings();
  }, []);
  
  // Filter bookings by status/time
  const todayBookings = bookings.filter(booking => 
    booking.status === "confirmed" && 
    isToday(new Date(booking.start_time))
  );
  
  const upcomingBookings = bookings.filter(booking => 
    booking.status === "confirmed" && 
    isFuture(new Date(booking.start_time)) &&
    !isToday(new Date(booking.start_time))
  );
  
  const pastBookings = bookings.filter(booking => 
    (booking.status === "completed" || booking.status === "confirmed") && 
    isPast(new Date(booking.end_time)) && 
    !isToday(new Date(booking.start_time))
  );
  
  const cancelledBookings = bookings.filter(booking => 
    booking.status === "cancelled"
  );
  
  // Handle booking selection
  const handleViewDetails = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setDetailsModalOpen(true);
  };
  
  // Handle booking cancellation
  const handleCancelBooking = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setCancelModalOpen(true);
  };
  
  // Confirm cancellation
  const confirmCancelBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      await bookingService.cancelBooking(selectedBooking.id);
      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled successfully",
      });
      loadBookings();
      setCancelModalOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to cancel booking",
      });
    }
  };
  
  // Render booking card
  const renderBookingCard = (booking: BookingWithDetails) => {
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    const isPastBooking = isPast(endTime);
    const isTodayBooking = isToday(startTime);
    
    return (
      <Card 
        key={booking.id} 
        className={`overflow-hidden ${isPastBooking ? "bg-muted/50" : ""}`}
      >
        <CardContent className="p-4">
          {/* Status badge and actions */}
          <div className="flex justify-between items-center mb-2">
            <Badge 
              variant={
                booking.status === "cancelled" ? "destructive" : 
                isPastBooking ? "outline" : 
                isTodayBooking ? "success" : "default"
              }
              className={
                booking.status === "cancelled" ? "" : 
                isPastBooking ? "border-gray-400 text-gray-600" : 
                isTodayBooking ? "bg-green-500 hover:bg-green-500/80" : ""
              }
            >
              {booking.status === "cancelled" ? "Cancelled" : 
               isPastBooking ? "Completed" : 
               isTodayBooking ? "Today" : "Upcoming"}
            </Badge>
            
            {/* Actions menu */}
            {!isPastBooking && booking.status !== "cancelled" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewDetails(booking)}>
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCancelBooking(booking)}>
                    Cancel Booking
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-semibold mb-2 truncate">
            {booking.title}
          </h3>
          
          {/* Room name */}
          <p className="font-medium mb-2">
            {booking.room.name}
          </p>
          
          {/* Date and time */}
          <div className="flex items-center mb-2">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <p className="text-sm">
              {format(startTime, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          
          <div className="flex items-center mb-2">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <p className="text-sm">
              {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
            </p>
          </div>
          
          {/* Location */}
          <div className="flex items-center mb-3">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <p className="text-sm">
              {booking.room.location}
              {booking.room.floor ? `, Floor ${booking.room.floor}` : ""}
              {booking.room.room_number ? `, Room ${booking.room.room_number}` : ""}
            </p>
          </div>
          
          {/* View details button for past/cancelled bookings */}
          {(isPastBooking || booking.status === "cancelled") && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => handleViewDetails(booking)}
            >
              View Details
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Render empty state
  const renderEmptyState = (message: string, showButton: boolean = false) => (
    <div className="p-8 text-center bg-muted/50 rounded-md">
      <p className="text-lg">{message}</p>
      {showButton && (
        <Button 
          className="mt-4" 
          onClick={() => navigate("/rooms")}
        >
          Book a Room
        </Button>
      )}
    </div>
  );
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Bookings</h1>
      
      {error && (
        <div className="p-4 mb-4 bg-destructive/10 text-destructive rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-md" />
          <Skeleton className="h-[200px] w-full rounded-md" />
          <Skeleton className="h-[200px] w-full rounded-md" />
        </div>
      ) : (
        <Tabs defaultValue="today">
          <TabsList className="mb-4">
            <TabsTrigger value="today">
              Today ({todayBookings.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledBookings.length})
            </TabsTrigger>
          </TabsList>
          
          {/* Today's bookings */}
          <TabsContent value="today">
            {todayBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {todayBookings.map(renderBookingCard)}
              </div>
            ) : (
              renderEmptyState("You have no bookings for today.", true)
            )}
          </TabsContent>
          
          {/* Upcoming bookings */}
          <TabsContent value="upcoming">
            {upcomingBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingBookings.map(renderBookingCard)}
              </div>
            ) : (
              renderEmptyState("You have no upcoming bookings.", true)
            )}
          </TabsContent>
          
          {/* Past bookings */}
          <TabsContent value="past">
            {pastBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastBookings.map(renderBookingCard)}
              </div>
            ) : (
              renderEmptyState("You have no past bookings.")
            )}
          </TabsContent>
          
          {/* Cancelled bookings */}
          <TabsContent value="cancelled">
            {cancelledBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cancelledBookings.map(renderBookingCard)}
              </div>
            ) : (
              renderEmptyState("You have no cancelled bookings.")
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Booking details modal */}
      {selectedBooking && (
        <BookingDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          booking={selectedBooking}
          onCancelBooking={() => {
            setDetailsModalOpen(false);
            handleCancelBooking(selectedBooking);
          }}
        />
      )}
      
      {/* Cancel booking confirmation modal */}
      {selectedBooking && (
        <CancelBookingModal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          booking={selectedBooking}
          onConfirm={confirmCancelBooking}
        />
      )}
    </div>
  );
};

export default BookingsList;
