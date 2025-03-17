
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Users, Settings,
  LogOut, HelpCircle, Bell, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useUIContext } from '@/context/UIContext';
import NavItem from './NavItem';
import { Button } from '@/components/ui/button';
import { SidebarProvider } from '@/components/ui/sidebar';

const Sidebar = () => {
  const { isAdmin, logout } = useAuth();
  const { state: uiState } = useUIContext();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <SidebarProvider>
      <aside 
        className={cn(
          "fixed left-0 top-0 z-20 h-screen bg-background border-r transition-all duration-200",
          uiState.sidebarOpen ? "w-60" : "w-[70px]"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-4 border-b">
            <NavLink 
              to="/dashboard" 
              className="flex items-center gap-2 font-bold text-xl"
            >
              <Calendar className="h-6 w-6" />
              {uiState.sidebarOpen && <span>MeetingMaster</span>}
            </NavLink>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavItem 
              to="/dashboard" 
              icon={<LayoutDashboard />} 
              label="Dashboard" 
              expanded={uiState.sidebarOpen}
            />
            
            <NavItem 
              to="/rooms" 
              icon={<BookOpen />} 
              label="Rooms" 
              expanded={uiState.sidebarOpen}
            />
            
            <NavItem 
              to="/bookings" 
              icon={<Calendar />} 
              label="Bookings" 
              expanded={uiState.sidebarOpen}
            />
            
            <NavItem 
              to="/notifications" 
              icon={<Bell />} 
              label="Notifications" 
              expanded={uiState.sidebarOpen}
            />
            
            {isAdmin && (
              <NavItem 
                to="/admin" 
                icon={<Users />} 
                label="Admin" 
                expanded={uiState.sidebarOpen}
              />
            )}
            
            <NavItem 
              to="/help" 
              icon={<HelpCircle />} 
              label="Help" 
              expanded={uiState.sidebarOpen}
            />
            
            <NavItem 
              to="/settings" 
              icon={<Settings />} 
              label="Settings" 
              expanded={uiState.sidebarOpen}
            />
          </nav>

          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start",
                !uiState.sidebarOpen && "justify-center p-2"
              )}
              onClick={handleLogout}
            >
              <LogOut className={cn("h-5 w-5", uiState.sidebarOpen && "mr-2")} />
              {uiState.sidebarOpen && <span>Logout</span>}
            </Button>
          </div>
        </div>
      </aside>
    </SidebarProvider>
  );
};

export default Sidebar;
