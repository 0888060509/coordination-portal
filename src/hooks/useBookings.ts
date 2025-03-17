
import { useQuery } from '@tanstack/react-query';
import { BookingWithDetails } from '@/types';
import { getUserBookings } from '@/services/bookingService';
import { useAuthState } from './useAuthState';

export const useBookings = () => {
  const { user } = useAuthState();
  
  return useQuery({
    queryKey: ['bookings', 'user', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      return getUserBookings(user.id);
    },
    enabled: !!user?.id,
  });
};
