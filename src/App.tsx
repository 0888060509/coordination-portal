import React, { useState, useEffect } from 'react';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider"
import { useTheme } from 'next-themes'
import Index from './pages/IndexPage';
import Login from './pages/auth/LoginPage';
import Register from './pages/auth/RegisterPage';
import ForgotPassword from './pages/auth/ForgotPasswordPage';
import ResetPassword from './pages/auth/ResetPasswordPage';
import Dashboard from './pages/DashboardPage';
import Rooms from './pages/RoomsPage';
import BookingsPage from './pages/bookings/BookingsPage';
import Profile from './pages/ProfilePage';
import Settings from './pages/SettingsPage';
import AdminDashboard from './pages/admin/AdminDashboardPage';
import RoomManagement from './pages/admin/RoomManagementPage';
import UserManagement from './pages/admin/UserManagementPage';
import NotFound from './pages/NotFoundPage';
import { useAuth } from '@/context/AuthContext';
import { EditBooking } from '@/components/bookings';

const App = () => {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading, authInitialized } = useAuth();

  // Check if the user is authenticated
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (isLoading || !authInitialized) {
      // You might want to render a loading spinner here
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      // Redirect to the login page if not authenticated
      return <Navigate to="/login" />;
    }

    return <>{children}</>;
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <Routes>
      <Route path="/" element={<Index />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Bookings */}
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/bookings/edit/:bookingId" element={<EditBooking />} />
        
        {/* Rooms */}
        <Route path="/rooms" element={<Rooms />} />
        
        {/* Settings */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/rooms" element={<RoomManagement />} />
        <Route path="/admin/users" element={<UserManagement />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
    </ThemeProvider>
  );
};

export default App;
