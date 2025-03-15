
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, AuthError } from "@supabase/supabase-js";

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

// Helper function to transform Supabase user to our User type
const transformUser = async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
  if (!supabaseUser) return null;
  
  // Fetch the user's profile from our profiles table
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', supabaseUser.id)
    .single();
  
  if (error || !profile) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: `${profile.first_name} ${profile.last_name}`.trim() || supabaseUser.email || '',
    avatarUrl: profile.avatar_url || undefined,
    role: profile.is_admin ? 'admin' : 'user',
  };
};

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const toast = useToast();

  // Check if the user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const transformedUser = await transformUser(session.user);
          setUser(transformedUser);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial check
    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        
        if (session) {
          const transformedUser = await transformUser(session.user);
          setUser(transformedUser);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auth methods
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      const transformedUser = await transformUser(data.user);
      setUser(transformedUser);
      
      toast.toast({
        title: "Login successful",
        description: "Welcome back to MeetingMaster!",
      });
    } catch (error) {
      console.error("Login error:", error);
      const authError = error as AuthError;
      
      toast.toast({
        variant: "destructive",
        title: "Login failed",
        description: authError.message || "Please check your credentials and try again.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Extract first and last name
        const nameParts = name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Update the profile with the provided name
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            first_name: firstName,
            last_name: lastName
          })
          .eq('id', data.user.id);
        
        if (profileError) {
          console.error("Error updating profile:", profileError);
        }
        
        const transformedUser = await transformUser(data.user);
        setUser(transformedUser);
      }
      
      toast.toast({
        title: "Registration successful",
        description: "Welcome to MeetingMaster! Please check your email to verify your account.",
      });
    } catch (error) {
      console.error("Registration error:", error);
      const authError = error as AuthError;
      
      toast.toast({
        variant: "destructive",
        title: "Registration failed",
        description: authError.message || "An error occurred during registration. Please try again.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      
      toast.toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      const authError = error as AuthError;
      
      toast.toast({
        variant: "destructive",
        title: "Logout failed",
        description: authError.message || "An error occurred during logout. Please try again.",
      });
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      const authError = error as AuthError;
      
      toast.toast({
        variant: "destructive",
        title: "Failed to send reset email",
        description: authError.message || "An error occurred. Please try again.",
      });
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      // Note: In Supabase, this is typically handled by their built-in reset password flow
      // We would use updateUser to reset the password after the user has clicked the reset link
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      toast.toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      const authError = error as AuthError;
      
      toast.toast({
        variant: "destructive",
        title: "Failed to reset password",
        description: authError.message || "An error occurred. Please try again.",
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
