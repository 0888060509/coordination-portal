
import React, { createContext, useContext, useState } from 'react';

type NotificationType = 'confirmation' | 'reminder' | 'update' | 'cancellation';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

interface NotificationContextType {
  state: NotificationState;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0
  });

  const markAsRead = (id: string) => {
    setState(prev => {
      const updatedNotifications = prev.notifications.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      );
      
      return {
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.is_read).length
      };
    });
  };

  const markAllAsRead = () => {
    setState(prev => ({
      notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0
    }));
  };

  return (
    <NotificationContext.Provider value={{ state, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
