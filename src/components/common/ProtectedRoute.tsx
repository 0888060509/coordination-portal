
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { processAuthHash } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "user";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, isAdmin } = useAuth();
  const location = useLocation();
  const [authTimeout, setAuthTimeout] = useState(false);
  const [processingAuth, setProcessingAuth] = useState(false);
  const [processingAttempts, setProcessingAttempts] = useState(0);

  // Check for authentication hash in URL
  const hasAuthHash = location.hash && location.hash.includes('access_token');

  // Process auth hash if present
  useEffect(() => {
    const handleAuthHash = async () => {
      if (hasAuthHash && !isAuthenticated && !processingAuth && processingAttempts < 3) {
        setProcessingAuth(true);
        try {
          console.log("ProtectedRoute: Processing auth hash manually, attempt:", processingAttempts + 1);
          const session = await processAuthHash();
          if (!session) {
            console.error("Failed to process auth hash");
            setProcessingAttempts(prev => prev + 1);
            toast({
              variant: "destructive",
              title: "Authentication problem",
              description: "There was a problem processing your login. Please try again.",
            });
          } else {
            console.log("Auth hash processed successfully");
            // No need to manually update the state, the auth listener will handle it
          }
        } catch (error) {
          console.error("Error processing auth hash:", error);
          setProcessingAttempts(prev => prev + 1);
        } finally {
          setProcessingAuth(false);
        }
      }
    };

    handleAuthHash();
  }, [hasAuthHash, isAuthenticated, processingAuth, processingAttempts]);

  // Add timeout for authentication loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading || hasAuthHash || processingAuth) {
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
  }, [isLoading, hasAuthHash, processingAuth]);

  // Add a "retry" function for manual retry
  const retryAuth = async () => {
    if (hasAuthHash) {
      setProcessingAuth(true);
      try {
        const session = await processAuthHash();
        if (!session) {
          toast({
            variant: "destructive",
            title: "Authentication failed",
            description: "Unable to complete authentication. Please try logging in again.",
          });
        }
      } catch (error) {
        console.error("Retry auth error:", error);
      } finally {
        setProcessingAuth(false);
      }
    }
  };

  if (isLoading || hasAuthHash || processingAuth) {
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
        {(authTimeout) && (
          <div className="mt-4 flex flex-col items-center">
            <p className="text-sm text-gray-500">
              This is taking longer than expected.
            </p>
            <button 
              onClick={retryAuth} 
              className="mt-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              Retry Authentication
            </button>
            <button 
              onClick={() => window.location.href = '/login'} 
              className="mt-2 px-4 py-2 bg-destructive text-white rounded-md text-sm hover:bg-destructive/90 transition-colors"
            >
              Back to Login
            </button>
          </div>
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
