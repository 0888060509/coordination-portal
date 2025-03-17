
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { DashboardData } from "@/services/dashboardService";
import dashboardService from "@/services/dashboardService";
import { Button } from "@/components/ui/button";
import { DoorClosed, Calendar } from "lucide-react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { BookingCharts } from "@/components/dashboard/BookingCharts";
import { UpcomingBookings } from "@/components/dashboard/UpcomingBookings";
import { AvailableRooms } from "@/components/dashboard/AvailableRooms";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const renderSkeletons = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.name}! Here's what's happening today.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate("/rooms")}
            className="bg-meeting-primary hover:bg-blue-600"
          >
            <DoorClosed className="h-4 w-4 mr-2" />
            View Rooms
          </Button>
          <Button
            onClick={() => navigate("/bookings")}
            className="bg-meeting-secondary hover:bg-teal-600"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Book a Room
          </Button>
        </div>
      </div>

      {loading ? (
        renderSkeletons()
      ) : dashboardData ? (
        <>
          {/* Stats Overview */}
          <DashboardStats stats={dashboardData.stats} />
          
          {/* Booking Charts */}
          <BookingCharts stats={dashboardData.stats} />
          
          {/* Upcoming Meetings and Room Availability */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingBookings 
              bookings={dashboardData.todayBookings.length > 0 ? 
                dashboardData.todayBookings : 
                dashboardData.upcomingBookings
              }
              title={dashboardData.todayBookings.length > 0 ? "Today's Meetings" : "Upcoming Meetings"}
              description={dashboardData.todayBookings.length > 0 ? 
                "Your scheduled meetings for today" : 
                "Your upcoming scheduled meetings"
              }
            />
            
            <AvailableRooms rooms={dashboardData.availableRooms} />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500 mb-4">Could not load dashboard data</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
