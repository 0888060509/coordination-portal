
import { format, parseISO, isValid, addDays, addWeeks, addMonths, addMinutes } from 'date-fns';

/**
 * Format a date to a human-readable string
 */
export const formatDate = (date: Date | string, formatString: string = 'PPP'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      console.error('Invalid date provided to formatDate:', date);
      return 'Invalid date';
    }
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a time value to a human-readable string
 */
export const formatTime = (date: Date | string, formatString: string = 'h:mm a'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      console.error('Invalid date provided to formatTime:', date);
      return 'Invalid time';
    }
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
};

/**
 * Format a date and time to a human-readable string
 */
export const formatDateTime = (date: Date | string, formatString: string = 'PPP h:mm a'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      console.error('Invalid date provided to formatDateTime:', date);
      return 'Invalid date/time';
    }
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return 'Invalid date/time';
  }
};

/**
 * Parse a time string with a date to create a Date object
 */
export const parseTimeString = (timeStr: string, date: Date): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

/**
 * Get time slots for a day
 */
export const getTimeSlots = (
  startHour: number = 8,
  endHour: number = 18,
  intervalMinutes: number = 30
): { label: string; value: string }[] => {
  const slots = [];
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  
  let currentTime = new Date(baseDate);
  currentTime.setHours(startHour, 0, 0, 0);
  
  const endTime = new Date(baseDate);
  endTime.setHours(endHour, 0, 0, 0);
  
  while (currentTime < endTime) {
    const formattedHour = currentTime.getHours().toString().padStart(2, '0');
    const formattedMinute = currentTime.getMinutes().toString().padStart(2, '0');
    
    slots.push({
      label: format(currentTime, 'h:mm a'),
      value: `${formattedHour}:${formattedMinute}`,
    });
    
    currentTime = addMinutes(currentTime, intervalMinutes);
  }
  
  return slots;
};

/**
 * Generate dates based on a recurrence pattern
 */
export const generateRecurringDates = (
  startDate: Date,
  frequency: 'daily' | 'weekly' | 'monthly',
  interval: number,
  daysOfWeek?: number[],
  endDate?: Date,
  maxOccurrences?: number
): Date[] => {
  const dates: Date[] = [new Date(startDate)];
  let currentDate = new Date(startDate);
  let occurrences = 1;
  
  // Default end date if none provided (1 year)
  const finalEndDate = endDate || addDays(startDate, 365);
  const occurrenceLimit = maxOccurrences || 1000; // Safety limit
  
  while (occurrences < occurrenceLimit) {
    // Generate next date based on frequency
    switch (frequency) {
      case 'daily':
        currentDate = addDays(currentDate, interval);
        break;
      case 'weekly':
        if (daysOfWeek && daysOfWeek.length > 0) {
          // For weekly with specific days, we need to handle each day
          // This is a simplified implementation
          currentDate = addDays(currentDate, 1);
          
          // Check if this day of week should be included
          const dayOfWeek = currentDate.getDay() + 1; // 1-7 (Monday-Sunday)
          if (!daysOfWeek.includes(dayOfWeek)) {
            continue; // Skip this day
          }
        } else {
          // Simple weekly recurrence
          currentDate = addWeeks(currentDate, interval);
        }
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, interval);
        break;
    }
    
    // Check if we've reached the end
    if (currentDate > finalEndDate) {
      break;
    }
    
    dates.push(new Date(currentDate));
    occurrences++;
    
    // Check if we've reached the max occurrences
    if (maxOccurrences && occurrences >= maxOccurrences) {
      break;
    }
  }
  
  return dates;
};
