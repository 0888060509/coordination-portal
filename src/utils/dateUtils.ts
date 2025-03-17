
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
