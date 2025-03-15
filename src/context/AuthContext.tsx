import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase, handleSupabaseError } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session, AuthError } from "@supabase/supabase-js";

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: "admin" | "user";
  department?: string;
  position?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ error?: AuthError }>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Helper function to transform Supabase user to our User type
const transformUser = async (supabaseUser: SupabaseUser | null, session: Session | null): Promise<User | null> => {
  if (!supabaseUser) return null;
  
  try {
    // Fetch the user's profile from our profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    if (!profile) {
      console.log('No profile found for user, creating one...');
      // Create a profile for this user
      const firstName = supabaseUser.user_metadata?.full_name?.split(' ')?.[0] || '';
      const lastName = supabaseUser.user_metadata?.full_name?.split(' ')?.slice(1)?.join(' ') || '';
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: supabaseUser.id,
          first_name: firstName,
          last_name: lastName,
          email: supabaseUser.email || '',
          avatar_url: supabaseUser.user_metadata?.avatar_url || '',
        });
        
      if (insertError) {
        console.error('Error creating profile:', insertError);
        return null;
      }
      
      // Fetch the newly created profile
      const { data: newProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
        
      if (fetchError || !newProfile) {
        console.error('Error fetching new profile:', fetchError);
        return null;
      }
      
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: `${newProfile.first_name} ${newProfile.last_name}`.trim() || supabaseUser.email || '',
        firstName: newProfile.first_name || '',
        lastName: newProfile.last_name || '',
        avatarUrl: newProfile.avatar_url || supabaseUser.user_metadata?.avatar_url,
        role: newProfile.is_admin ? 'admin' : 'user',
        department: newProfile.department || undefined,
        position: newProfile.position || undefined,
      };
    }
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: `${profile.first_name} ${profile.last_name}`.trim() || supabaseUser.email || '',
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      avatarUrl: profile.avatar_url || supabaseUser.user_metadata?.avatar_url,
      role: profile.is_admin ? 'admin' : 'user',
      department: profile.department || undefined,
      position: profile.position || undefined,
    };
  } catch (error) {
    console.error('Error in transformUser:', error);
    return null;
  }
};

// Initial context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Fetch user profile from profiles table with better error handling
  const fetchProfile = async (userId: string, currentSession: Session | null) => {
    try {
      console.log("Fetching profile for user:", userId);
      
      // Try to get user from session first
      if (!currentSession) {
        console.error('No session available for fetchProfile');
        setIsLoading(false);
        return;
      }
      
      const userData = await transformUser(currentSession.user, currentSession);
      
      if (userData) {
        setUser(userData);
        setIsAdmin(userData.role === 'admin');
      } else {
        console.error('Could not transform user data');
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error in profile flow:', error);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle hash fragment from OAuth redirects
  useEffect(() => {
    const handleHashFragment = async () => {
      // Check if we have a hash in the URL (from OAuth redirect)
      if (location.hash && location.hash.includes('access_token')) {
        setIsLoading(true);
        try {
          console.log("Processing OAuth callback...");
          
          // Get session from the URL hash
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error getting session:", error);
            throw error;
          }
          
          if (data.session) {
            console.log("Got session:", data.session.user.id);
            setSession(data.session);
            await fetchProfile(data.session.user.id, data.session);
            
            // Clean up the URL by removing the hash fragment
            window.history.replaceState({}, document.title, window.location.pathname);
            
            toast.toast({
              title: "Successfully signed in with Google",
              description: "Welcome to MeetingMaster!",
            });
            
            navigate('/dashboard');
          } else {
            console.error("No session in OAuth callback");
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error processing OAuth redirect:", error);
          toast.toast({
            variant: "destructive",
            title: "Authentication failed",
            description: "Failed to authenticate with Google. Please try again.",
          });
          setIsLoading(false);
          navigate('/login');
        }
      }
    };
    
    handleHashFragment();
  }, [location.hash, navigate, toast]);

  // Check if the user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session?.user) {
          await fetchProfile(session.user.id, session);
        } else {
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoading(false);
      }
    };

    // Initial check
    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session);
        setSession(session);
        
        if (session?.user) {
          setIsLoading(true);
          await fetchProfile(session.user.id, session);
        } else {
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
        
        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          toast.toast({
            title: "Successfully signed in",
            description: "Welcome to MeetingMaster!",
          });
          navigate('/dashboard');
        }
        
        if (event === 'SIGNED_OUT') {
          toast.toast({
            title: "Successfully signed out",
            description: "You have been logged out successfully",
          });
          navigate('/login');
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  // Auth methods
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      setSession(data.session);
      // The user will be set by the onAuthStateChange listener
      
      toast.toast({
        title: "Login successful",
        description: "Welcome back to MeetingMaster!",
      });
      
      return { data };
    } catch (error) {
      console.error("Login error:", error);
      const authError = error as AuthError;
      
      toast.toast({
        variant: "destructive",
        title: "Login failed",
        description: authError.message || "Please check your credentials and try again.",
      });
      setIsLoading(false);
      return { error: authError };
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
          queryParams: {
            prompt: 'select_account',
          }
        },
      });
      
      if (error) throw error;
      // Auth state change will be handled by the listener
    } catch (error) {
      console.error("Google login error:", error);
      const authError = error as AuthError;
      
      toast.toast({
        variant: "destructive",
        title: "Google login failed",
        description: authError.message || "An error occurred during Google login.",
      });
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Update the profile with the provided name
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            first_name: firstName,
            last_name: lastName,
          })
          .eq('id', data.user.id);
        
        if (profileError) {
          console.error("Error updating profile:", profileError);
        }
      }
      
      toast.toast({
        title: "Registration successful",
        description: "Welcome to MeetingMaster! Please check your email to verify your account.",
      });
      navigate('/login');
    } catch (error) {
      console.error("Registration error:", error);
      const authError = error as AuthError;
      
      toast.toast({
        variant: "destructive",
        title: "Registration failed",
        description: authError.message || "An error occurred during registration. Please try again.",
      });
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // State will be cleared by the onAuthStateChange listener
    } catch (error) {
      console.error("Logout error:", error);
      const authError = error as AuthError;
      
      toast.toast({
        variant: "destructive",
        title: "Logout failed",
        description: authError.message || "An error occurred during logout. Please try again.",
      });
      setIsLoading(false);
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setIsLoading(true);
      // In Supabase, this is typically handled by the updateUser method after the user has clicked the reset link
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      toast.toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in.",
      });
      navigate('/login');
    } catch (error) {
      console.error("Reset password error:", error);
      const authError = error as AuthError;
      
      toast.toast({
        variant: "destructive",
        title: "Failed to reset password",
        description: authError.message || "An error occurred. Please try again.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const updateData = {
        first_name: data.firstName || user.firstName,
        last_name: data.lastName || user.lastName,
        avatar_url: data.avatarUrl,
        department: data.department,
        position: data.position,
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Refresh user profile
      if (session) {
        await fetchProfile(user.id, session);
      }
      
      toast.toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Update profile error:", error);
      
      toast.toast({
        variant: "destructive",
        title: "Profile update failed",
        description: "An error occurred while updating your profile.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user && session) {
      await fetchProfile(user.id, session);
    }
  };

  const value = {
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
