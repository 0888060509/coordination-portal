
import { addDays as dateFnsAddDays, format } from 'date-fns';

export const formatDate = (dateStr: string | Date): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return format(date, 'MMMM d, yyyy');
};

export const formatTime = (dateStr: string | Date): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return format(date, 'h:mm a');
};

export const addDays = (date: Date, days: number): Date => {
  return dateFnsAddDays(date, days);
};

/**
 * Generate time slots for a day starting from startHour to endHour with specified interval
 * @param startHour Starting hour (0-23)
 * @param endHour Ending hour (0-23)
 * @param intervalMinutes Interval in minutes
 * @returns Array of time slots with value (HH:MM) and label (formatted time)
 */
export const getTimeSlots = (
  startHour: number = 8,
  endHour: number = 18,
  intervalMinutes: number = 30
): { value: string; label: string }[] => {
  const slots: { value: string; label: string }[] = [];
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      // Skip if we're at the end hour and have already added a slot
      if (hour === endHour && minute > 0) break;
      
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      const timeValue = `${h}:${m}`;
      
      // Create a date object to format the label nicely
      const date = new Date();
      date.setHours(hour, minute, 0);
      const timeLabel = format(date, 'h:mm a');
      
      slots.push({ value: timeValue, label: timeLabel });
    }
  }
  
  return slots;
};

/**
 * Returns an array containing all days of the week for the week that contains the provided date
 * @param date The date to get the week for
 * @returns Array of Date objects representing each day of the week
 */
export const getWeekDays = (date: Date): Date[] => {
  const days: Date[] = [];
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate the start of the week (Sunday)
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - day);
  
  // Add all days of the week
  for (let i = 0; i < 7; i++) {
    const weekDay = new Date(startOfWeek);
    weekDay.setDate(startOfWeek.getDate() + i);
    days.push(weekDay);
  }
  
  return days;
};

/**
 * Check if two dates are on the same day
 * @param dateA First date
 * @param dateB Second date
 * @returns True if both dates are on the same day
 */
export const isSameDay = (dateA: Date, dateB: Date): boolean => {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
};
