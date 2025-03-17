
import { MyBookings } from "@/components/bookings";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import NavItem from "@/components/layout/NavItem";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
} from "@/components/ui/sidebar";

const BookingsPage = () => {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  
  const userInitials = user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : "U";
  
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center space-x-2 p-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-medium text-sm">MM</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                MeetingMaster
              </h1>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <NavItem
                    to="/dashboard"
                    isActive={location.pathname === '/dashboard'}
                  >
                    Dashboard
                  </NavItem>
                  <NavItem
                    to="/rooms"
                    isActive={location.pathname === '/rooms'}
                  >
                    Rooms
                  </NavItem>
                  <NavItem
                    to="/bookings"
                    isActive={location.pathname === '/bookings'}
                  >
                    My Bookings
                  </NavItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            {isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <NavItem
                      to="/admin"
                      isActive={location.pathname === '/admin'}
                    >
                      Dashboard
                    </NavItem>
                    <NavItem
                      to="/admin/rooms"
                      isActive={location.pathname === '/admin/rooms'}
                    >
                      Room Management
                    </NavItem>
                    <NavItem
                      to="/admin/users"
                      isActive={location.pathname === '/admin/users'}
                    >
                      User Management
                    </NavItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
          
          <SidebarFooter>
            <div className="p-3">
              <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={user?.avatar_url} alt={`${user?.first_name} ${user?.last_name}`} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/profile")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset>
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <SidebarTrigger />
            </div>
            <MyBookings />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default BookingsPage;
