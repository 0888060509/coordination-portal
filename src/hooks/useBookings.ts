
import { useQuery } from '@tanstack/react-query';
import { BookingWithDetails } from '@/types';
import { getUserBookings } from '@/services/bookingService';

export const useBookings = () => {
  return useQuery({
    queryKey: ['bookings', 'user'],
    queryFn: getUserBookings,
  });
};
