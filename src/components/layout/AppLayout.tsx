
import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { useUIContext } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

const AppLayout = () => {
  const { state: uiState } = useUIContext();
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("AppLayout: Not authenticated, redirecting to login");
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Debug output
  useEffect(() => {
    console.log("AppLayout rendering:", { 
      path: location.pathname,
      isAuthenticated, 
      userId: user?.id || 'not logged in',
      isLoading
    });
  }, [location.pathname, isAuthenticated, user, isLoading]);
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <main
        className={cn(
          "flex-1 flex flex-col transition-all duration-200 h-screen overflow-auto",
          uiState.sidebarOpen ? "ml-60" : "ml-[70px]"
        )}
      >
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <div className="flex-1 p-4 pt-20 w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading...</p>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
