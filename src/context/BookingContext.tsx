
import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { Room, RoomWithAmenities } from '@/types/room';
import { BookingWithDetails, CreateBookingData, RecurringPatternRequest } from '@/types/booking';
import { addDays } from 'date-fns';

// Define the state shape
interface BookingState {
  currentStep: number;
  formData: Partial<CreateBookingData>;
  selectedRoom: RoomWithAmenities | null;
  validationErrors: Record<string, string>;
  isSubmitting: boolean;
  bookingSuccess: boolean;
  bookingError: Error | null;
  recurringPattern: RecurringPatternRequest | null;
}

// Initial state
const initialRecurringPattern: RecurringPatternRequest = {
  frequency: 'weekly',
  interval: 1,
  daysOfWeek: [new Date().getDay() || 7], // Current day of week (1-7)
  endDate: addDays(new Date(), 30),
};

const initialState: BookingState = {
  currentStep: 0,
  formData: {
    title: '',
    description: '',
    start_time: new Date(),
    end_time: addDays(new Date(), 1),
    attendees: [],
    meeting_type: 'regular',
    equipment_needed: [],
    special_requests: '',
  },
  selectedRoom: null,
  validationErrors: {},
  isSubmitting: false,
  bookingSuccess: false,
  bookingError: null,
  recurringPattern: null,
};

// Action types
type BookingAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<CreateBookingData> }
  | { type: 'SET_SELECTED_ROOM'; payload: RoomWithAmenities | null }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, string> }
  | { type: 'CLEAR_VALIDATION_ERRORS' }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_BOOKING_SUCCESS'; payload: boolean }
  | { type: 'SET_BOOKING_ERROR'; payload: Error | null }
  | { type: 'SET_RECURRING_PATTERN'; payload: RecurringPatternRequest | null }
  | { type: 'RESET_FORM' }
  | { type: 'LOAD_SAVED_STATE'; payload: Partial<BookingState> };

// Reducer function
function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    case 'UPDATE_FORM_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload,
        },
      };
    case 'SET_SELECTED_ROOM':
      return {
        ...state,
        selectedRoom: action.payload,
        formData: {
          ...state.formData,
          room_id: action.payload?.id || state.formData.room_id,
        },
      };
    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.payload,
      };
    case 'CLEAR_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: {},
      };
    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload,
      };
    case 'SET_BOOKING_SUCCESS':
      return {
        ...state,
        bookingSuccess: action.payload,
      };
    case 'SET_BOOKING_ERROR':
      return {
        ...state,
        bookingError: action.payload,
      };
    case 'SET_RECURRING_PATTERN':
      return {
        ...state,
        recurringPattern: action.payload,
      };
    case 'RESET_FORM':
      return {
        ...initialState,
        // Preserve the selected date/time range
        formData: {
          ...initialState.formData,
          start_time: state.formData.start_time,
          end_time: state.formData.end_time,
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
interface BookingContextType {
  state: BookingState;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  updateFormData: (data: Partial<CreateBookingData>) => void;
  setSelectedRoom: (room: RoomWithAmenities | null) => void;
  validateStep: (step: number) => boolean;
  setValidationErrors: (errors: Record<string, string>) => void;
  clearValidationErrors: () => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setBookingSuccess: (success: boolean) => void;
  setBookingError: (error: Error | null) => void;
  setRecurringPattern: (pattern: RecurringPatternRequest | null) => void;
  resetForm: () => void;
  saveStateToStorage: () => void;
  loadStateFromStorage: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Storage keys
const BOOKING_STATE_STORAGE_KEY = 'room_booking_state';

// Provider component
export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const nextStep = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
  }, [state.currentStep]);

  const prevStep = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: Math.max(0, state.currentStep - 1) });
  }, [state.currentStep]);

  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const updateFormData = useCallback((data: Partial<CreateBookingData>) => {
    dispatch({ type: 'UPDATE_FORM_DATA', payload: data });
  }, []);

  const setSelectedRoom = useCallback((room: RoomWithAmenities | null) => {
    dispatch({ type: 'SET_SELECTED_ROOM', payload: room });
  }, []);

  const validateStep = useCallback(
    (step: number): boolean => {
      const errors: Record<string, string> = {};

      // Validation for step 0 (Room and Time Selection)
      if (step === 0) {
        if (!state.formData.room_id) {
          errors.room_id = 'Please select a room';
        }
        if (!state.formData.start_time) {
          errors.start_time = 'Please select a start time';
        }
        if (!state.formData.end_time) {
          errors.end_time = 'Please select an end time';
        }
        
        // Validate end time is after start time
        if (state.formData.start_time && state.formData.end_time) {
          const start = new Date(state.formData.start_time);
          const end = new Date(state.formData.end_time);
          if (end <= start) {
            errors.end_time = 'End time must be after start time';
          }
        }
      }

      // Validation for step 1 (Meeting Details)
      if (step === 1) {
        if (!state.formData.title || state.formData.title.trim() === '') {
          errors.title = 'Please enter a title for your booking';
        } else if (state.formData.title.length > 100) {
          errors.title = 'Title must be at most 100 characters';
        }
      }

      // Validation for step 2 (Attendees and Resources)
      if (step === 2) {
        // Validate email format for attendees
        if (state.formData.attendees && state.formData.attendees.length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          state.formData.attendees.forEach((email, index) => {
            if (typeof email === 'string' && !emailRegex.test(email)) {
              errors[`attendee_${index}`] = `Invalid email format: ${email}`;
            }
          });
        }
      }

      // Validation for step 3 (Recurring Options)
      if (step === 3 && state.recurringPattern) {
        const { frequency, interval, daysOfWeek, endDate, maxOccurrences } = state.recurringPattern;
        
        if (!frequency) {
          errors.frequency = 'Please select a frequency';
        }
        
        if (!interval || interval < 1) {
          errors.interval = 'Interval must be at least 1';
        }
        
        if (frequency === 'weekly' && (!daysOfWeek || daysOfWeek.length === 0)) {
          errors.days_of_week = 'Please select at least one day of the week';
        }
        
        if (!endDate && !maxOccurrences) {
          errors.end_condition = 'Please specify either an end date or maximum number of occurrences';
        }
      }

      if (Object.keys(errors).length > 0) {
        dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
        return false;
      }

      dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
      return true;
    },
    [state.formData, state.recurringPattern]
  );

  const setValidationErrors = useCallback((errors: Record<string, string>) => {
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
  }, []);

  const clearValidationErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
  }, []);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', payload: isSubmitting });
  }, []);

  const setBookingSuccess = useCallback((success: boolean) => {
    dispatch({ type: 'SET_BOOKING_SUCCESS', payload: success });
  }, []);

  const setBookingError = useCallback((error: Error | null) => {
    dispatch({ type: 'SET_BOOKING_ERROR', payload: error });
  }, []);

  const setRecurringPattern = useCallback((pattern: RecurringPatternRequest | null) => {
    dispatch({ type: 'SET_RECURRING_PATTERN', payload: pattern });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  const saveStateToStorage = useCallback(() => {
    try {
      // Don't save everything to avoid storage bloat
      const stateToSave = {
        currentStep: state.currentStep,
        formData: state.formData,
        selectedRoom: state.selectedRoom,
        recurringPattern: state.recurringPattern,
      };
      localStorage.setItem(BOOKING_STATE_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save booking state to storage:', error);
    }
  }, [state]);

  const loadStateFromStorage = useCallback(() => {
    try {
      const savedState = localStorage.getItem(BOOKING_STATE_STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Convert ISO strings back to Date objects if needed
        if (parsedState.formData) {
          if (parsedState.formData.start_time) {
            parsedState.formData.start_time = new Date(parsedState.formData.start_time);
          }
          if (parsedState.formData.end_time) {
            parsedState.formData.end_time = new Date(parsedState.formData.end_time);
          }
        }
        
        if (parsedState.recurringPattern?.endDate) {
          parsedState.recurringPattern.endDate = new Date(parsedState.recurringPattern.endDate);
        }
        
        dispatch({ type: 'LOAD_SAVED_STATE', payload: parsedState });
      }
    } catch (error) {
      console.error('Failed to load booking state from storage:', error);
    }
  }, []);

  // Auto-save state when it changes
  React.useEffect(() => {
    saveStateToStorage();
  }, [state.currentStep, state.formData, state.selectedRoom, state.recurringPattern, saveStateToStorage]);

  const value = {
    state,
    nextStep,
    prevStep,
    goToStep,
    updateFormData,
    setSelectedRoom,
    validateStep,
    setValidationErrors,
    clearValidationErrors,
    setSubmitting,
    setBookingSuccess,
    setBookingError,
    setRecurringPattern,
    resetForm,
    saveStateToStorage,
    loadStateFromStorage,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

// Hook to use the booking context - Export as both names for compatibility
export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}

// Alias for backward compatibility
export const useBookingContext = useBooking;
