
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats as DashboardStatsType } from "@/services/dashboardService";
import { DoorClosed, Clock, Calendar, Users } from "lucide-react";
import { formatDuration } from "@/utils/formatUtils";

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const formatMinutes = (minutes: number) => {
    return formatDuration(minutes);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Bookings
          </CardTitle>
          <div className="bg-blue-100 text-blue-500 p-2 rounded-md">
            <Calendar className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBookings}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            All time bookings
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Today's Meetings
          </CardTitle>
          <div className="bg-indigo-100 text-indigo-500 p-2 rounded-md">
            <Calendar className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayBookings}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Scheduled for today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Favorite Room
          </CardTitle>
          <div className="bg-emerald-100 text-emerald-500 p-2 rounded-md">
            <DoorClosed className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate">
            {stats.favoriteRoom ? stats.favoriteRoom.name : "N/A"}
          </div>
          {stats.favoriteRoom && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Used {stats.favoriteRoom.bookingCount} times
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Average Duration
          </CardTitle>
          <div className="bg-amber-100 text-amber-500 p-2 rounded-md">
            <Clock className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatMinutes(stats.bookingDuration.average)}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Per meeting
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
