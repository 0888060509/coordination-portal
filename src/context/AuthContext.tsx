import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase, handleSupabaseError, processAuthHash } from "@/integrations/supabase/client";
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
  login: (email: string, password: string) => Promise<{ error?: AuthError; data?: any }>;
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
  if (!supabaseUser) {
    console.log("No supabase user available in transformUser");
    return null;
  }
  
  try {
    console.log("Transforming user:", supabaseUser.id);
    
    // Fetch the user's profile from our profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      
      // Create profile if it doesn't exist (especially important for OAuth users)
      if (error.code === 'PGRST116') { // This is the "no rows returned" error code
        console.log('No profile found for user, creating one...');
        
        // Extract name parts from either user_metadata or raw_user_meta_data
        const metadata = supabaseUser.user_metadata || {};
        const fullName = metadata.full_name || metadata.name || '';
        let firstName = metadata.first_name || '';
        let lastName = metadata.last_name || '';
        
        // If we have a full name but not first/last name, try to split it
        if (fullName && (!firstName || !lastName)) {
          const nameParts = fullName.split(' ');
          firstName = firstName || nameParts[0] || '';
          lastName = lastName || nameParts.slice(1).join(' ') || '';
        }
        
        // Try to get avatar URL
        const avatarUrl = metadata.avatar_url || metadata.picture || '';
        
        // Create a profile for this user
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUser.id,
            first_name: firstName,
            last_name: lastName,
            email: supabaseUser.email || '',
            avatar_url: avatarUrl,
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
          avatarUrl: newProfile.avatar_url || avatarUrl,
          role: newProfile.is_admin ? 'admin' : 'user',
          department: newProfile.department || undefined,
          position: newProfile.position || undefined,
        };
      }
      
      return null;
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

  // Fetch user profile from profiles table with better error handling
  const fetchProfile = async (userId: string, currentSession: Session | null) => {
    try {
      console.log("Fetching profile for user:", userId);
      
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

  // Handle hash fragment from OAuth redirects - simplified
  useEffect(() => {
    const handleAuthCallback = async () => {
      if (location.hash && location.hash.includes('access_token')) {
        setIsLoading(true);
        
        try {
          console.log("Processing OAuth callback...");
          
          // Try using our custom helper to process the hash
          const session = await processAuthHash();
          
          if (session) {
            console.log("Successfully processed auth hash with custom handler");
            setSession(session);
            await fetchProfile(session.user.id, session);
            
            // Ensure navigation happens after profile is loaded
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 500);
            return;
          }
          
          // If that fails, try manual extraction as a fallback
          console.log("Custom handler failed, trying manual extraction");
          
          // Capture the hash before clearing it
          const currentHash = location.hash;
          
          // Clear hash from URL immediately to prevent loops
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
          
          // Extract access token from hash
          const params = new URLSearchParams(currentHash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (!accessToken) {
            throw new Error("No access token found in URL");
          }
          
          // Try manual session setup with the tokens from the URL
          if (accessToken) {
            try {
              console.log("Trying manual session setup with tokens");
              
              // Extract more parameters
              const expiresIn = params.get('expires_in');
              const expiresAt = expiresIn ? Math.floor(Date.now() / 1000) + parseInt(expiresIn, 10) : undefined;
              
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || null,
                // Ensure correct type by casting
                ...(expiresIn ? { expires_in: parseInt(expiresIn, 10) } as any : {}),
                ...(expiresAt ? { expires_at: expiresAt } as any : {}),
                token_type: params.get('token_type') || 'bearer'
              });
              
              if (sessionError) {
                throw sessionError;
              }
              
              if (sessionData.session) {
                console.log("Manual session setup successful");
                setSession(sessionData.session);
                await fetchProfile(sessionData.session.user.id, sessionData.session);
                
                toast({
                  title: "Successfully signed in with Google",
                  description: "Welcome to MeetingMaster!",
                });
                
                // Ensure navigation after profile is loaded
                setTimeout(() => {
                  navigate('/dashboard', { replace: true });
                }, 500);
              }
            } catch (manualError) {
              console.error("Manual session setup failed:", manualError);
              throw manualError;
            }
          }
        } catch (error) {
          console.error("Error processing OAuth redirect:", error);
          toast({
            variant: "destructive",
            title: "Authentication failed",
            description: "Failed to authenticate with Google. Please try again.",
          });
          setIsLoading(false);
          navigate('/login');
        }
      }
    };
    
    handleAuthCallback();
  }, [location.hash, navigate]);

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
        console.log("Auth state changed:", event, session ? "Session exists" : "No session");
        setSession(session);
        
        if (session?.user) {
          setIsLoading(true);
          await fetchProfile(session.user.id, session);
        } else {
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
        
        // Handle specific auth events with improved navigation
        if (event === 'SIGNED_IN') {
          toast({
            title: "Successfully signed in",
            description: "Welcome to MeetingMaster!",
          });
          
          // Force navigation with delay to ensure state is updated
          setTimeout(() => {
            const currentPath = window.location.pathname;
            if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
              console.log("Signed in, navigating to dashboard");
              navigate('/dashboard', { replace: true });
            }
          }, 500);
        }
        
        if (event === 'SIGNED_OUT') {
          toast({
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
  }, [navigate]);

  // Improved login function with clearer error handling
  const login = async (email: string, password: string) => {
    let loginError: AuthError | undefined;
    
    try {
      console.log("Attempting login for email:", email);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Login error from Supabase:", error);
        loginError = error;
        
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message || "Please check your credentials and try again.",
        });
        
        setIsLoading(false);
        return { error };
      }
      
      console.log("Login successful, session created:", data.session ? "Yes" : "No");
      setSession(data.session);
      
      if (data.session?.user) {
        await fetchProfile(data.session.user.id, data.session);
        
        toast({
          title: "Login successful",
          description: "Welcome back to MeetingMaster!",
        });
        
        // Explicitly return successful login data
        return { data };
      }
      
      return { data };
    } catch (error) {
      console.error("Unexpected login error:", error);
      
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
      });
      
      setIsLoading(false);
      return { error: loginError || { message: "Unknown error occurred" } as AuthError };
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      console.log("Initiating Google login");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
          queryParams: {
            prompt: 'select_account',
          }
        },
      });
      
      if (error) {
        console.error("Google login initiation error:", error);
        throw error;
      }
      
      // Auth state change will be handled by the listener
    } catch (error) {
      console.error("Google login error:", error);
      const authError = error as AuthError;
      
      toast({
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
      
      toast({
        title: "Registration successful",
        description: "Welcome to MeetingMaster! Please check your email to verify your account.",
      });
      navigate('/login');
    } catch (error) {
      console.error("Registration error:", error);
      const authError = error as AuthError;
      
      toast({
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
      
      toast({
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
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      const authError = error as AuthError;
      
      toast({
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
      
      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in.",
      });
      navigate('/login');
    } catch (error) {
      console.error("Reset password error:", error);
      const authError = error as AuthError;
      
      toast({
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
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Update profile error:", error);
      
      toast({
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
