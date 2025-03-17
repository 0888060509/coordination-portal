
import React, { createContext, useContext, useState } from 'react';

interface UIState {
  sidebarOpen: boolean;
}

interface UIContextType {
  state: UIState;
  toggleSidebar: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UIState>({
    sidebarOpen: true
  });

  const toggleSidebar = () => {
    setState(prev => ({
      ...prev,
      sidebarOpen: !prev.sidebarOpen
    }));
  };

  return (
    <UIContext.Provider value={{ state, toggleSidebar }}>
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
