import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookingWithDetails } from '@/types/booking';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import BookingsList from './BookingsList';
import BookingDetailsModal from './BookingDetailsModal';
import CancelBookingModal from './CancelBookingModal';
import { Search, ListFilter, CalendarClock, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getUserBookings } from '@/services/bookingService';
import EmptyState from '@/components/common/EmptyState';

interface ExtendedBookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingWithDetails | null;
  onEdit?: (booking: BookingWithDetails) => void;
  onCancel?: (booking: BookingWithDetails) => void;
}

interface ExtendedCancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingWithDetails | null;
  onBookingCancelled?: () => void;
}

const ExtendedBookingDetailsModal: React.FC<ExtendedBookingDetailsModalProps> = BookingDetailsModal as any;
const ExtendedCancelBookingModal: React.FC<ExtendedCancelBookingModalProps> = CancelBookingModal as any;

const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<BookingWithDetails | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleViewDetails = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const handleEditBooking = (booking: BookingWithDetails) => {
    navigate(`/bookings/edit/${booking.id}`);
  };

  const handleOpenCancelModal = (booking: BookingWithDetails) => {
    setBookingToCancel(booking);
    setIsCancelOpen(true);
  };

  const handleCloseCancelModal = () => {
    setIsCancelOpen(false);
    setBookingToCancel(null);
  };

  const handleBookingCancelled = () => {
    toast({
      title: 'Booking Cancelled',
      description: 'The booking has been successfully cancelled.',
    });
    refetch();
    handleCloseCancelModal();
  };

  const { data: allBookings, isLoading, error, refetch } = useQuery({
    queryKey: ['my-bookings', user?.id],
    queryFn: () => {
      if (!user?.id) return Promise.resolve([]);
      return getUserBookings(user.id);
    },
    enabled: !!user?.id,
  });

  const filteredBookings = React.useMemo(() => {
    if (!allBookings) return [];
    return allBookings.filter(booking =>
      booking.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allBookings, searchQuery]);

  const upcomingBookings = React.useMemo(() => {
    if (!filteredBookings) return [];
    return filteredBookings.filter(booking => new Date(booking.start_time) >= new Date());
  }, [filteredBookings]);

  const pastBookings = React.useMemo(() => {
    if (!filteredBookings) return [];
    return filteredBookings.filter(booking => new Date(booking.start_time) < new Date());
  }, [filteredBookings]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">My Bookings</CardTitle>
        <CardDescription>Manage your upcoming and past bookings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search bookings..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <ListFilter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading your bookings...</span>
          </div>
        )}

        {error && (
          <EmptyState
            title="Error loading bookings"
            description={`We couldn't load your bookings. ${(error as Error).message}`}
            actionLabel="Try Again"
            onAction={() => refetch()}
            icon={<XCircle className="h-8 w-8 text-destructive" />}
          />
        )}

        {!isLoading && !error && (
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming">
                <CalendarClock className="mr-2 h-4 w-4" />
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="past">
                <Clock className="mr-2 h-4 w-4" />
                Past
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="space-y-4">
              {isLoading && <p>Loading upcoming bookings...</p>}
              {error && <p className="text-red-500">Error: {(error as Error).message}</p>}
              {upcomingBookings && upcomingBookings.length > 0 ? (
                <BookingsList
                  bookings={upcomingBookings}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEditBooking}
                  onCancel={handleOpenCancelModal}
                />
              ) : (
                <p>No upcoming bookings found.</p>
              )}
            </TabsContent>
            <TabsContent value="past" className="space-y-4">
              {isLoading && <p>Loading past bookings...</p>}
              {error && <p className="text-red-500">Error: {(error as Error).message}</p>}
              {pastBookings && pastBookings.length > 0 ? (
                <BookingsList
                  bookings={pastBookings}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEditBooking}
                  onCancel={handleOpenCancelModal}
                />
              ) : (
                <p>No past bookings found.</p>
              )}
            </TabsContent>
          </Tabs>
        )}

        <ExtendedBookingDetailsModal
          isOpen={isDetailsOpen}
          onClose={handleCloseDetails}
          booking={selectedBooking}
          onEdit={handleEditBooking}
          onCancel={handleOpenCancelModal}
        />

        <ExtendedCancelBookingModal
          isOpen={isCancelOpen}
          onClose={handleCloseCancelModal}
          booking={bookingToCancel}
          onBookingCancelled={handleBookingCancelled}
        />
      </CardContent>
    </Card>
  );
};

export default MyBookings;
