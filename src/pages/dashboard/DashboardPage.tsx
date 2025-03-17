
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardStats } from '@/services/dashboardService';
import { DashboardStats as DashboardStatsComponent } from '@/components/dashboard/DashboardStats';
import { BookingCharts } from '@/components/dashboard/BookingCharts';
import { UpcomingBookings } from '@/components/dashboard/UpcomingBookings';
import { TodayBookings } from '@/components/dashboard/TodayBookings';
import { AvailableRooms } from '@/components/dashboard/AvailableRooms';
import { useQuery } from '@tanstack/react-query';
import dashboardService from '@/services/dashboardService';

const DashboardPage = () => {
  const { user } = useAuth();

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Get all dashboard data
      return dashboardService.getDashboardData(user.id);
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading dashboard data: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {dashboardData && (
        <>
          <DashboardStatsComponent stats={dashboardData.stats} />
          
          <BookingCharts stats={dashboardData.stats} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingBookings bookings={dashboardData.upcomingBookings} />
            <div className="space-y-6">
              <TodayBookings bookings={dashboardData.todayBookings} />
              <AvailableRooms rooms={dashboardData.availableRooms} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
