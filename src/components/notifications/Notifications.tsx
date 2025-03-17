
import { useState, useEffect, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import * as notificationService from '@/services/notificationService';
import { Notification, NotificationType } from '@/types/booking';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) => {
  const getIconForType = (type: NotificationType) => {
    switch(type) {
      case 'confirmation': return '✅';
      case 'reminder': return '⏰';
      case 'update': return '🔄';
      case 'cancellation': return '❌';
      default: return '📢';
    }
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div 
      className={`p-3 hover:bg-muted/50 cursor-pointer ${notification.is_read ? 'opacity-60' : ''}`}
      onClick={handleClick}
    >
      <div className="flex gap-2">
        <div className="text-xl">{getIconForType(notification.type)}</div>
        <div className="flex-1">
          <p className="text-sm font-medium">{notification.message}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        {!notification.is_read && (
          <div className="w-2 h-2 rounded-full bg-blue-500 self-start mt-1"></div>
        )}
      </div>
    </div>
  );
};

const Notifications = () => {
  const { user, session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.is_read).length, 
    [notifications]
  );

  const loadNotifications = async () => {
    if (!user?.id) {
      console.log("User not authenticated, skipping notification fetch");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching notifications for user:", user.id);
      const data = await notificationService.fetchNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [user?.id]);

  useEffect(() => {
    // Subscribe to real-time updates if user is authenticated
    if (!user?.id) return;

    const subscription = notificationService.subscribeToNotifications(
      user.id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user?.id]);

  const handleMarkAsRead = async (id: string) => {
    if (!user?.id) return;
    
    try {
      await notificationService.markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await notificationService.markAllNotificationsAsRead(user.id);
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // For first-time loading or when not authenticated
  if (isLoading && notifications.length === 0) {
    return (
      <Button variant="ghost" size="icon" className="relative" disabled>
        <Bell className="h-5 w-5 opacity-50" />
      </Button>
    );
  }

  // Don't render full component if user is not authenticated
  if (!user?.id) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-3">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-auto py-1"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        {error && (
          <div className="p-4 text-center text-red-500">
            {error}
          </div>
        )}
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length > 0 ? (
            <div>
              {notifications.map(notification => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default Notifications;
