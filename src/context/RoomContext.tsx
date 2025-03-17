
import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { RoomFilterOptions, RoomWithAmenities } from '@/types';
import { Amenity } from '@/types/room';
import { addMinutes } from 'date-fns';

// Define the state shape
interface RoomState {
  filters: RoomFilterOptions;
  searchResults: RoomWithAmenities[];
  availableRooms: RoomWithAmenities[];
  allAmenities: Amenity[];
  isLoading: boolean;
  error: Error | null;
  lastSearchTime: string | null;
}

// Initial state
const initialState: RoomState = {
  filters: {
    capacity: 1,
    date: new Date(),
    startTime: '09:00',
    endTime: '10:00',
    sortBy: 'name',
  },
  searchResults: [],
  availableRooms: [],
  allAmenities: [],
  isLoading: false,
  error: null,
  lastSearchTime: null,
};

// Action types
type RoomAction =
  | { type: 'SET_FILTERS'; payload: Partial<RoomFilterOptions> }
  | { type: 'SET_SEARCH_RESULTS'; payload: RoomWithAmenities[] }
  | { type: 'SET_AVAILABLE_ROOMS'; payload: RoomWithAmenities[] }
  | { type: 'SET_ALL_AMENITIES'; payload: Amenity[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_LAST_SEARCH_TIME'; payload: string }
  | { type: 'RESET_FILTERS' }
  | { type: 'LOAD_SAVED_STATE'; payload: Partial<RoomState> };

// Reducer function
function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case 'SET_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };
    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: action.payload,
      };
    case 'SET_AVAILABLE_ROOMS':
      return {
        ...state,
        availableRooms: action.payload,
      };
    case 'SET_ALL_AMENITIES':
      return {
        ...state,
        allAmenities: action.payload,
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
    case 'SET_LAST_SEARCH_TIME':
      return {
        ...state,
        lastSearchTime: action.payload,
      };
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: initialState.filters,
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
interface RoomContextType {
  state: RoomState;
  updateFilters: (filters: Partial<RoomFilterOptions>) => void;
  setSearchResults: (rooms: RoomWithAmenities[]) => void;
  setAvailableRooms: (rooms: RoomWithAmenities[]) => void;
  setAllAmenities: (amenities: Amenity[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  setLastSearchTime: (time: string) => void;
  resetFilters: () => void;
  saveStateToStorage: () => void;
  loadStateFromStorage: () => void;
  sortRooms: (rooms: RoomWithAmenities[]) => RoomWithAmenities[];
  filterRooms: (rooms: RoomWithAmenities[]) => RoomWithAmenities[];
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

// Storage keys
const ROOM_STATE_STORAGE_KEY = 'room_search_state';

// Provider component
export function RoomProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(roomReducer, initialState);

  const updateFilters = useCallback((filters: Partial<RoomFilterOptions>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const setSearchResults = useCallback((rooms: RoomWithAmenities[]) => {
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: rooms });
  }, []);

  const setAvailableRooms = useCallback((rooms: RoomWithAmenities[]) => {
    dispatch({ type: 'SET_AVAILABLE_ROOMS', payload: rooms });
  }, []);

  const setAllAmenities = useCallback((amenities: Amenity[]) => {
    dispatch({ type: 'SET_ALL_AMENITIES', payload: amenities });
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }, []);

  const setError = useCallback((error: Error | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setLastSearchTime = useCallback((time: string) => {
    dispatch({ type: 'SET_LAST_SEARCH_TIME', payload: time });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  const saveStateToStorage = useCallback(() => {
    try {
      // Don't save everything to avoid storage bloat
      const stateToSave = {
        filters: state.filters,
        lastSearchTime: state.lastSearchTime,
      };
      localStorage.setItem(ROOM_STATE_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save room state to storage:', error);
    }
  }, [state.filters, state.lastSearchTime]);

  const loadStateFromStorage = useCallback(() => {
    try {
      const savedState = localStorage.getItem(ROOM_STATE_STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Convert ISO strings back to Date objects if needed
        if (parsedState.filters && parsedState.filters.date) {
          parsedState.filters.date = new Date(parsedState.filters.date);
        }
        
        dispatch({ type: 'LOAD_SAVED_STATE', payload: parsedState });
      }
    } catch (error) {
      console.error('Failed to load room state from storage:', error);
    }
  }, []);

  // Sort rooms based on current sort criteria
  const sortRooms = useCallback(
    (rooms: RoomWithAmenities[]): RoomWithAmenities[] => {
      const { sortBy } = state.filters;
      
      if (!sortBy) return rooms;
      
      return [...rooms].sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'capacity':
            comparison = a.capacity - b.capacity;
            break;
          case 'capacity_asc':
            comparison = a.capacity - b.capacity;
            break;
          default:
            comparison = 0;
        }
        
        return sortBy === 'capacity_asc' ? comparison : -comparison;
      });
    },
    [state.filters]
  );

  // Filter rooms based on current filter criteria
  const filterRooms = useCallback(
    (rooms: RoomWithAmenities[]): RoomWithAmenities[] => {
      const { capacity, location, amenities, searchQuery } = state.filters;
      
      return rooms.filter(room => {
        // Filter by capacity
        if (capacity !== undefined && room.capacity < capacity) {
          return false;
        }
        
        // Filter by location
        if (location && !room.location.toLowerCase().includes(location.toLowerCase())) {
          return false;
        }
        
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = room.name.toLowerCase().includes(query);
          const matchesLocation = room.location.toLowerCase().includes(query);
          const matchesDescription = room.description?.toLowerCase().includes(query) || false;
          
          if (!matchesName && !matchesLocation && !matchesDescription) {
            return false;
          }
        }
        
        // Filter by amenities
        if (amenities && amenities.length > 0) {
          const roomAmenityIds = room.amenities.map(a => a.id);
          const hasAllAmenities = amenities.every(amenityId => 
            roomAmenityIds.includes(amenityId)
          );
          
          if (!hasAllAmenities) {
            return false;
          }
        }
        
        return true;
      });
    },
    [state.filters]
  );

  // Auto-save state when filters change
  React.useEffect(() => {
    saveStateToStorage();
  }, [state.filters, saveStateToStorage]);

  const value = {
    state,
    updateFilters,
    setSearchResults,
    setAvailableRooms,
    setAllAmenities,
    setLoading,
    setError,
    setLastSearchTime,
    resetFilters,
    saveStateToStorage,
    loadStateFromStorage,
    sortRooms,
    filterRooms,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

// Hook to use the room context
export function useRooms() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRooms must be used within a RoomProvider');
  }
  return context;
}
