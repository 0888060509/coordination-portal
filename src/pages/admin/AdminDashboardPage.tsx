
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import AdminBookingsByRoomChart from "@/components/admin/AdminBookingsByRoomChart";
import AdminRoomUtilizationChart from "@/components/admin/AdminRoomUtilizationChart";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { Users, DoorOpen, Calendar, BarChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const AdminDashboardPage = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => adminService.getAdminStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (err: Error) => {
      console.error("Error fetching admin stats:", err);
      toast({
        variant: "destructive",
        title: "Error loading dashboard",
        description: err.message || "Failed to load admin statistics",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <LoadingSpinner size="lg" showText text="Loading admin dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{(error as Error).message || "Failed to load admin statistics"}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total rooms stat */}
        <Card className="bg-primary/5">
          <CardContent className="p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
                <h3 className="text-3xl font-bold">{stats?.totalRooms || 0}</h3>
                <Link 
                  to="/admin/rooms" 
                  className="text-xs text-primary hover:underline inline-block mt-1"
                >
                  Manage Rooms
                </Link>
              </div>
              <div className="my-auto text-primary">
                <DoorOpen className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Total users stat */}
        <Card className="bg-primary/5">
          <CardContent className="p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h3 className="text-3xl font-bold">{stats?.totalUsers || 0}</h3>
                <Link 
                  to="/admin/users" 
                  className="text-xs text-primary hover:underline inline-block mt-1"
                >
                  Manage Users
                </Link>
              </div>
              <div className="my-auto text-green-500">
                <Users className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Total bookings stat */}
        <Card className="bg-primary/5">
          <CardContent className="p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <h3 className="text-3xl font-bold">{stats?.totalBookings || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
              <div className="my-auto text-orange-500">
                <Calendar className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Bookings today stat */}
        <Card className="bg-primary/5">
          <CardContent className="p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bookings Today</p>
                <h3 className="text-3xl font-bold">{stats?.bookingsToday || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Today</p>
              </div>
              <div className="my-auto text-purple-500">
                <BarChart className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Title</th>
                  <th className="text-left py-3 px-4">Room</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{booking.title}</td>
                    <td className="py-3 px-4">{booking.rooms.name}</td>
                    <td className="py-3 px-4">{`${booking.profiles.first_name} ${booking.profiles.last_name}`}</td>
                    <td className="py-3 px-4">{format(parseISO(booking.start_time), 'MMM d, yyyy')}</td>
                    <td className="py-3 px-4">{`${format(parseISO(booking.start_time), 'h:mm a')} - ${format(parseISO(booking.end_time), 'h:mm a')}`}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        booking.status === 'confirmed' ? 'default' : 
                        booking.status === 'cancelled' ? 'destructive' : 'secondary'
                      }>
                        {booking.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {(!stats?.recentBookings || stats.recentBookings.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">
                      No recent bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by room chart */}
        <Card>
          <CardHeader>
            <CardTitle>Most Booked Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminBookingsByRoomChart data={stats?.bookingsByRoom || []} />
          </CardContent>
        </Card>
        
        {/* Room utilization chart */}
        <Card>
          <CardHeader>
            <CardTitle>Room Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminRoomUtilizationChart data={stats?.roomUtilization || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
