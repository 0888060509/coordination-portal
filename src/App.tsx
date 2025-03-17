
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider";
import { useTheme } from 'next-themes';
import Login from './pages/auth/LoginPage';
import Register from './pages/auth/RegisterPage';
import ForgotPassword from './pages/auth/ForgotPasswordPage';
import ResetPassword from './pages/auth/ResetPasswordPage';
import BookingsPage from './pages/bookings/BookingsPage';
import { useAuth } from '@/context/AuthContext';
import { EditBooking } from '@/components/bookings';
import NotFound from './pages/NotFoundPage';
import IndexPage from './pages/IndexPage';

const App = () => {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading, authInitialized } = useAuth();

  // Check if the user is authenticated
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Bookings */}
          <Route path="/dashboard" element={<BookingsPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/bookings/edit/:bookingId" element={<EditBooking />} />
          <Route path="/rooms" element={<BookingsPage />} />
          <Route path="/profile" element={<BookingsPage />} />
          <Route path="/settings" element={<BookingsPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<BookingsPage />} />
          <Route path="/admin/rooms" element={<BookingsPage />} />
          <Route path="/admin/users" element={<BookingsPage />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
