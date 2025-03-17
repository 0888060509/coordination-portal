
import { ReactNode, useEffect, useState, useRef } from "react";
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
  const { isAuthenticated, user, isLoading, isAdmin, authInitialized } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [authTimeout, setAuthTimeout] = useState(false);
  const [processingAuth, setProcessingAuth] = useState(false);
  const [processingAttempts, setProcessingAttempts] = useState(0);
  const [hasTriedProcessing, setHasTriedProcessing] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(false);
  const [authProcessComplete, setAuthProcessComplete] = useState(false);
  const [forceRenderContent, setForceRenderContent] = useState(false);
  
  const hasNavigatedRef = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if the component is mounted
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const hasAuthHash = location.hash && location.hash.includes('access_token');

  // Force render content after a reasonable timeout to prevent infinite loading
  useEffect(() => {
    // If we're still loading after 5 seconds, force render content
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && isLoading) {
        console.log("ProtectedRoute: Force rendering content after timeout");
        setForceRenderContent(true);
        
        // After additional time, check if we need to navigate to login
        setTimeout(() => {
          if (isMountedRef.current && !isAuthenticated && authInitialized) {
            navigate("/login", { replace: true });
          }
        }, 2000);
      }
    }, 5000);
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading, isAuthenticated, authInitialized, navigate]);

  // Check for auth success in localStorage
  useEffect(() => {
    const authSuccess = localStorage.getItem('auth_success');
    const authTimestamp = localStorage.getItem('auth_timestamp');
    
    if (authSuccess === 'true' && authTimestamp) {
      const timestamp = parseInt(authTimestamp, 10);
      const now = Date.now();
      const fiveMinutesMs = 5 * 60 * 1000;
      
      if (now - timestamp < fiveMinutesMs) {
        console.log("Found recent auth success in localStorage");
      }
    }
  }, [navigate]);
  
  // Process auth hash if present
  useEffect(() => {
    if (hasAuthHash && !isAuthenticated && !processingAuth && processingAttempts < 3 && !hasTriedProcessing && !authProcessComplete) {
      if (!isMountedRef.current) return;
      
      setProcessingAuth(true);
      setHasTriedProcessing(true);
      
      const processHash = async () => {
        try {
          console.log("ProtectedRoute: Processing auth hash manually, attempt:", processingAttempts + 1);
          
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
          
          const session = await processAuthHash();
          
          if (!isMountedRef.current) return;
          
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
            
            localStorage.setItem('auth_success', 'true');
            localStorage.setItem('auth_timestamp', Date.now().toString());
          }
        } catch (error) {
          if (!isMountedRef.current) return;
          
          console.error("Error processing auth hash:", error);
          setProcessingAttempts(prev => prev + 1);
          
          toast({
            variant: "destructive",
            title: "Authentication error",
            description: "Failed to complete authentication. Please try again.",
          });
        } finally {
          if (isMountedRef.current) {
            setProcessingAuth(false);
          }
        }
      };

      processHash();
    }
  }, [hasAuthHash, isAuthenticated, processingAuth, processingAttempts, hasTriedProcessing, authProcessComplete]);

  // Show authentication timeout after 10 seconds of loading
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isLoading || processingAuth) {
      timer = setTimeout(() => {
        if (isMountedRef.current) {
          setAuthTimeout(true);
        }
      }, 10000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, processingAuth]);

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
            refresh_token: refreshToken || "",
            ...(expiresIn ? { expires_in: parseInt(expiresIn, 10) } : {}),
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
        if (isMountedRef.current) {
          setProcessingAuth(false);
        }
      }
    }
  };

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

  // Show the children if we're authenticated, even if still technically loading
  if (isAuthenticated || forceRenderContent) {
    return <>{children}</>;
  }

  // Standard loading state
  const showLoading = isLoading || (hasAuthHash && processingAuth) || verifyingSession;

  if (showLoading && !forceRenderContent) {
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
