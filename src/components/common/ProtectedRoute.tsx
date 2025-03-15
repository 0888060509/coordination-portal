
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [authTimeout, setAuthTimeout] = useState(false);
  const [processingAuth, setProcessingAuth] = useState(false);
  const [processingAttempts, setProcessingAttempts] = useState(0);
  const [hasTriedProcessing, setHasTriedProcessing] = useState(false);

  // Check for authentication hash in URL
  const hasAuthHash = location.hash && location.hash.includes('access_token');

  // Process auth hash if present
  useEffect(() => {
    let isMounted = true;
    
    const handleAuthHash = async () => {
      if (hasAuthHash && !isAuthenticated && !processingAuth && processingAttempts < 3 && !hasTriedProcessing) {
        if (!isMounted) return;
        
        setProcessingAuth(true);
        setHasTriedProcessing(true);
        
        try {
          console.log("ProtectedRoute: Processing auth hash manually, attempt:", processingAttempts + 1);
          const session = await processAuthHash();
          
          if (!isMounted) return;
          
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
          if (!isMounted) return;
          
          console.error("Error processing auth hash:", error);
          setProcessingAttempts(prev => prev + 1);
          toast({
            variant: "destructive",
            title: "Authentication error",
            description: "Failed to complete authentication. Please try again.",
          });
        } finally {
          if (isMounted) {
            setProcessingAuth(false);
          }
        }
      }
    };

    handleAuthHash();
    
    return () => {
      isMounted = false;
    };
  }, [hasAuthHash, isAuthenticated, processingAuth, processingAttempts, navigate, hasTriedProcessing]);

  // Add timeout for authentication loading with progressive feedback
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let longTimeoutId: NodeJS.Timeout;
    
    if (isLoading || (hasAuthHash && processingAuth)) {
      // Initial timeout - show retry options
      timeoutId = setTimeout(() => {
        console.log("Authentication loading timeout reached");
        setAuthTimeout(true);
        
        if (hasAuthHash) {
          // If we have auth hash but still loading, there might be a problem parsing it
          toast({
            variant: "destructive",
            title: "Authentication taking longer than expected",
            description: "You can try again or go back to login page.",
          });
        }
      }, 5000); // 5 second timeout
      
      // Longer timeout - more serious error message
      longTimeoutId = setTimeout(() => {
        toast({
          variant: "destructive",
          title: "Authentication problem",
          description: "There was a problem completing your authentication. Please try logging in again.",
        });
      }, 15000); // 15 second timeout
    } else {
      setAuthTimeout(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (longTimeoutId) clearTimeout(longTimeoutId);
    };
  }, [isLoading, hasAuthHash, processingAuth]);

  // Add a "retry" function for manual retry
  const retryAuth = async () => {
    if (hasAuthHash) {
      setAuthTimeout(false); // Reset timeout state
      setProcessingAuth(true);
      setProcessingAttempts(prev => prev + 1);
      
      try {
        toast({
          title: "Retrying authentication",
          description: "Please wait while we try again...",
        });
        
        const session = await processAuthHash();
        if (!session) {
          toast({
            variant: "destructive",
            title: "Authentication failed",
            description: "Unable to complete authentication. Please try logging in again.",
          });
        } else {
          // Session was set successfully, the auth state listener should handle the update
          console.log("Authentication retry successful");
          toast({
            title: "Authentication successful",
            description: "You are now logged in.",
          });
        }
      } catch (error) {
        console.error("Retry auth error:", error);
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Failed to complete authentication. Please try again.",
        });
      } finally {
        setProcessingAuth(false);
      }
    }
  };

  const goToLogin = () => {
    // Clear the URL hash before navigating
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Show a toast to inform the user
    toast({
      title: "Going back to login",
      description: "Please try signing in again.",
    });
    
    navigate('/login');
  };

  // Only show loading during active processing
  const showLoading = isLoading || (hasAuthHash && processingAuth);

  if (showLoading) {
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
          <div className="mt-6 flex flex-col items-center">
            <p className="text-sm text-gray-500 mb-2">
              This is taking longer than expected.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={retryAuth} 
                className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors"
                disabled={processingAuth}
              >
                {processingAuth ? "Retrying..." : "Retry Authentication"}
              </button>
              <button 
                onClick={goToLogin} 
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                disabled={processingAuth}
              >
                Back to Login
              </button>
            </div>
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
