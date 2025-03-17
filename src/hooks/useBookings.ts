
import { useQuery } from '@tanstack/react-query';
import { BookingWithDetails } from '@/types';
import { getUserBookings } from '@/services/bookingService';
import { useAuth } from '@/context/AuthContext';

export const useBookings = () => {
  const { user } = useAuth();
  
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
