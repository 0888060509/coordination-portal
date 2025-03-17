
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { setupAuthChangeNavigation } from '@/services/navigationService';

// Page imports
import Login from './pages/auth/LoginPage';
import Register from './pages/auth/RegisterPage';
import ForgotPassword from './pages/auth/ForgotPasswordPage';
import ResetPassword from './pages/auth/ResetPasswordPage';
import BookingsPage from './pages/bookings/BookingsPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import NotFound from './pages/NotFoundPage';
import IndexPage from './pages/IndexPage';
import AppLayout from './components/layout/AppLayout';
import RoomsPage from './pages/rooms/RoomsPage';
import ProfilePage from './pages/settings/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminRoomsPage from './pages/admin/AdminRoomsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

const App = () => {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading, authInitialized } = useAuth();

  // Set up auth change navigation handler
  useEffect(() => {
    const unsubscribe = setupAuthChangeNavigation();
    return unsubscribe;
  }, []);

  // Protected route handler
  const ProtectedRoute = () => {
    if (isLoading || !authInitialized) {
      // You might want to render a loading spinner here
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      // Redirect to the login page if not authenticated
      return <Navigate to="/login" />;
    }

    return <Outlet />;
  };

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/bookings/edit/:bookingId" element={<BookingsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<DashboardPage />} />
            <Route path="/notifications" element={<DashboardPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/rooms" element={<AdminRoomsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
