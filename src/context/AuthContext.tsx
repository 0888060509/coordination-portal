
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { User, AuthContextType } from "@/types/user";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { useOAuthCallback } from "@/hooks/useOAuthCallback";
import { useAuthState } from "@/hooks/useAuthState";
import { useRedirectAuth } from "@/hooks/useRedirectAuth";

// Initial context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Set up auth state management
  useAuthState({
    setUser,
    setSession,
    setIsLoading,
    setIsAdmin
  });

  // Process OAuth callbacks
  useOAuthCallback({
    setUser,
    setSession,
    setIsLoading,
    setIsAdmin
  });

  // Use our reliable redirect hook for navigation
  const { forceToDashboard, forceToLogin } = useRedirectAuth();

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
      forceToDashboard();
    };
    
    window.addEventListener('login-success', handleLoginSuccess);
    
    return () => {
      window.removeEventListener('login-success', handleLoginSuccess);
    };
  }, [forceToDashboard]);

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    isAdmin,
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
