
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3Icon, 
  CalendarIcon, 
  CheckCircleIcon, 
  Clock, 
  GridIcon, 
  MapPinIcon, 
  PlusCircleIcon, 
  AlertCircleIcon, 
  XCircleIcon, 
  UsersIcon 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PageHeader from '@/components/common/PageHeader';
import { useBookings } from '@/hooks/useBookings';
import { useRooms } from '@/hooks/useRooms';
import { formatDate } from '@/utils/dateUtils';
import RoomCard from '@/components/rooms/RoomCard';
import BookingsList from '@/components/bookings/BookingsList';

export default function DashboardPage() {
  const navigate = useNavigate();
  
  // Query for user's bookings
  const { data: bookings, isLoading: isLoadingBookings } = useBookings();
  
  // Query for rooms
  const { data: rooms, isLoading: isLoadingRooms } = useRooms();
  
  // Get upcoming bookings (next 7 days)
  const upcomingBookings = React.useMemo(() => {
    if (!bookings) return [];
    
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return bookings
      .filter(
        (booking) =>
          booking.status === 'confirmed' &&
          new Date(booking.start_time) >= now &&
          new Date(booking.start_time) <= nextWeek
      )
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 5);
  }, [bookings]);
  
  // Get booking statistics
  const bookingStats = React.useMemo(() => {
    if (!bookings) {
      return {
        total: 0,
        confirmed: 0,
        cancelled: 0,
        pending: 0,
      };
    }
    
    return {
      total: bookings.length,
      confirmed: bookings.filter((b) => b.status === 'confirmed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      pending: bookings.filter((b) => b.status === 'pending').length,
    };
  }, [bookings]);
  
  // Get featured rooms (just a sample of available rooms)
  const featuredRooms = React.useMemo(() => {
    if (!rooms) return [];
    return rooms.slice(0, 3);
  }, [rooms]);
  
  const handleNewBooking = () => {
    navigate('/rooms');
  };
  
  const handleViewAllBookings = () => {
    navigate('/bookings');
  };
  
  const handleViewAllRooms = () => {
    navigate('/rooms');
  };
  
  return (
    <div className="container py-6 mx-auto">
      <div className="flex flex-col space-y-6">
        <PageHeader
          title="Dashboard"
          subtitle={`Welcome back! Today is ${formatDate(new Date())}`}
        />
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <div className="flex items-center space-x-2">
                  <BarChart3Icon className="w-6 h-6 text-blue-500" />
                  <span className="text-2xl font-bold">{bookingStats.total}</span>
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  <span className="text-2xl font-bold">{bookingStats.confirmed}</span>
                </div>
                <p className="text-xs text-muted-foreground">Active bookings</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Pending</p>
                <div className="flex items-center space-x-2">
                  <AlertCircleIcon className="w-6 h-6 text-yellow-500" />
                  <span className="text-2xl font-bold">{bookingStats.pending}</span>
                </div>
                <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <div className="flex items-center space-x-2">
                  <XCircleIcon className="w-6 h-6 text-red-500" />
                  <span className="text-2xl font-bold">{bookingStats.cancelled}</span>
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleViewAllBookings}
                  className="flex items-center"
                >
                  View All
                  <CalendarIcon className="w-4 h-4 ml-2" />
                </Button>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <BookingList
                  bookings={upcomingBookings}
                  isLoading={isLoadingBookings}
                  emptyStateMessage="You have no upcoming bookings"
                />
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="flex flex-col space-y-4">
                  <Button 
                    size="lg" 
                    onClick={handleNewBooking}
                    className="flex items-center justify-center"
                  >
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    Book a Room
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleViewAllRooms}
                    className="flex items-center justify-center"
                  >
                    <GridIcon className="w-5 h-5 mr-2" />
                    Browse All Rooms
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleViewAllBookings}
                    className="flex items-center justify-center"
                  >
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    View My Bookings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Featured Rooms</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleViewAllRooms}
              className="flex items-center"
            >
              View All Rooms
              <GridIcon className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {isLoadingRooms ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="h-64 rounded-lg bg-muted animate-pulse"
                  />
                ))
              ) : featuredRooms.length > 0 ? (
                featuredRooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))
              ) : (
                <p>No rooms available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
