
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuHandler, MenuContent, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Menu as MenuIcon, 
  User, 
  LogOut, 
  Settings, 
  Moon, 
  Sun, 
  Bell 
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthContext } from '@/context/AuthContext';
import { useUIContext } from '@/context/UIContext';
import { useNotificationContext } from '@/context/NotificationContext';

const Header = () => {
  const { user, signOut } = useAuthContext();
  const { toggleSidebar } = useUIContext();
  const { theme, setTheme } = useTheme();
  const { state: notificationState } = useNotificationContext();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };
  
  const handleNotificationsClick = () => {
    navigate('/notifications');
  };
  
  const getUserInitials = () => {
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };
  
  return (
    <header className="fixed top-0 w-full h-16 bg-background border-b border-border z-15 px-4 flex items-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="mr-2"
        aria-label="Toggle Sidebar"
      >
        <MenuIcon className="h-5 w-5" />
      </Button>
      
      <h1 className="font-bold text-lg hidden md:block">
        Room Booking System
      </h1>
      
      <div className="flex-1"></div>
      
      <div className="flex items-center gap-2">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNotificationsClick}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Button>
          
          {notificationState.unreadCount > 0 && (
            <Badge 
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs"
            >
              {notificationState.unreadCount}
            </Badge>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
        
        <Menu>
          <MenuHandler>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </MenuHandler>
          <MenuContent align="end">
            <div className="px-3 py-2 text-sm font-medium border-b border-border">
              {user?.email}
            </div>
            <MenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </MenuItem>
            <MenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </MenuItem>
            <MenuSeparator />
            <MenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </header>
  );
};

export default Header;
