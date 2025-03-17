
import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

// Define the state shape
interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
}

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

// Action types
type NotificationAction =
  | { type: 'SET_NOTIFICATIONS'; payload: AppNotification[] }
  | { type: 'ADD_NOTIFICATION'; payload: AppNotification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null };

// Reducer function
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.isRead).length,
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
        })),
        unreadCount: 0,
      };
    case 'SET_UNREAD_COUNT':
      return {
        ...state,
        unreadCount: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
}

// Create context
interface NotificationContextType {
  state: NotificationState;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user } = useAuth();
  
  // Mock data for notifications (in a real app, this would come from an API)
  useEffect(() => {
    if (user) {
      // Load mock notifications
      const mockNotifications: AppNotification[] = [
        {
          id: '1',
          userId: user.id,
          title: 'Booking Confirmed',
          message: 'Your booking for Conference Room A has been confirmed.',
          type: 'success',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/bookings/1',
        },
        {
          id: '2',
          userId: user.id,
          title: 'Booking Reminder',
          message: 'Reminder: You have a meeting in 30 minutes.',
          type: 'info',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          link: '/bookings/2',
        },
      ];
      
      dispatch({ type: 'SET_NOTIFICATIONS', payload: mockNotifications });
    }
  }, [user]);
  
  // Add a new notification
  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    if (!user) return;
    
    const newNotification: AppNotification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
    
    // Show toast
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : undefined,
    });
  }, [user]);
  
  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  }, []);
  
  const value = {
    state,
    addNotification,
    markAsRead,
    markAllAsRead,
  };
  
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

// Hook to use the notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
