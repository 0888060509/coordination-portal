
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Home, Calendar, Search, List, Settings, HelpCircle, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUIContext } from '@/context/UIContext';
import { useNotificationContext } from '@/context/NotificationContext';

const Sidebar = () => {
  const { state: uiState } = useUIContext();
  const { state: notificationState } = useNotificationContext();
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Find Rooms', icon: Search, path: '/rooms' },
    { name: 'My Bookings', icon: Calendar, path: '/bookings' },
    { 
      name: 'Notifications', 
      icon: Bell, 
      path: '/notifications',
      badge: notificationState.unreadCount > 0 ? notificationState.unreadCount : undefined
    },
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'Help', icon: HelpCircle, path: '/help' },
  ];
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  return (
    <aside
      className={cn(
        "fixed left-0 h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-200 z-20 overflow-x-hidden overflow-y-auto",
        uiState.sidebarOpen ? "w-60" : "w-[70px]"
      )}
    >
      <div className="flex flex-col h-full py-4">
        <div className="px-4 mb-8">
          <h1 className={cn(
            "font-bold truncate transition-all",
            uiState.sidebarOpen ? "text-xl text-left" : "text-sm text-center"
          )}>
            {uiState.sidebarOpen ? 'Room Booking' : 'RB'}
          </h1>
        </div>
        
        <div className="flex-1 space-y-1">
          {navItems.map((item) => (
            <div
              key={item.name}
              className="relative mx-2"
              title={uiState.sidebarOpen ? undefined : item.name}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center px-4 py-3 rounded-md transition-colors",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {uiState.sidebarOpen && (
                  <span className="ml-4 truncate">{item.name}</span>
                )}
                {item.badge && (
                  <Badge 
                    variant="destructive"
                    className={cn(
                      "absolute rounded-full",
                      uiState.sidebarOpen 
                        ? "right-4 top-3" 
                        : "right-1/2 top-1 translate-x-1/2"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            </div>
          ))}
        </div>
        
        <div className="mt-4 border-t border-sidebar-border pt-4 px-4">
          <div className="text-xs text-center text-muted-foreground">
            {uiState.sidebarOpen ? 'Room Booking System v1.0' : 'v1.0'}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
