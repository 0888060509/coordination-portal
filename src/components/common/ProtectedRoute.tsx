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
  const { isAuthenticated, user, isLoading, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [authTimeout, setAuthTimeout] = useState(false);
  const [processingAuth, setProcessingAuth] = useState(false);
  const [processingAttempts, setProcessingAttempts] = useState(0);
  const [hasTriedProcessing, setHasTriedProcessing] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(false);
  const [authProcessComplete, setAuthProcessComplete] = useState(false);
  
  const hasNavigatedRef = useRef(false);

  const hasAuthHash = location.hash && location.hash.includes('access_token');

  useEffect(() => {
    const authSuccess = localStorage.getItem('auth_success');
    const authTimestamp = localStorage.getItem('auth_timestamp');
    
    if (authSuccess === 'true' && authTimestamp) {
      const timestamp = parseInt(authTimestamp, 10);
      const now = Date.now();
      const fiveMinutesMs = 5 * 60 * 1000;
      
      if (now - timestamp < fiveMinutesMs) {
        console.log("Found recent auth success in localStorage");
        if (window.location.pathname !== '/dashboard') {
          console.log("Redirecting to dashboard based on localStorage");
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [navigate]);
  
  useEffect(() => {
    let isMounted = true;
    
    if (isAuthenticated && !user && !isLoading && !verifyingSession) {
      const checkSession = async () => {
        if (!isMounted) return;
        
        setVerifyingSession(true);
        try {
          console.log("Verifying session validity");
          const isValid = await verifySession();
          
          if (!isMounted) return;
          
          if (!isValid) {
            console.log("Session invalid, redirecting to login");
            localStorage.removeItem('auth_success');
            localStorage.removeItem('auth_timestamp');
            
            toast({
              variant: "destructive",
              title: "Session expired",
              description: "Your session has expired. Please sign in again.",
            });
            
            if (!hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              navigate("/login", { replace: true });
            }
          } else {
            console.log("Session verified successfully");
            
            if ((location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') && !hasNavigatedRef.current) {
              console.log("Valid session but on auth page, redirecting to dashboard");
              hasNavigatedRef.current = true;
              navigate('/dashboard', { replace: true });
            }
          }
        } catch (error) {
          console.error("Error verifying session:", error);
          
          if (!isMounted) return;
          
          if (!hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            navigate("/login", { replace: true });
          }
        } finally {
          if (isMounted) {
            setVerifyingSession(false);
          }
        }
      };
      
      checkSession();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, isLoading, navigate, verifyingSession, location.pathname]);

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
            
            localStorage.setItem('auth_success', 'true');
            localStorage.setItem('auth_timestamp', Date.now().toString());
            
            if (!hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              navigate('/dashboard', { replace: true });
              
              setTimeout(() => {
                if (window.location.pathname.includes('login')) {
                  console.log("Still on login page after hash processing, forcing direct navigation");
                  window.location.href = '/dashboard';
                }
              }, 500);
            }
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

  useEffect(() => {
    if (isAuthenticated && !processingAuth && !isLoading && !hasNavigatedRef.current) {
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
        console.log("Authenticated user on auth page, redirecting to dashboard");
        hasNavigatedRef.current = true;
        navigate('/dashboard', { replace: true });
        
        setTimeout(() => {
          if (window.location.pathname !== '/dashboard') {
            window.location.href = '/dashboard';
          }
        }, 500);
      }
    }
  }, [isAuthenticated, processingAuth, isLoading, navigate, hasNavigatedRef]);

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

  useEffect(() => {
    if (isAuthenticated && !isLoading && location.pathname.includes('login') && !hasNavigatedRef.current) {
      console.log("Authentication is complete but still on login page, navigating to dashboard");
      hasNavigatedRef.current = true;
      navigate('/dashboard', { replace: true });
      
      setTimeout(() => {
        if (window.location.pathname.includes('login')) {
          window.location.href = '/dashboard';
        }
      }, 500);
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname, hasNavigatedRef]);

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
