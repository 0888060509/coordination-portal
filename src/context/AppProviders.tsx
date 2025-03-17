
import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/AuthContext';
import { BookingProvider } from './BookingContext';
import { RoomProvider } from './RoomContext';
import { NotificationProvider } from './NotificationContext';
import { UIProvider } from './UIContext';
import { Toaster } from '@/components/ui/toaster';

interface AppProvidersProps {
  children: ReactNode;
}

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <UIProvider>
            <NotificationProvider>
              <RoomProvider>
                <BookingProvider>
                  {children}
                  <Toaster />
                </BookingProvider>
              </RoomProvider>
            </NotificationProvider>
          </UIProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
