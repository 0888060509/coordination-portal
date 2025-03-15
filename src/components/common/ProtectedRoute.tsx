
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "user";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, isAdmin } = useAuth();
  const location = useLocation();
  const [authTimeout, setAuthTimeout] = useState(false);

  // Check for authentication hash in URL
  const hasAuthHash = location.hash && location.hash.includes('access_token');

  // Add timeout for authentication loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading || hasAuthHash) {
      timeoutId = setTimeout(() => {
        console.log("Authentication loading timeout reached");
        setAuthTimeout(true);
        
        if (hasAuthHash) {
          // If we have auth hash but still loading, there might be a problem parsing it
          toast({
            variant: "destructive",
            title: "Authentication problem",
            description: "There was a problem processing your login. Please try again.",
          });
        }
      }, 10000); // 10 second timeout
    } else {
      setAuthTimeout(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, hasAuthHash]);

  if (isLoading || hasAuthHash) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoadingSpinner 
          size="lg" 
          color="primary" 
          showText={true} 
          text={hasAuthHash ? "Completing authentication..." : "Loading your account..."} 
        />
        {hasAuthHash && (
          <p className="mt-4 text-sm text-gray-500">
            Processing your sign-in, please wait...
          </p>
        )}
        {(isLoading || authTimeout) && (
          <p className="mt-2 text-xs text-gray-400">
            {authTimeout ? 
              "This is taking longer than expected. You may refresh the page or try logging in again." :
              "This is taking longer than expected. You may refresh the page if needed."}
          </p>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for required role if specified
  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
