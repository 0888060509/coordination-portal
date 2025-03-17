
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface UIState {
  sidebarOpen: boolean;
}

interface UIContextType {
  state: UIState;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const UI_STATE_KEY = 'meetingmaster_ui_state';

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile();
  const [state, setState] = useState<UIState>(() => {
    // Load saved state from localStorage
    try {
      const savedState = localStorage.getItem(UI_STATE_KEY);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error('Error loading UI state from localStorage:', error);
    }
    // Default state
    return {
      sidebarOpen: !isMobile
    };
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(UI_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving UI state to localStorage:', error);
    }
  }, [state]);

  // Close sidebar on mobile by default
  useEffect(() => {
    if (isMobile) {
      setState(prev => ({
        ...prev,
        sidebarOpen: false
      }));
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setState(prev => ({
      ...prev,
      sidebarOpen: !prev.sidebarOpen
    }));
  };

  const setSidebarOpen = (open: boolean) => {
    setState(prev => ({
      ...prev,
      sidebarOpen: open
    }));
  };

  return (
    <UIContext.Provider value={{ state, toggleSidebar, setSidebarOpen }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUIContext = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
};
