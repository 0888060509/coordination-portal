
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { processAuthHash, verifySession, supabase } from "@/integrations/supabase/client";

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
  const [verifyingSession, setVerifyingSession] = useState(false);
  const [authProcessComplete, setAuthProcessComplete] = useState(false);

  const hasAuthHash = location.hash && location.hash.includes('access_token');
  
  // Enhanced session verification with forced navigation as fallback
  useEffect(() => {
    if (isAuthenticated && !user && !isLoading && !verifyingSession) {
      const checkSession = async () => {
        setVerifyingSession(true);
        try {
          console.log("Verifying session validity");
          const isValid = await verifySession();
          if (!isValid) {
            console.log("Session invalid, redirecting to login");
            toast({
              variant: "destructive",
              title: "Session expired",
              description: "Your session has expired. Please sign in again.",
            });
            navigate("/login", { replace: true });
          } else {
            console.log("Session verified successfully");
          }
        } catch (error) {
          console.error("Error verifying session:", error);
          navigate("/login", { replace: true });
        } finally {
          setVerifyingSession(false);
        }
      };
      
      checkSession();
    }
  }, [isAuthenticated, user, isLoading, navigate, verifyingSession]);

  // Enhanced auth hash processing with better state tracking
  useEffect(() => {
    let isMounted = true;
    
    const handleAuthHash = async () => {
      if (hasAuthHash && !isAuthenticated && !processingAuth && processingAttempts < 3 && !hasTriedProcessing && !authProcessComplete) {
        if (!isMounted) return;
        
        setProcessingAuth(true);
        setHasTriedProcessing(true);
        
        try {
          console.log("ProtectedRoute: Processing auth hash manually, attempt:", processingAttempts + 1);
          
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
          
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
            setAuthProcessComplete(true);
            
            // Force navigation after successful hash processing
            setTimeout(() => {
              if (window.location.pathname.includes('login')) {
                console.log("Forcing navigation to dashboard after successful hash processing");
                navigate('/dashboard', { replace: true });
              }
            }, 1000);
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
  }, [hasAuthHash, isAuthenticated, processingAuth, processingAttempts, navigate, hasTriedProcessing, authProcessComplete]);

  // More aggressive timeout handling with auto-retry
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let longTimeoutId: NodeJS.Timeout;
    let retryTimeoutId: NodeJS.Timeout;
    
    if ((isLoading || (hasAuthHash && processingAuth)) && !isAuthenticated) {
      // First timeout - show message
      timeoutId = setTimeout(() => {
        console.log("Authentication loading timeout reached");
        setAuthTimeout(true);
        
        if (hasAuthHash) {
          toast({
            variant: "destructive",
            title: "Authentication taking longer than expected",
            description: "You can try again or go back to login page.",
          });
        }
      }, 5000);
      
      // Second timeout - auto retry once
      retryTimeoutId = setTimeout(() => {
        if (hasAuthHash && processingAuth && processingAttempts < 2) {
          console.log("Auto-retrying authentication");
          retryAuth();
        }
      }, 8000);
      
      // Final timeout - redirect
      longTimeoutId = setTimeout(() => {
        toast({
          variant: "destructive",
          title: "Authentication problem",
          description: "There was a problem completing your authentication. Please try logging in again.",
        });
        
        if (isLoading || processingAuth) {
          console.log("Final timeout reached, redirecting to login");
          navigate('/login', { replace: true });
        }
      }, 15000);
    } else {
      setAuthTimeout(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      if (longTimeoutId) clearTimeout(longTimeoutId);
    };
  }, [isLoading, hasAuthHash, processingAuth, navigate, processingAttempts, isAuthenticated]);

  // Add immediate navigation when authenticated
  useEffect(() => {
    if (isAuthenticated && !processingAuth) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, processingAuth, navigate]);

  // Improved retry authentication with more explicit logging
  const retryAuth = async () => {
    if (hasAuthHash) {
      setAuthTimeout(false);
      setProcessingAuth(true);
      setProcessingAttempts(prev => prev + 1);
      
      try {
        console.log("Manually retrying authentication process");
        toast({
          title: "Retrying authentication",
          description: "Please wait while we try again...",
        });
        
        const currentHash = location.hash;
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }
        
        const params = new URLSearchParams(currentHash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken) {
          console.log("Found access token, attempting manual session setup");
          const expiresIn = params.get('expires_in');
          const expiresAt = expiresIn ? Math.floor(Date.now() / 1000) + parseInt(expiresIn, 10) : undefined;
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || null,
            ...(expiresIn ? { expires_in: parseInt(expiresIn, 10) } as any : {}),
            ...(expiresAt ? { expires_at: expiresAt } as any : {}),
            token_type: params.get('token_type') || 'bearer'
          });
          
          if (error || !data.session) {
            console.error("Manual session setup failed:", error);
            throw error || new Error("No session returned");
          }
          
          console.log("Manual session setup successful");
          toast({
            title: "Authentication successful",
            description: "You are now logged in.",
          });
          
          // Force navigation after successful manual authentication
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
          return;
        }
        
        console.log("Falling back to processAuthHash");
        const session = await processAuthHash();
        if (!session) {
          console.error("processAuthHash returned no session");
          toast({
            variant: "destructive",
            title: "Authentication failed",
            description: "Unable to complete authentication. Please try logging in again.",
          });
        } else {
          console.log("Authentication retry successful");
          toast({
            title: "Authentication successful",
            description: "You are now logged in.",
          });
          
          // Force navigation after successful processAuthHash
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
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

  // Simpler navigation function
  const goToLogin = () => {
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    toast({
      title: "Going back to login",
      description: "Please try signing in again.",
    });
    
    navigate('/login', { replace: true });
  };

  // Enhanced loading detection
  const showLoading = isLoading || (hasAuthHash && processingAuth) || verifyingSession;

  // Additional effect to detect stalled auth and force navigation
  useEffect(() => {
    // If auth is complete but we're still on login page, force navigate
    if (isAuthenticated && !isLoading && location.pathname.includes('login')) {
      console.log("Authentication is complete but still on login page, navigating to dashboard");
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  if (showLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoadingSpinner 
          size="lg" 
          color="primary" 
          showText={true} 
          text={verifyingSession ? "Verifying your session..." : hasAuthHash ? "Completing authentication..." : "Loading your account..."} 
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
