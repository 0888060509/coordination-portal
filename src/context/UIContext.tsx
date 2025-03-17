
import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';

// Define the state shape
interface UIState {
  sidebarOpen: boolean;
  currentView: 'calendar' | 'list' | 'grid';
  dateRangeView: 'day' | 'week' | 'month';
  selectedDate: Date;
  isMobile: boolean;
  modalState: {
    isOpen: boolean;
    type: string | null;
    data: any;
  };
}

// Initial state
const initialState: UIState = {
  sidebarOpen: true,
  currentView: 'grid',
  dateRangeView: 'week',
  selectedDate: new Date(),
  isMobile: window.innerWidth < 768,
  modalState: {
    isOpen: false,
    type: null,
    data: null,
  },
};

// Action types
type UIAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_CURRENT_VIEW'; payload: 'calendar' | 'list' | 'grid' }
  | { type: 'SET_DATE_RANGE_VIEW'; payload: 'day' | 'week' | 'month' }
  | { type: 'SET_SELECTED_DATE'; payload: Date }
  | { type: 'SET_IS_MOBILE'; payload: boolean }
  | { type: 'OPEN_MODAL'; payload: { type: string; data?: any } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'LOAD_SAVED_STATE'; payload: Partial<UIState> };

// Reducer function
function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };
    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        sidebarOpen: action.payload,
      };
    case 'SET_CURRENT_VIEW':
      return {
        ...state,
        currentView: action.payload,
      };
    case 'SET_DATE_RANGE_VIEW':
      return {
        ...state,
        dateRangeView: action.payload,
      };
    case 'SET_SELECTED_DATE':
      return {
        ...state,
        selectedDate: action.payload,
      };
    case 'SET_IS_MOBILE':
      return {
        ...state,
        isMobile: action.payload,
        // Auto-close sidebar on mobile
        sidebarOpen: action.payload ? false : state.sidebarOpen,
      };
    case 'OPEN_MODAL':
      return {
        ...state,
        modalState: {
          isOpen: true,
          type: action.payload.type,
          data: action.payload.data || null,
        },
      };
    case 'CLOSE_MODAL':
      return {
        ...state,
        modalState: {
          isOpen: false,
          type: null,
          data: null,
        },
      };
    case 'LOAD_SAVED_STATE':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}

// Create context
interface UIContextType {
  state: UIState;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setCurrentView: (view: 'calendar' | 'list' | 'grid') => void;
  setDateRangeView: (view: 'day' | 'week' | 'month') => void;
  setSelectedDate: (date: Date) => void;
  openModal: (type: string, data?: any) => void;
  closeModal: () => void;
  saveStateToStorage: () => void;
  loadStateFromStorage: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

// Storage keys
const UI_STATE_STORAGE_KEY = 'meeting_master_ui_state';

// Provider component
export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);
  const { setTheme } = useTheme();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile !== state.isMobile) {
        dispatch({ type: 'SET_IS_MOBILE', payload: isMobile });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [state.isMobile]);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const setSidebarOpen = useCallback((isOpen: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: isOpen });
  }, []);

  const setCurrentView = useCallback((view: 'calendar' | 'list' | 'grid') => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
  }, []);

  const setDateRangeView = useCallback((view: 'day' | 'week' | 'month') => {
    dispatch({ type: 'SET_DATE_RANGE_VIEW', payload: view });
  }, []);

  const setSelectedDate = useCallback((date: Date) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  }, []);

  const openModal = useCallback((type: string, data?: any) => {
    dispatch({ type: 'OPEN_MODAL', payload: { type, data } });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  const saveStateToStorage = useCallback(() => {
    try {
      // Save only persistent UI preferences
      const stateToSave = {
        currentView: state.currentView,
        dateRangeView: state.dateRangeView,
      };
      localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save UI state to storage:', error);
    }
  }, [state.currentView, state.dateRangeView]);

  const loadStateFromStorage = useCallback(() => {
    try {
      const savedState = localStorage.getItem(UI_STATE_STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'LOAD_SAVED_STATE', payload: parsedState });
      }
    } catch (error) {
      console.error('Failed to load UI state from storage:', error);
    }
  }, []);

  // Save state when relevant parts change
  useEffect(() => {
    saveStateToStorage();
  }, [state.currentView, state.dateRangeView, saveStateToStorage]);

  // Load state on initial render
  useEffect(() => {
    loadStateFromStorage();
  }, [loadStateFromStorage]);

  const value = {
    state,
    toggleSidebar,
    setSidebarOpen,
    setCurrentView,
    setDateRangeView,
    setSelectedDate,
    openModal,
    closeModal,
    saveStateToStorage,
    loadStateFromStorage,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

// Hook to use the UI context
export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
