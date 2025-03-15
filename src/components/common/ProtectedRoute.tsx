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

  const hasAuthHash = location.hash && location.hash.includes('access_token');
  
  useEffect(() => {
    if (isAuthenticated && !user && !isLoading && !verifyingSession) {
      const checkSession = async () => {
        setVerifyingSession(true);
        const isValid = await verifySession();
        if (!isValid) {
          console.log("Session invalid, redirecting to login");
          navigate("/login", { replace: true });
        }
        setVerifyingSession(false);
      };
      
      checkSession();
    }
  }, [isAuthenticated, user, isLoading, navigate, verifyingSession]);

  useEffect(() => {
    let isMounted = true;
    
    const handleAuthHash = async () => {
      if (hasAuthHash && !isAuthenticated && !processingAuth && processingAttempts < 3 && !hasTriedProcessing) {
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

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let longTimeoutId: NodeJS.Timeout;
    
    if (isLoading || (hasAuthHash && processingAuth)) {
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
      
      longTimeoutId = setTimeout(() => {
        toast({
          variant: "destructive",
          title: "Authentication problem",
          description: "There was a problem completing your authentication. Please try logging in again.",
        });
        
        if (isLoading || processingAuth) {
          navigate('/login', { replace: true });
        }
      }, 15000);
    } else {
      setAuthTimeout(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (longTimeoutId) clearTimeout(longTimeoutId);
    };
  }, [isLoading, hasAuthHash, processingAuth, navigate]);

  const retryAuth = async () => {
    if (hasAuthHash) {
      setAuthTimeout(false);
      setProcessingAuth(true);
      setProcessingAttempts(prev => prev + 1);
      
      try {
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
            throw error || new Error("No session returned");
          }
          
          toast({
            title: "Authentication successful",
            description: "You are now logged in.",
          });
          return;
        }
        
        const session = await processAuthHash();
        if (!session) {
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
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    toast({
      title: "Going back to login",
      description: "Please try signing in again.",
    });
    
    navigate('/login', { replace: true });
  };

  const showLoading = isLoading || (hasAuthHash && processingAuth) || verifyingSession;

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
