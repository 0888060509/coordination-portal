
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { checkAuthAndRedirect, navigateToLogin } from "@/services/navigationService";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "user";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, isAdmin, authInitialized } = useAuth();
  const location = useLocation();
  const [authTimeout, setAuthTimeout] = useState(false);
  const [forceRenderContent, setForceRenderContent] = useState(false);
  
  // Log component state for debugging
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
  
  // Set timeout for loading state
  useEffect(() => {
    let loadingTimer: NodeJS.Timeout | null = null;
    let authTimeoutTimer: NodeJS.Timeout | null = null;
    
    if (isLoading) {
      // Force render content after a reasonable wait
      loadingTimer = setTimeout(() => {
        console.log("ProtectedRoute: Force rendering content after timeout");
        setForceRenderContent(true);
      }, 3000);
      
      // Set auth timeout for UI feedback
      authTimeoutTimer = setTimeout(() => {
        console.log("ProtectedRoute: Setting auth timeout");
        setAuthTimeout(true);
      }, 5000);
    }
    
    // Check auth on mount
    checkAuthAndRedirect();
    
    return () => {
      if (loadingTimer) clearTimeout(loadingTimer);
      if (authTimeoutTimer) clearTimeout(authTimeoutTimer);
    };
  }, [isLoading]);

  // Handle manual login navigation
  const goToLogin = () => {
    console.log("ProtectedRoute: Manually navigating to login");
    navigateToLogin({ source: 'ProtectedRoute.goToLogin' });
  };

  // Handle non-authenticated user
  if (authInitialized && !isAuthenticated && !isLoading && !forceRenderContent) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle role requirements
  if (isAuthenticated && requiredRole === "admin" && !isAdmin) {
    console.log("ProtectedRoute: Not admin, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  // Show authenticated content
  if (isAuthenticated || forceRenderContent) {
    console.log("ProtectedRoute: Rendering protected content");
    return <>{children}</>;
  }

  // Show loading spinner
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

  // Default fallback
  console.log("ProtectedRoute: Default case - showing children");
  return <>{children}</>;
};

export default ProtectedRoute;
