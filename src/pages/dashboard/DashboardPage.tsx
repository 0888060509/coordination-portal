
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DoorClosed, Users, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock data
  const stats = [
    {
      title: "Total Rooms",
      value: "12",
      description: "Available meeting spaces",
      icon: <DoorClosed className="h-5 w-5" />,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    {
      title: "Today's Meetings",
      value: "8",
      description: "Scheduled for today",
      icon: <Calendar className="h-5 w-5" />,
      color: "text-indigo-500",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Active Users",
      value: "24",
      description: "Using the platform today",
      icon: <Users className="h-5 w-5" />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Average Booking",
      value: "1.5h",
      description: "Meeting duration",
      icon: <Clock className="h-5 w-5" />,
      color: "text-amber-500",
      bgColor: "bg-amber-100",
    },
  ];

  // Mock upcoming meetings
  const upcomingMeetings = [
    {
      id: 1,
      title: "Product Roadmap Discussion",
      room: "Imagination Room",
      time: "Today, 11:00 AM - 12:00 PM",
      attendees: 8,
    },
    {
      id: 2,
      title: "Quarterly Planning Session",
      room: "Strategy Room",
      time: "Today, 2:00 PM - 4:00 PM",
      attendees: 12,
    },
    {
      id: 3,
      title: "UX Design Review",
      room: "Creativity Room",
      time: "Tomorrow, 10:30 AM - 11:30 AM",
      attendees: 5,
    },
  ];

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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} ${stat.color} p-2 rounded-md`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
            <CardDescription>
              Your scheduled meetings for today and tomorrow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                  onClick={() => navigate(`/bookings/${meeting.id}`)}
                >
                  <div className="w-10 h-10 rounded-full bg-meeting-primary flex items-center justify-center text-white font-medium mr-3 flex-shrink-0">
                    {meeting.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {meeting.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {meeting.room} • {meeting.time}
                    </p>
                    <div className="flex items-center mt-1">
                      <Users className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {meeting.attendees} attendees
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => navigate("/bookings")}
              >
                View All Meetings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Room Availability</CardTitle>
            <CardDescription>
              Currently available meeting rooms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mock room availability data */}
              <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/30 rounded-md">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium">Imagination Room</span>
                </div>
                <Button
                  size="sm"
                  className="bg-meeting-secondary hover:bg-teal-600"
                  onClick={() => navigate("/bookings")}
                >
                  Book
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/30 rounded-md">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium">Innovation Lab</span>
                </div>
                <Button
                  size="sm"
                  className="bg-meeting-secondary hover:bg-teal-600"
                  onClick={() => navigate("/bookings")}
                >
                  Book
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/30 rounded-md">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="font-medium">Strategy Room</span>
                </div>
                <span className="text-xs text-red-600 dark:text-red-400">
                  Booked until 4:00 PM
                </span>
              </div>

              <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/30 rounded-md">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium">Creativity Room</span>
                </div>
                <Button
                  size="sm"
                  className="bg-meeting-secondary hover:bg-teal-600"
                  onClick={() => navigate("/bookings")}
                >
                  Book
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => navigate("/rooms")}
              >
                View All Rooms
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
