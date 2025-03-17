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

  useEffect(() => {
    console.log("ProtectedRoute state:", { 
      isAuthenticated, 
      isLoading, 
      authInitialized,
      forceRenderContent,
      authTimeout,
      path: location.pathname
    });
  }, [isAuthenticated, isLoading, authInitialized, forceRenderContent, authTimeout, location.pathname]);
  
  useEffect(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    if (isLoading) {
      loadingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          console.log("ProtectedRoute: Force rendering content after timeout");
          setForceRenderContent(true);
        }
      }, 3000);
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isLoading) {
      timer = setTimeout(() => {
        if (isMountedRef.current) {
          console.log("ProtectedRoute: Setting auth timeout");
          setAuthTimeout(true);
        }
      }, 5000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  const goToLogin = () => {
    console.log("ProtectedRoute: Manually navigating to login");
    localStorage.removeItem('auth_success');
    
    toast({
      title: "Going back to login",
      description: "Please try signing in again.",
    });
    
    window.location.href = '/login';
  };

  if (authInitialized && !isAuthenticated && !isLoading && !forceRenderContent) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isAuthenticated && requiredRole === "admin" && !isAdmin) {
    console.log("ProtectedRoute: Not admin, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  if (isAuthenticated || forceRenderContent) {
    console.log("ProtectedRoute: Rendering protected content");
    return <>{children}</>;
  }

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

  console.log("ProtectedRoute: Default case - showing children");
  return <>{children}</>;
};

export default ProtectedRoute;
