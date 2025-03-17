
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  SidebarProvider, 
  Sidebar as ShadcnSidebar, 
  SidebarContent, 
  SidebarTrigger,
  SidebarHeader,
  SidebarMenu,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
  SidebarRail,
  SidebarInset
} from "@/components/ui/sidebar";
import RoomList from "@/components/rooms/RoomList";
import NavItem from "@/components/layout/NavItem";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RoomsPage = () => {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";
  
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <ShadcnSidebar>
          <SidebarRail />
          <SidebarHeader>
            <div className="flex items-center space-x-2 p-2">
              <div className="h-8 w-8 rounded-full bg-meeting-primary flex items-center justify-center">
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
                    icon="dashboard"
                    to="/dashboard"
                    isActive={location.pathname === '/dashboard'}
                  >
                    Dashboard
                  </NavItem>
                  <NavItem
                    icon="rooms"
                    to="/rooms"
                    isActive={location.pathname === '/rooms'}
                  >
                    Rooms
                  </NavItem>
                  <NavItem
                    icon="bookings"
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
                      icon="admin"
                      to="/admin"
                      isActive={location.pathname === '/admin'}
                    >
                      Dashboard
                    </NavItem>
                    <NavItem
                      icon="roomManagement"
                      to="/admin/rooms"
                      isActive={location.pathname === '/admin/rooms'}
                    >
                      Room Management
                    </NavItem>
                    <NavItem
                      icon="userManagement"
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
                    <AvatarImage src={user?.avatarUrl} alt={user?.name || ""} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user?.name}</p>
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
        </ShadcnSidebar>
        
        <SidebarInset>
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Rooms</h1>
              <SidebarTrigger />
            </div>
            <div className="space-y-6">
              <RoomList />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default RoomsPage;
