import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase, handleSupabaseError, storeOAuthState, processAuthHash } from "@/integrations/supabase/client";
import { User } from "@/types/user";
import { Session, AuthError } from "@supabase/supabase-js";
import { fetchProfile } from "@/utils/userTransform";
import { forceToDashboard } from "@/services/navigationService";

/**
 * Hook that provides all auth methods
 */
export const useAuthMethods = (
  setUser: (user: User | null) => void,
  setSession: (session: Session | null) => void,
  setIsLoading: (isLoading: boolean) => void,
  setIsAdmin: (isAdmin: boolean) => void,
  user: User | null,
  session: Session | null
) => {
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    let loginError: AuthError | undefined;
    
    try {
      console.log("🔑 Login: Attempting login for email:", email);
      setIsLoading(true);
      
      // STEP 1: Core authentication operation
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("🔑 Login: Error from Supabase:", error);
        loginError = error;
        
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message || "Please check your credentials and try again.",
        });
        
        setIsLoading(false);
        return { error };
      }
      
      if (!data.session || !data.user) {
        const errMsg = "Login succeeded but no session or user was returned";
        console.error("🔑 Login: " + errMsg);
        
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Authentication succeeded but session data is missing. Please try again.",
        });
        
        setIsLoading(false);
        return { error: { message: errMsg } as AuthError };
      }
      
      console.log("🔑 Login: Successful, user ID:", data.user.id);
      
      // STEP 2: Mark successful login globally using centralized approach
      localStorage.setItem('auth_success', 'true');
      localStorage.setItem('auth_timestamp', Date.now().toString());
      
      // STEP 3: Set session and user data synchronously
      setSession(data.session);
      
      // STEP 4: Try to get user profile data 
      try {
        const userData = await fetchProfile(data.user.id, data.session);
        if (userData) {
          console.log("🔑 Login: User profile fetched successfully");
          setUser(userData);
          setIsAdmin(userData.role === 'admin');
        }
      } catch (profileError) {
        console.error("🔑 Login: Error fetching user profile:", profileError);
        // Continue with login even if profile fetch fails
      }
      
      // STEP 5: Show success message
      toast({
        title: "Login successful",
        description: "Welcome back to MeetingMaster!",
      });
      
      // STEP 6: Use the centralized navigation service for reliable redirection
      console.log("🔑 Login: Redirecting to dashboard via navigation service");
      
      // Use a short delay to ensure state updates have completed
      setTimeout(() => {
        forceToDashboard('login-function');
      }, 100);
      
      // Clear loading state
      setTimeout(() => {
        setIsLoading(false);
      }, 200);
      
      return { data };
    } catch (error) {
      console.error("🔑 Login: Unexpected error:", error);
      
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
      
      // Store a state value for CSRF protection
      const state = storeOAuthState();
      
      // Use the redirectTo to ensure the proper page is loaded after login
      // Explicitly set the full URL to avoid any relative path issues
      const redirectUrl = `${window.location.origin}/dashboard`;
      console.log("Setting redirect URL:", redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',  // Request a refresh token
            state: state, // Add CSRF protection
          },
          skipBrowserRedirect: false, // Ensure browser is redirected
        },
      });
      
      if (error) {
        console.error("Google login initiation error:", error);
        throw error;
      }
      
      // Auth state change will be handled by the listener
      console.log("Google login initiated successfully, awaiting redirect");
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

  const resetPassword = async (password: string) => {
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
        const updatedUserData = await fetchProfile(user.id, session);
        if (updatedUserData) {
          setUser(updatedUserData);
          setIsAdmin(updatedUserData.role === 'admin');
        }
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
      const userData = await fetchProfile(user.id, session);
      if (userData) {
        setUser(userData);
        setIsAdmin(userData.role === 'admin');
      }
    }
  };

  return {
    login,
    loginWithGoogle,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshProfile
  };
};
