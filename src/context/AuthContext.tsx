
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

// Initial context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const toast = useToast();

  // Check if the user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Mock authentication check
        const storedUser = localStorage.getItem("meetingMasterUser");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Auth methods
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock login - will be replaced with Supabase
      const mockUser: User = {
        id: "user-1",
        email,
        name: "Demo User",
        role: "user",
      };
      
      localStorage.setItem("meetingMasterUser", JSON.stringify(mockUser));
      setUser(mockUser);
      
      toast.toast({
        title: "Login successful",
        description: "Welcome back to MeetingMaster!",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast.toast({
        variant: "destructive",
        title: "Login failed",
        description: "Please check your credentials and try again.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // Mock registration - will be replaced with Supabase
      const mockUser: User = {
        id: "user-1",
        email,
        name,
        role: "user",
      };
      
      localStorage.setItem("meetingMasterUser", JSON.stringify(mockUser));
      setUser(mockUser);
      
      toast.toast({
        title: "Registration successful",
        description: "Welcome to MeetingMaster!",
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast.toast({
        variant: "destructive",
        title: "Registration failed",
        description: "An error occurred during registration. Please try again.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Mock logout - will be replaced with Supabase
      localStorage.removeItem("meetingMasterUser");
      setUser(null);
      
      toast.toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast.toast({
        variant: "destructive",
        title: "Logout failed",
        description: "An error occurred during logout. Please try again.",
      });
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      // Mock forgot password - will be replaced with Supabase
      toast.toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.toast({
        variant: "destructive",
        title: "Failed to send reset email",
        description: "An error occurred. Please try again.",
      });
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      // Mock reset password - will be replaced with Supabase
      toast.toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      toast.toast({
        variant: "destructive",
        title: "Failed to reset password",
        description: "An error occurred. Please try again.",
      });
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
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
