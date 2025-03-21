
import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { User, AuthContextType } from "@/types/user";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { useOAuthCallback } from "@/hooks/useOAuthCallback";
import { useAuthState } from "@/hooks/useAuthState";
import { useRedirectAuth } from "@/hooks/useRedirectAuth";
import { supabase } from "@/integrations/supabase/client";
import { forceToDashboard, checkAuthRedirect } from "@/services/navigationService";

// Initial context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const profileFetchInProgress = useRef<boolean>(false);

  // Set up auth state management with the new initialized flag
  useAuthState({
    setUser,
    setSession,
    setIsLoading,
    setIsAdmin,
    setAuthInitialized
  });

  // Process OAuth callbacks
  useOAuthCallback({
    setUser,
    setSession,
    setIsLoading,
    setIsAdmin
  });

  // Use our reliable redirect hook for navigation
  const { forceToDashboard: hookForceToDashboard, forceToLogin } = useRedirectAuth();

  // Get auth methods
  const {
    login,
    loginWithGoogle,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshProfile
  } = useAuthMethods(
    setUser,
    setSession,
    setIsLoading,
    setIsAdmin,
    user,
    session
  );

  // Listen for login-success custom event
  useEffect(() => {
    const handleLoginSuccess = () => {
      console.log("AuthContext: Detected login-success event");
      forceToDashboard('auth-context-event');
    };
    
    window.addEventListener('login-success', handleLoginSuccess);
    
    return () => {
      window.removeEventListener('login-success', handleLoginSuccess);
    };
  }, []);

  // Enhanced direct session check - run only once and with safeguards
  useEffect(() => {
    let isMounted = true;
    
    // Check for localStorage auth status first using the navigation service
    checkAuthRedirect();
    
    // Direct session check for logged in users on login pages
    const checkSessionAndRedirect = async () => {
      if (!isMounted || profileFetchInProgress.current) return;
      
      try {
        console.log("AuthContext: One-time direct session check starting");
        const { data } = await supabase.auth.getSession();
        
        if (data.session && isMounted) {
          // If we have a session and we're on a login-related page, redirect
          const currentPath = window.location.pathname;
          if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
            console.log("🔒 AuthContext: Direct session check found session, redirecting");
            forceToDashboard('auth-context-session');
          }
        }
      } catch (err) {
        console.error("Error in direct session check:", err);
      } finally {
        if (isMounted) {
          // Make sure we release our loading state even if errors occurred
          setTimeout(() => {
            if (isMounted && isLoading) {
              console.log("AuthContext: Forcing loading state to complete");
              setIsLoading(false);
              setAuthInitialized(true);
            }
          }, 2000);
        }
      }
    };
    
    // Run this check only once on mount, with a small delay to prevent race conditions
    setTimeout(checkSessionAndRedirect, 300);
    
    // Safety timeout to release loading state if something gets stuck
    const safetyTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.log("AuthContext: Safety timeout releasing loading state");
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 5000);
    
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    isAdmin,
    authInitialized,
    login,
    loginWithGoogle,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
