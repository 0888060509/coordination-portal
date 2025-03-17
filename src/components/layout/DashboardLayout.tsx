
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { 
  Menu, X, ChevronDown, LayoutDashboard, Calendar, 
  Settings, LogOut, Users, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import NavItem from "./NavItem";
import MobileNavItem from "./MobileNavItem";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import Notifications from "../notifications/Notifications";
import { fetchUserProfile } from "@/services/profileService";

const DashboardLayout = () => {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // Use the logout function from the context
  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navigation */}
      <header className="sticky top-0 z-30 bg-background border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/dashboard" className="font-bold text-xl flex items-center mr-8">
              <Calendar className="h-5 w-5 mr-2" />
              <span>MeetingMaster</span>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <NavItem to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
                Dashboard
              </NavItem>
              
              <NavItem to="/rooms" icon={<BookOpen className="h-4 w-4" />}>
                Rooms
              </NavItem>
              
              <NavItem to="/bookings" icon={<Calendar className="h-4 w-4" />}>
                Bookings
              </NavItem>

              {isAuthenticated && isAdmin && (
                <NavItem to="/admin" icon={<Users className="h-4 w-4" />}>
                  Admin
                </NavItem>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Notifications />

            {/* Profile menu */}
            {isAuthenticated && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.firstName} />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile navigation trigger */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64">
          <div className="flex flex-col h-full">
            <Link to="/dashboard" className="font-bold text-xl flex items-center py-4 mb-4" onClick={() => setOpen(false)}>
              <Calendar className="h-5 w-5 mr-2" />
              <span>MeetingMaster</span>
            </Link>
            
            <nav className="flex flex-col gap-2">
              <MobileNavItem 
                to="/dashboard" 
                icon={<LayoutDashboard className="h-5 w-5" />} 
                onClick={() => setOpen(false)}
              >
                Dashboard
              </MobileNavItem>
              
              <MobileNavItem 
                to="/rooms" 
                icon={<BookOpen className="h-5 w-5" />} 
                onClick={() => setOpen(false)}
              >
                Rooms
              </MobileNavItem>
              
              <MobileNavItem 
                to="/bookings" 
                icon={<Calendar className="h-5 w-5" />} 
                onClick={() => setOpen(false)}
              >
                Bookings
              </MobileNavItem>

              {isAuthenticated && isAdmin && (
                <MobileNavItem 
                  to="/admin" 
                  icon={<Users className="h-5 w-5" />} 
                  onClick={() => setOpen(false)}
                >
                  Admin
                </MobileNavItem>
              )}
              
              <MobileNavItem 
                to="/settings" 
                icon={<Settings className="h-5 w-5" />} 
                onClick={() => setOpen(false)}
              >
                Settings
              </MobileNavItem>
            </nav>

            <div className="mt-auto pb-4">
              {isAuthenticated && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    handleSignOut();
                    setOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 container py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MeetingMaster. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">Version 1.0.0</p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
