
import { ReactNode, useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "user";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, isAdmin, authInitialized } = useAuth();
  const location = useLocation();
  const [authTimeout, setAuthTimeout] = useState(false);
  const [forceRenderContent, setForceRenderContent] = useState(false);
  
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check for auth success in localStorage
  useEffect(() => {
    const authSuccess = localStorage.getItem('auth_success');
    if (authSuccess === 'true') {
      console.log("Found auth success in localStorage");
    }
  }, []);
  
  // Force render content after a reasonable timeout to prevent infinite loading
  useEffect(() => {
    // If we're still loading after 5 seconds, force render content
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && isLoading) {
        console.log("ProtectedRoute: Force rendering content after timeout");
        setForceRenderContent(true);
      }
    }, 5000);
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading]);

  // Show authentication timeout after 10 seconds of loading
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isLoading) {
      timer = setTimeout(() => {
        if (isMountedRef.current) {
          setAuthTimeout(true);
        }
      }, 10000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  const goToLogin = () => {
    localStorage.removeItem('auth_success');
    toast({
      title: "Going back to login",
      description: "Please try signing in again.",
    });
    
    window.location.href = '/login';
  };

  // Show the children if we're authenticated or need to force render to prevent deadlock
  if (isAuthenticated || forceRenderContent) {
    return <>{children}</>;
  }

  // Standard loading state
  if (isLoading && !forceRenderContent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoadingSpinner 
          size="lg" 
          color="primary" 
          showText={true} 
          text="Loading your account..." 
        />
        
        {authTimeout && (
          <div className="mt-6 flex flex-col items-center">
            <p className="text-sm text-gray-500 mb-2">
              This is taking longer than expected.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={goToLogin} 
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If not authenticated and not loading, redirect to login
  if (!isAuthenticated && authInitialized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Default case - show the children
  return <>{children}</>;
};

export default ProtectedRoute;
